const { DOCKER } = require('KegConst/docker')
const { pullService } = require('KegUtils/services/pullService')
const { runInternalTask } = require('KegUtils/task/runInternalTask')
const { mergeTaskOptions } = require('KegUtils/task/options/mergeTaskOptions')

/**
 * Pulls the keg base docker image
 * @param {Object} args - arguments passed from the runTask method
 * @param {string} args.command - Initial command being run
 * @param {Array} args.options - arguments passed from the command line
 * @param {Object} args.tasks - All registered tasks of the CLI
 * @param {Object} globalConfig - Global config object for the keg-cli
 *
 * @returns {void}
 */
const pullBase = async (args) => {
  const pulledImage = await pullService({
    ...args,
    __internal: {
      ...args.__internal,
      forcePull: true
    },
    params: {
      ...args.params,
      tap: undefined,
      context: 'base',
      image: 'keg-base',
      tag: tag || version || branch
    }
  })

  return pulledImage
}

module.exports = {
  pull: {
    name: 'pull',
    alias: [ 'pl' ],
    action: pullBase,
    description: `Pushes a new keg-base docker image to the provider`,
    example: 'keg base pull',
    locationContext: DOCKER.LOCATION_CONTEXT.REPO,
    options: mergeTaskOptions(`base`, `pull`, `pull`),
  }
}