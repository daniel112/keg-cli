const { DOCKER } = require('KegConst/docker')
const { runInternalTask } = require('KegUtils/task/runInternalTask')
const { mergeTaskOptions } = require('KegUtils/task/options/mergeTaskOptions')

/**
 * Pushes a local keg-components image to a registry provider in the cloud
 * @param {Object} args - arguments passed from the runTask method
 * @param {string} args.command - Initial command being run
 * @param {Array} args.options - arguments passed from the command line
 * @param {Object} args.tasks - All registered tasks of the CLI
 * @param {Object} globalConfig - Global config object for the keg-cli
 *
 * @returns {void}
 */
const pushComponents = async (args) => {
  const pushedImage = await runInternalTask(
    'tasks.docker.tasks.provider.tasks.push',
    {
      ...args,
      command: 'push',
      params: {
        ...args.params,
        context: 'components',
        image: 'keg-components',
      }
    }
  )

  return pushedImage
}

module.exports = {
  push: {
    name: 'push',
    alias: [ 'psh' ],
    action: pushComponents,
    description: `Pushes a new keg-base docker image to the provider`,
    example: 'keg components push',
    options: mergeTaskOptions(`components`, `push`, `push`),
  }
}