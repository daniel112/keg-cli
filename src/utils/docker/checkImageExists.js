const docker = require('KegDocCli')
const { isBool } = require('@keg-hub/jsutils')
const { generalError } = require('../error/generalError')
const { getSetting } = require('../globalConfig/getSetting')

/**
 * Checks if a docker image already exists locally
 * @function
 * @param {string} params.context - Context or name of the container to check
 * @param {string} params.image - Name of image to check for
 * @param {string} params.tag - Tag of image to check for
 *
 * @returns {Boolean} - If the docker image exists
 */
const checkImageExists = async ({ context, image, tag }) => {
  tag = tag || getSetting('docker.defaultTag')

  // Use the image or the context
  const searchFor = image || context

  // If no image or context then throw
  !searchFor && generalError(`checkImageExists util requires a context or image argument!`)

  const searchImg = searchFor.includes(':') ? searchFor : `${searchFor}:${tag}`
  const exists = await docker.image.get(searchImg)

  return isBool(exists) ? exists : false
}

module.exports  = {
  checkImageExists
}