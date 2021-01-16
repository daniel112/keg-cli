const { get } = require('@keg-hub/jsutils')
const { DOCKER } = require('KegConst/docker')
const { runInternalTask } = require('KegUtils/task/runInternalTask')
const { mergeTaskOptions } = require('KegUtils/task/options/mergeTaskOptions')

/**
 * Pushes a local image to a registry provider in the cloud
 * @param {Object} args - arguments passed from the runTask method
 * @param {string} args.command - Initial command being run
 * @param {Array} args.options - arguments passed from the command line
 * @param {Object} args.tasks - All registered tasks of the CLI
 * @param {Object} args.task - Current task being run
 * @param {Object} args.params - Formatted key / value pair of the passed in options
 * @param {Object} globalConfig - Global config object for the keg-cli
 *
 * @returns {Promise<Void>}
 */
const tapPush = async (args) => {
  const pushedImage = await runInternalTask(
    'tasks.docker.tasks.provider.tasks.push',
    {
      ...args,
      command: 'push',
      params: {
        ...args.params,
        context: 'tap',
        image: get(args, 'params.tap') || 'tap',
      }
    }
  )

  return pushedImage
}

module.exports = {
  push: {
    name: 'push',
    alias: [ 'psh' ],
    action: tapPush,
    description: 'Pushes an image to a Docker registry provider',
    example: 'keg tap push <options>',
    options: mergeTaskOptions(`tap`, `push`, `push`),
  }
}