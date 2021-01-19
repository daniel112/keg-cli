const docker = require('KegDocCli')
const { Logger } = require('KegLog')
const { get, noOpObj } = require('@keg-hub/jsutils')
const { getImgNameContext } = require('KegUtils/getters/getImgNameContext')
const { mergeTaskOptions } = require('KegUtils/task/options/mergeTaskOptions')
const { generalError } = require('KegUtils/error/generalError')

/**
 * Pulls an image locally from a configured registry provider in the cloud
 * @param {Object} args - arguments passed from the runTask method
 * @param {string} args.command - Initial command being run
 * @param {Array} args.options - arguments passed from the command line
 * @param {Object} args.tasks - All registered tasks of the CLI
 * @param {Object} args.task - Current task being run
 * @param {Object} args.params - Formatted key / value pair of the passed in options
 * @param {Object} globalConfig - Global config object for the keg-cli
 *
 * @returns {Object} - Current state of the image to be pulled
 */
const providerPull = async args => {
  const { globalConfig, __internal=noOpObj, params, task } = args

  // Get the image name context, so we can pull the image
  const imgNameContext = __internal.imgNameContext || await getImgNameContext(params)

  // Try to pull the image
  const pulledRes = await docker.pull(imgNameContext.full)

  // // Get the docker image object that was just pulled
  const imageRef = await docker.image.get(imgNameContext.full)
  const isNewImage = !pulledRes.includes('Image is up to date')

  // Return the state of the image being pulled
  return { imgNameContext, isNewImage, imageRef }

}


module.exports = {
  pull: {
    name: 'pull',
    alias: [ 'pl' ],
    action: providerPull,
    description: 'Pulls an image from a Docker registry provider',
    example: 'keg docker provider pull <options>',
    options: mergeTaskOptions(`docker provider`, `pull`, `pull`),
  }
}