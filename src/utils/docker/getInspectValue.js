const docker = require('KegDocCli')
const { get, isObj } = require('@keg-hub/jsutils')

/**
 * Gets the docker inspect meta data from the docker cli as an object
 * <br/> If am inspectPath path is passed, the it will try to find the value within the inspect object
 * @function
 * @param {string|Object} item - Docker item ( id || name ) to inspect ( image || container )
 * @param {string} [inspectPath=null] - Path on the inspect object to return
 * @param {string} [type=image] - Type of docker item to inspect ( image || container )
 *
 * @returns {Object} - Inspect object or property based on inspectPath
 */
const getInspectValue = async (item, inspectPath=null, type='image') => {
  const docArgs = isObj(item) ? item : { item, type, path: inspectPath }
  const inspectObj = await docker.inspect(docArgs)

  return docArgs.path ? get(inspectObj, docArgs.path) : inspectObj
}

module.exports = {
  getInspectValue
}