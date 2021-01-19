// Ensure our aliases work in Jest
require('module-alias/register')
// Override the console methods
require('KegMocks/logger/console')
const { __updateGlobalConfig } = require('KegUtils/globalConfig/globalConfigCache')

const path = require('path')

// Override the logger by default
// Will get reset in the Logger tests
const { Logger } = require('KegMocks/logger')
jest.setMock('KegLog', { Logger })

const Tasks = require('KegTasks')
const { getTask } = require('KegMocks/helpers/testTasks')

// Globally set the timeout
jest.setTimeout(15000)

global.cliTasks = Tasks
global.getTask = getTask
global.testMocks = global.testMocks || {}
global.cliRootDir = path.join(__dirname, '../../')

global.loadMockEnvs = (envs={}) => {
  const originalEnvs = { ...process.env }

  const mockEnvs = { ...require('KegMocks/helpers/mockEnvs'), ...envs}
  Object.assign(process.env, mockEnvs)

  return () => {
    process.env = originalEnvs
  }

}

// Setup our cache holder
global.getGlobalCliConfig = reset => {
  if(reset) delete require.cache[require.resolve('KegMocks/helpers/globalConfig')]
  const globalConfig = require('KegMocks/helpers/globalConfig')
  __updateGlobalConfig(globalConfig)

  return globalConfig
}
