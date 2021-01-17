const docker = require('KegDocCli')
const { get } = require('@keg-hub/jsutils')
const { getFromImage } = require('./getFromImage')
const { getKegContext } = require('./getKegContext')
const { getSetting } = require('../globalConfig/getSetting')
const { getContainerConst } = require('../docker/getContainerConst')
const { isDockerId } = require('../docker/isDockerId')
const { getGlobalConfig } = require('../globalConfig/getGlobalConfig')

// TODO:
// This should replace all calls to getBaseTag
// And anywhere where the url, image and tag are needed

/**
 * Finds the provider and namespace to use based on passed in params and urlSplit
 * @function
 * @param {Array} urlSplit - An image url split at /, with the last item removed
 * @param {string} provider - Custom provider to use for image when pulling or pushing
 * @param {string} namespace - Custom namespace to use for image when pulling or pushing
 *
 * @returns {Object} - Parsed image name data from passed in image url
 */
const getProviderAndNamespace = (urlSplit, provider, namespace) => {

  // Add the provider and namespace if they exist
  const imgData = {}
  provider && (imgData.provider = provider)
  namespace && (imgData.namespace = namespace)

  // If a provider and namespace exist, then we have everything, so return it
  if(provider && namespace) return imgData

  // Otherwise parse out the provider and namespace from the urlSplit
  const [ urlProvider, urlNamespace ] = urlSplit.length > 1
    ? [ urlSplit.shift(), urlSplit.join('/') ]
    : urlSplit

  // Set the provider and namespace if they don't already exist
  !imgData.provider && urlProvider && (imgData.provider = urlProvider)
  !imgData.namespace && urlNamespace && (imgData.namespace = urlNamespace)

  return imgData
}

/**
 * Parses an image url to get the name, provider and namespace
 * @function
 * @param {string} imgUrl - Original url to be parsed
 * @param {string} provider - Custom provider to use for image when pulling or pushing
 * @param {string} namespace - Custom namespace to use for image when pulling or pushing
 *
 * @returns {Object} - Parsed image name data from passed in image url
 */
const getNameFromUrl = (imgUrl, provider, namespace) => {
  // If no url return empty
  if(!imgUrl) return {}

  // If it doesn't include a / then is just a name and not a url
  if(!imgUrl.includes('/')) return { image: imgUrl }

  // Otherwise split the url to get the name and url separated
  const urlSplit = imgUrl.split('/')

  return {
    // Get the last item to get the image name
    image: urlSplit.pop(),
    // Check for more items in the url split to get the provider and namespace
    ...getProviderAndNamespace(urlSplit, provider, namespace)
  }
}

const getTagFromName = (imgName, tag) => {
  // If no image name, just return the tag
  if(!imgName) return { tag }

  // Otherwise try to pull the tag from the imageName if it exists
  const [ image, tagFromName ] = imgName.includes(':')
    ? imgName.split(':')
    : [ imgName ]

  // Create an object to hold the parse image data
  const imgData = { image }
  // Get the param tag or the tag from the image
  const imgTag = tag || tagFromName

  // Add the tag to the image object if it exists
  imgTag && (imgData.tag = imgTag)

  // return the image data object
  return imgData
}

/**
 * Gets the KEG_BASE_IMAGE from the context's ENV's
 * Then parses it to get the image name context information
 * @function
 * @param {string} context - Name of the image name to be parsed
 *
 * @returns {Object} - Parsed image name data from the KEG_BASE_IMAGE env
 */
const getBaseFromEnv = (context) => {
  const baseFromEnv = getContainerConst(context, `env.keg_base_image`)

  // If no baseFrom env, just return
  if(!baseFromEnv) return {}

  // Parse the url, name, tag from the env
  const nameAndUrl = getNameFromUrl(baseFromEnv)
  const nameAndTag = getTagFromName(nameAndUrl.image)

  // Set the default tag if one does not exist
  nameAndTag.tag = nameAndTag.tag || getSetting('docker.defaultTag')

  return {
    ...nameAndUrl,
    ...nameAndTag,
  }

}

/**
 * Adds the default provider and namespace if they don't already exist
 * <br/> Also build the image with the tag added and the full tag with all parts
 * @function
 * @param {Object} imgNameWTag - Options passed to the task from the command line
 * @param {string} imgNameWTag.image - Name of the image without out tags or provider
 * @param {string} imgNameWTag.tag - Found tag to use with the image
 * @param {string} [imgNameWTag.provider] - Found provider to use for image when pulling or pushing
 * @param {string} [imgNameWTag.namespace] - Found namespace to use for image when pulling or pushing
 *
 * @returns {Object} - Parse image data
 */
const buildImgVariants = imgNameWTag => {
  imgNameWTag.imageWTag = `${imgNameWTag.image}:${imgNameWTag.tag}`
  imgNameWTag.full = `${imgNameWTag.provider}/${imgNameWTag.namespace}/${imgNameWTag.imageWTag}`

  return imgNameWTag
}

/**
 * Funds the first truthy value in an array of values
 * @function
 * @param {Object} args - Array of possiable values
 *
 * @returns {Object} - found truthy value or undefined
 */
const findTruthyVal = (...args) => {
  return args.reduce((found, val) => found || val || undefined, undefined)
}

/**
 * Funds the first truthy value in an array of values
 * @function
 * @param {Object} args - Array of possiable values
 *
 * @returns {Object} - found truthy value or undefined
 */
const checkDockerId = async params => {
  const { image, context, provider, namespace, tag } = params

  const docImg = isDockerId(image)
    ? await docker.image.get(image)
    : isDockerId(image) && await docker.image.get(context)
  
  return !docImg
    ? params
    : {
        provider,
        namespace,
        ...docImg.repository.includes('/')
          ? getProviderAndNamespace(
              // TODO: double check slice gives the correct array
              docImg.repository.split('/').slice(0, 2),
              findTruthyVal(
                provider,
                // TODO need to also pass in image data from docImg.repository
                // This may have the provider and provider data on it
                get(globalConfig, 'docker.providerUrl'),
              ),
              findTruthyVal(
                namespace,
                // TODO need to also pass in image data from docImg.repository
                // This may have the provider and namespace data on it
                get(globalConfig, 'docker.namespace'),
              )
            )
          : {},
          tag: tag || docImg.tag,
          image: docImg.rootId,
      }

}

/**
 * Gets an images provider, namespace, name, and tag from the passed in params or uses defaults
 * <br/> Uses the KEG_BASE_IMG env from the contexts values.yml file ENV's
 * @function
 * @param {Object} params - Options passed to the task from the command line
 * @param {string} params.image - Original image of the image
 * @param {string} params.context - Context of the image being parsed
 * @param {string} params.tap - Name of the tap when context is `tap`
 * @param {string} params.tag - Custom tag to use for the image
 * @param {string} params.provider - Custom provider to use for image when pulling or pushing
 * @param {string} params.namespace - Custom namespace to use for image when pulling or pushing
 *
 * @returns {Object} - Parse image data
 */
const getImgNameContext = async params => {

  // TODO: Add test for checking docker image id
  // Validate the output
  const paramsFromId = await checkDockerId(params)
  if(params !== paramsFromId)
    return buildImgVariants(paramsFromId)

  const {
    tag,
    tap,
    image,
    context,
    provider,
    namespace,
  } = paramsFromId

  // Separate the url, image and tag if needed
  const nameAndUrl = image
    ? getNameFromUrl(image, provider, namespace)
    : {}

  // Get the tag from the image name
  const nameAndTag = getTagFromName(nameAndUrl.image, tag)
  const baseFromEnv = getBaseFromEnv(getKegContext(tap || context || nameAndTag.image))
  const globalConfig = getGlobalConfig()
  
  // The the image name and tag from the passed in params or KEG_BASE_IMG
  return buildImgVariants({
    ...baseFromEnv,
    ...nameAndUrl,
    ...nameAndTag,
    tag: findTruthyVal(
      tag,
      nameAndTag.tag,
      baseFromEnv.tag,
      getSetting('docker.defaultTag'),
    ),
    provider: findTruthyVal(
      provider,
      nameAndUrl.provider,
      baseFromEnv.provider,
      get(globalConfig, 'docker.providerUrl'),
    ),
    namespace: findTruthyVal(
      namespace,
      nameAndUrl.namespace,
      baseFromEnv.namespace,
      get(globalConfig, 'docker.namespace'),
    )
  })
}

module.exports = {
  getImgNameContext
}