const docker = require('KegDocCli')
const { buildService } = require('./buildService')
const { getServiceArgs } = require('./getServiceArgs')
const { exists, get, isObj } = require('@keg-hub/jsutils')
const { runInternalTask } = require('../task/runInternalTask')
const { getImageNameAndTag } = require('../getters/getImageNameAndTag')
const { shouldPullImage } = require('../getters/shouldPullImage')

/**
 * Checks if the base image should be pulled
 * @function
 * @param {Object} serviceArgs - Parsed option arguments passed to the current task
 * @param {boolean} internalForce - Internal Keg-CLI argument to force pulling the image
 * @param {boolean} paramForce - Force pull from params
 *
 * @returns {boolean} - Should the keg-base image be pulled
 */
const checkPullImage = ({ force, ...params}, internalForce) => {
  return exists(force)
    ? force
    : exists(internalForce)
      ? internalForce
      : await shouldPullImage(params)
}

/**
 * Checks the if a new base image should be pulled, and pulls it if needed
 * @param {Object} serviceArgs - Parsed option arguments passed to the current task
 *
 * @returns {*} - Response from the docker pull task
 */
const pullService = async (serviceArgs) => {

  // Check if the image should be pulled
  const shouldPull = checkPullImage(
    params,
    get(serviceArgs, '__internal.forcePull'),
  )

  // Check and pull the image if needed
  const pulledImg = !shouldPull
    ? { isNewImage: false }
    : await runInternalTask('docker.tasks.provider.tasks.pull', { 
        ...args,
        params: {
          ...args.params,
          ...getImageNameAndTag(args),
        }
      })

  return pulledImg
}

module.exports = {
  pullService
}