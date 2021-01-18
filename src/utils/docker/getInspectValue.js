const docker = require('KegDocCli')
const { get } = require('@keg-hub/jsutils')

/**
 * Gets the docker inspect meta data from the docker cli as an object
 * <br/> If am inspectPath path is passed, the it will try to find the value within the inspect object
 * @function
 * @param {string} item - Docker item ( id || name ) to inspect ( image || container )
 * @param {string} [inspectPath=undefined] - Path on the inspect object to return
 * @param {string} [type=undefined] - Type of docker item to inspect ( image || container )
 *
 * @returns {Object} - Inspect object or property based on inspectPath
 */
const getInspectValue = async (item, inspectPath, type) => {
  const inspectObj = await docker.inspect({ item, type })
  return inspectPath ? get(inspectObj, inspectPath) : inspectObj
}

module.exports = {
  getInspectValue
}