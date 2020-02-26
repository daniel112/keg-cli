const { isObj, isFunc, reduceObj } = require('jsutils')
const { buildTaskAlias } = require('../utils/builders/buildTaskAlias')

/**
 * Initializes tasks for the CLI. Loads all default and custom tasks
 * @param {Object|Function} tasks - CLI tasks to load
 * @param {Object} config - CLI global config object
 *
 * @returns {Object} - All loaded CLI tasks
 */
const initialize = (tasks, name, config) => {
  const parentTasks = isFunc(tasks) ? tasks(config) : isObj(tasks) ? tasks : {}

  return reduceObj(parentTasks, (key, value, updates) => {
    const parentTask = parentTasks[key]
    return {
      ...updates,
      ...buildTaskAlias(parentTask, name),
    }
  }, {})

}

module.exports = config => {
  return {
    ...initialize(require('./global'), 'global', config),
    ...initialize(require('./generate'), 'generate', config),
    // ...initialize(require('./components'), config),
    // ...initialize(require('./core'), config),
    // ...initialize(require('./general'), config),
    // ...initialize(require('./taps'), config),
    // ...initialize(require('./customTasks'), config),
  }
}