const { Logger } = require('KegLog')
const { executeCmd, spawnProc } = require('KegProc')
const {
  apiError,
  apiSuccess,
  noItemError,
  noLoginError,
  cmdSuccess,
} = require('./helpers')
const {
  isArr,
  isColl,
  isStr,
  toStr,
  exists
} = require('@keg-hub/jsutils')

/**
 * Calls the docker cli from the command line and returns the response
 * @function
 * @param {string} cmd - docker command to be run
 *
 * @returns {string} - cmd with docker added
 */
const ensureDocker = cmd => cmd.trim().indexOf('docker') === 0 ? cmd : `docker ${cmd}`

/**
 * Calls the docker cli from the command line and returns the response
 * @function
 * @param {Object} params - arguments used to modify the docker api call
 * @param {Object} params.opts - optional arguments to pass to the docker command
 * @param {Object} params.asObj - Return the response as an unformatted string
 * @param {Object} params.log - Log the docker command being run before running it
 * @param {Object} params.skipError - Skip showing an error if the docker command fails
 * @param {Object} [params.format=''] - Format the output of the docker command
 * @param {Object} params.force - Pass "--force" to the docker command, to force the operation
 * @param {Object} params.errResponse - On an error calling docker, this will be returned.
 *                                      If errResponse is undefined, the current process will exit
 *
 * @returns {Promise<string|Array>} - JSON array of items || stdout from docker cli call
 */
const dockerCli = async (params={}, cmdOpts={}) => {
  const { opts, errResponse, log, skipError, format='', force } = params

  const options = isArr(opts) ? opts.join(' ').trim() : toStr(opts)
  const useFormat = format === 'json' ? `--format "{{json .}}"` : format
  const useForce = force ? '--force' : ''

  const cmdToRun = ensureDocker(`${ options } ${ useForce } ${ useFormat }`.trim())

  log && Logger.spacedMsg(`Running command: `, cmdToRun)

  const { error, data } = await executeCmd(
    cmdToRun,
    cmdOpts
  )

  return error
    ? apiError(error, errResponse, skipError)
    : apiSuccess(data, format, skipError)

}

/**
 * Calls the docker cli with dynamic params
 * @function
 * @param {string} args - Arguments to make the docker cli call
 * @param {boolean} type - Type of docker cli call to make ( image, container )
 *
 * @returns {string|Array} - Response from the dockerCli command
 */
const dynamicCmd = async (args, type) => {
  // Ensure options are an array
  const opts = !args.opts ? [] : isArr(args.opts) ? args.opts : [ args.opts ]

  // Ensure the first option is image
  opts[0] !== type && opts.unshift(type)

  // run the docker cli command
  const res = await dockerCli({ ...args, opts })

  // Use the 1 index of options to get the container cmd
  return cmdSuccess(opts[1], res)
}

/**
 * Calls the docker remove command to remove a docker item
 * @function
 * @param {string} toRemove - Name or id of item to remove
 * @param {boolean} force - Should force remove the item
 *
 * @returns {Promise<string|Array>|Error}
 */
const remove = ({ item, force, skipError, type='' }, cmdOpts) => {
  return item
    ? dockerCli({
        force,
        skipError: skipError,
        opts: `${ type } rm ${ item }`.trim(),
      }, cmdOpts)
    : noItemError(`docker.remove`)
}

/**
 * Calls the docker login command to log into the passed int providerUrl
 * @function
 * @param {Object} creds - Credentials to log into a docker registry provider
 * @param {string} creds.providerUrl - The url used to log into the provider
 * @param {string} creds.user - User used to login to the provider
 * @param {string} creds.token - Auth token for the docker registry provider
 *
 * @returns {void}
 */
const login = async ({ providerUrl, user, token }) => {

  if(!providerUrl || !user || !token) noLoginError(providerUrl, user, token)

  // Use the --password-stdin to the token is not stored in the bash history
  const loginCmd = `echo ${ token } | docker login ${ providerUrl } --username ${user} --password-stdin`

  Logger.empty()
  Logger.info(`  Logging into docker provider "${ providerUrl }", with user "${ user }"`)
  Logger.empty()

  const { error, data } = await executeCmd(loginCmd)

  return error && !data
    ? apiError(error)
    : Logger.success(`  Docker ${ data }`)

}

/**
 * Pushes a local docker image to the docker provider base on the url
 * @function
 * @param {string} url - Url to push the image to
 *
 * @returns {void}
 */
const push = async url => {

  Logger.spacedMsg(`  Pushing docker image to url`, url)

  const { error, data } = await spawnProc(`docker push ${ url }`)

  return error && !data
    ? apiError(error)
    : Logger.success(`  Finished pushing Docker image to provider!`)
}

/**
 * Pulls a docker image from a provider to the local machine
 * @function
 * @param {string} url - Url to pull the image from
 *
 * @returns {void}
 */
const pull = async url => {

  Logger.spacedMsg(`  Pulling docker image from url`, url)

  const { error, data } = await spawnProc(`docker pull ${ url }`)

  return error && !data
    ? apiError(error)
    : Logger.success(`  Finished pulling Docker image from provider!`)

}

/**
 * Runs a raw docker cli command by spawning a child process
 * <br/> Auto adds docker to the front of the cmd if it does not exist
 * @function
 * @param {string} cmd - Docker command to be run
 * @param {string} args - Arguments to pass to the child process
 * @param {string} loc - Location where the cmd should be run
 *
 * @returns {*} - Response from the docker cli command
 */
const raw = async (cmd, args={}, loc=process.cwd()) => {
  const { log, ...cmdArgs } = args

  // Build the command to be run
  // Add docker if needed
  const cmdToRun = ensureDocker(cmd)

  log && Logger.spacedMsg(`Running command: `, cmdToRun)

  // Run the docker command
  const resp = await spawnProc(cmdToRun, cmdArgs, loc)
  if(!resp) return
  
  const { error, data } = resp

  error && !data
    ? apiError(error)
    : Logger.success(`Finished running Docker CLI command!`)
  
  return data
}

/**
 * Runs docker system prune command
 * @function
 * @param {Array|string} options - Options for the prune command
 *
 * @returns {*} - Response from the docker cli command
 */
const prune = opts => {
  return dockerCli({
    log: true,
    opts: [ 'system', 'prune'].concat(isArr(opts) ? opts : [ opts ]),
  })
}

/**
 * Runs docker inspect for the passed in item reference
 * @function
 * @param {Object|string} args - Arguments to pass to the docker image command
 * @param {string} args.item - Reference to the docker item
 * @param {boolean} args.parse - Should parse the response into JSON
 * @param {string} [args.format=json] - Format the returned results
 * @param {boolean} [args.skipError=false] - Should skip throwing an error
 * @param {boolean} [args.log=false] - Should log docker commands as the are run
 *
 * @returns {string|Object} - Docker inspect meta data
 */
const inspect = async args => {

  // Ensure the args are an object
  const toInspect = isStr(args) ? { item: args, format: 'json' } : args

  // Ensure we have an item to inspect
  !toInspect.item &&
    !params.skipError && 
    noItemError(`docker.inspect`)

  // Build the command, and add format if needed
  let cmdToRun = [ `inspect`, toInspect.item ]
  toInspect.type && cmdToRun.unshift(toInspect.type)

  // Call the docker inspect command
  const inspectData = await dockerCli({
    opts: cmdToRun,
    format: exists(toInspect.format) ? toInspect.format : 'json',
    log: exists(toInspect.log) ? toInspect.log : false,
  })

  // Check if the response should be parsed
  const parse = toInspect.parse ? toInspect.parse : true

  // If no parsing, or it's already a collection, just return it
  if(!parse || isColl(inspectData)) return inspectData

  try {
    // Parse the data, and return the first found item
    const parsed = JSON.parse(imgInfo)
    return isArr(parsed)
      ? parsed[0]
      : isObj(parsed)
        ? parsed
        : {}
  }
  catch(error){
    if(cmdArgs.skipError) return {}
  
    Logger.error(error.stack)
    Logger.empty()

    Logger.info(`Docker Inspect Response:`)
    Logger.data(inspectData)

    process.exit(1)
  }

}

/**
 * Runs docker system prune command
 * @function
 * @param {Array|string} options - Options for the prune command
 *
 * @returns {*} - Response from the docker cli command
 */
const log = (args, cmdArgs={}) => {
  const { opts, follow, container, item, log } = args

  // Get any previously set options
  const options = isArr(opts) ? opts : []

  // Add the container to be logged
  options.push(container || item)

  // Check if we should follow / tail the logs
  // Also check if follow has already been added
  follow &&
    !options.includes('-f') &&
    !options.includes('-follow') &&
    options.unshift('-f')

  const cmd = [ 'docker', 'logs' ].concat(options).join(' ')

  log && Logger.spacedMsg(`  Running command: `, cmd)

  return raw(cmd, cmdArgs)
}

module.exports = {
  dockerCli,
  dynamicCmd,
  inspect,
  login,
  log,
  logs: log,
  prune,
  pull,
  push,
  raw,
  remove
}
