const { checkImageExists } = require('../docker/checkImageExists')
const { getImagePullPolicy } = require('../getters/getImagePullPolicy')

/**
 * Checks if new Docker images should be pulled when a docker command is run
 * @function
 * @param {string} params.context - Context or name of the container to check
 * @param {string} params.image - Name of image to check for
 * @param {string} params.tag - Tag of image to check for
 *
 * @returns {boolean} - Should the docker image be pulled
 */
const shouldPullImage = params => {
  const pullPolicy = getImagePullPolicy(params.context || params.image)

  // If should never pull image and the image exists return false
  // Else check if the set to ifnotpresent and return if the image exists
  // Else return true
  return pullPolicy === 'never'
    ? false
    : pullPolicy === 'ifnotpresent'
      ? checkImageExists(params)
      : true
}

module.exports = {
  shouldPullImage
}