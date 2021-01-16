const { getFromImage } = require('./getFromImage')
const { getContainerConst } = require('../docker/getContainerConst')
const { getSetting } = require('../globalConfig/getSetting')

const getNameFromUrl = imgUrl => {
  // If no url return empty
  if(!imgUrl) return {}

  // If it doesn't include a / then is just a name and not a url
  if(!imgUrl.includes('/')) return { image: imgUrl }

  // Otherwise split the url to get the name and url separated
  const urlSplit = imgUrl.split('/')

  return {
    // Get the last item to get the image name
    image: urlSplit.pop(),
    // Join the rest to create the url
    providerUrl: urlSplit.join('/'),
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

const ensureImageAndTag = (imageFromEnv, imageFromParams) => {

  // If no params image and tag, then return the Env image
  if (!imageFromParams.image && !imageFromParams.tag)
    return imageFromEnv

  // if there's an image but no tag use the tag from the env
  if(imageFromParams.image && !imageFromParams.tag)
    return {
      ...imageFromEnv,
      ...imageFromParams,
      tag: imageFromEnv.tag,
    }

  // If theres no image, but there is a tag from params use it
  if(!imageFromParams.image && imageFromParams.tag)
    return {
      ...imageFromEnv,
      ...imageFromParams,
    }

}


// TODO: Need to write tests
// This should replace all calls to getBaseTag
// And anywhere where the url, image and tag are needed
console.log(`Write tests for this!!!`)

const getImageNameAndTag = (params, cmdContext) => {
  const { image, context, tag, tap } = params

  // Separate the url, image and tag if needed
  const nameAndUrl = image
    ? getNameFromUrl(image)
    : {}

  const nameAndTag = nameAndUrl.image
    ? getTagFromName(nameAndUrl.image, tag)
    : nameAndUrl

  // The the image name and tag from the passed in params or KEG_BASE_IMG
  const imgNameWTag = ensureImageAndTag(
    getBaseFromEnv(tap || context || nameAndTag.image),
    { ...nameAndUrl, ...nameAndTag }
  )

  imgNameAndTag.imageWTag = `${imgNameAndTag.image}:${imgNameWTag.imgTag}`
  imgNameAndTag.full = `${providerUrl}/${imgNameAndTag.imageWTag}`

  return imgNameAndTag
}


module.exports = {
  getImageNameAndTag
}