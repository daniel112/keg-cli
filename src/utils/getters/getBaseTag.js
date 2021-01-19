const { getImgFrom } = require('./getImgFrom')
const { getContainerConst } = require('../docker/getContainerConst')

/**
 * Gets the base tag from the KEG_BASE_IMAGE env or the getFromImg helper
 * @function
 * @param {Object} params - Parsed command line options
 * @param {string} cmdContext - The current context of the task being run (core, components, tap)
 *
 * @returns {string} - Found base image tag
 */
const getBaseTag = (params, cmdContext) => {
  const fromImg = getImgFrom(params, getContainerConst(cmdContext, 'env'), cmdContext)
  const fromTag = fromImg && fromImg.includes(':') ? fromImg.split(':')[1] : false

  return fromTag || getSetting('docker.defaultTag')
}


module.exports = {
  getBaseTag
}