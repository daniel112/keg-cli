const { get, isStr, noOpObj } = require('@keg-hub/jsutils')
const { getContainerConst } = require('KegUtils/docker/getContainerConst')

/**
 * Gets the image to use as the KEG_FROM_IMAGE env based on params context envs, or the image name
 * @function
 * @param {Object} [params={}] - Parsed options passed in from the command line
 * @param {Object} [contextEnvs={}] - loaded ENVs based on the context
 * @param {string} context - The image or context to get the fromImage for
 *
 * @returns {string} - Found from image
 */
const getImgFrom = (params=noOpObj, contextEnvs=noOpObj, context) => {
  context = context ||
    get(params, `__injected.tap`) ||
    get(params, 'cmdContext') ||
    get(params, 'context')

  const fromImg = get(params, 'from') || get(contextEnvs, 'KEG_BASE_IMAGE')

  return fromImg || !context
    ? fromImg
    : getContainerConst(
        context,
        `env.keg_base_image`,
        getContainerConst(context, `env.image`, context)
      )
}

module.exports = {
  getImgFrom
}
