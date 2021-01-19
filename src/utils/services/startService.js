const { get, set } = require('@keg-hub/jsutils')
const { composeService } = require('./composeService')
const { pullService } = require('./pullService')
const { proxyService } = require('./proxyService')
const { getServiceArgs } = require('./getServiceArgs')

/**
 * Runs the build service, then the compose service
 * @function
 * @param {Object} args - Default task arguments passed from the runTask method
 * @param {Object} exArgs - Extra arguments to run the service
 * @param {string} exArgs.context - The context to run the `docker-compose` command in
 * @param {string} exArgs.container - Name of the container to run
 * @param {string} exArgs.image - Name of the image used to run the container
 * @param {string} exArgs.tap - Name of the tap to run the `docker-compose` command in
 *
 * @returns {*} - Response from the compose service
 */
const startService = async (args, exArgs) => {
  // Build the service arguments
  const serviceArgs = getServiceArgs(args, exArgs)

  // Call the proxy service to make sure that is running
  await proxyService(serviceArgs)

  // Call the build service to ensure required images are built 
  const { isNewImage, ...pullServiceRes } = await pullService(serviceArgs)
  
  // TODO: If a new image was pulled, then we want to force recreate new images
  // So update the args.params to ensure recreate is true when passing to composeService

  // Call and return the compose server
  return composeService(args, exArgs)

}

module.exports = {
  startService
}
