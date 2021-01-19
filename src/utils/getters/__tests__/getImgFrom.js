const { injectedTest, injectedContainer } = require('KegMocks/injected/injectedTest')
const { docker } = require('KegMocks/libs/docker')
const { testEnum } = require('KegMocks/jest/testEnum')

const globalConfig = global.getGlobalCliConfig()
jest.setMock('../../globalConfig/globalConfigCache', {
  __getGlobalConfig: jest.fn(() => globalConfig)
})
const { DOCKER } = require('KegConst/docker')
const withInjected = {
  ...DOCKER.CONTAINERS,
  INJECTED: injectedContainer
}
jest.setMock('KegConst/docker', { DOCKER: { ...DOCKER, CONTAINERS: withInjected }})
jest.setMock('KegDocCli', docker)

const { getImgFrom } = require('../getImgFrom')

const testArgs = {
  context: {
    description: 'It should return KEG_BASE_FROM env for the passed in context',
    inputs: [ { context: 'core' }, {} ],
    outputs: 'keg-core:master'
  },
  contextEnvs: {
    description: 'It should return KEG_BASE_FROM env from passed in ENVs over the context',
    inputs: [ { context: 'tap' }, { KEG_BASE_IMAGE: 'test-tap:override' } ],
    outputs: 'test-tap:override'
  },
  fromParams: {
    description: 'It should return from param when it exists',
    inputs: [ { context: 'tap', from: 'test-param-from:test-tag' } ],
    outputs: 'test-param-from:test-tag'
  },
  fromOverrideEvs: {
    description: 'It should use the from param over the context envs',
    inputs: [{ from: 'from-override:test-tag' }, { KEG_BASE_IMAGE: 'test-tap:override' }, 'tap'],
    outputs: 'from-override:test-tag'
  },
  fromOverrideContext: {
    description: 'It should use the from param over the context',
    inputs: [{ context: 'core', from: 'from-override:test-tag' }, {}, 'core'],
    outputs: 'from-override:test-tag'
  },
}

describe('getImgFrom', () => {

  afterAll(() => jest.resetAllMocks())

  testEnum(testArgs, getImgFrom)

})