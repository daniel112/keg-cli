const { injectedTest, injectedContainer } = require('KegMocks/injected/injectedTest')
const { docker } = require('KegMocks/libs/docker')

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
const container = global.testDocker.containers.core


const { getImgNameContext } = require('../getImgNameContext')

const testArgs = {
  fullUrl: {
    description: 'It should return the imageName context from just an image url',
    inputs: { image: `docker.pkg.github.com/test-org/test-path/test-app:test-tag` },
    outputs: {
      image: 'test-app',
      provider: 'docker.pkg.github.com',
      namespace: 'test-org/test-path',
      tag: 'test-tag',
      imageWTag: 'test-app:test-tag',
      full: 'docker.pkg.github.com/test-org/test-path/test-app:test-tag'
    }
  },
  imgName: {
    description: 'It should return the imageName context with only an image name',
    inputs: { image: 'keg-core' },
    outputs: {
      image: 'keg-core',
      provider: 'docker.pkg.github.com',
      namespace: 'simpleviewinc/keg-packages',
      tag: 'master',
      imageWTag: 'keg-core:master',
      full: 'docker.pkg.github.com/simpleviewinc/keg-packages/keg-core:master'
    }
  },
  imgTag: {
    description: 'It should return the imageName context with a custom tag and context',
    inputs: { context: 'injected', tag: 'test-tag' },
    outputs: {
      image: 'tap-injected-test',
      provider: 'docker.pkg.github.com',
      namespace: 'simpleviewinc/keg-packages',
      tag: 'test-tag',
      imageWTag: 'tap-injected-test:test-tag',
      full: 'docker.pkg.github.com/simpleviewinc/keg-packages/tap-injected-test:test-tag'
    }
  },
  context: {
    description: 'It should return the imageName context with only a context',
    inputs: { context: 'components' },
    outputs: {
      image: 'keg-components',
      tag: 'master',
      provider: 'docker.pkg.github.com',
      namespace: 'simpleviewinc/keg-packages',
      imageWTag: 'keg-components:master',
      full: 'docker.pkg.github.com/simpleviewinc/keg-packages/keg-components:master'
    }
  },
  injected: {
    description: 'It should return the imageName context for injected apps',
    inputs: { context: 'injected', tap: 'injected' },
    outputs: {
      image: 'tap-injected-test',
      tag: 'main',
      provider: 'docker.pkg.github.com',
      namespace: 'simpleviewinc/keg-packages',
      imageWTag: 'tap-injected-test:main',
      full: 'docker.pkg.github.com/simpleviewinc/keg-packages/tap-injected-test:main'
    }
  },
  tagOverride: {
    description: 'It should override the image tag',
    inputs: { context: 'components', tag: 'test-tag' },
    outputs: {
      image: 'keg-components',
      tag: 'test-tag',
      provider: 'docker.pkg.github.com',
      namespace: 'simpleviewinc/keg-packages',
      imageWTag: 'keg-components:test-tag',
      full: 'docker.pkg.github.com/simpleviewinc/keg-packages/keg-components:test-tag'
    }
  },
  providerOverride: {
    description: 'It should override the docker provider',
    inputs: { context: 'core', provider: 'my.test-provider.com' },
    outputs: {
      image: 'keg-core',
      tag: 'master',
      provider: 'my.test-provider.com',
      namespace: 'simpleviewinc/keg-packages',
      imageWTag: 'keg-core:master',
      full: 'my.test-provider.com/simpleviewinc/keg-packages/keg-core:master'
    }
  },
  namespaceOverride: {
    description: 'It should override the url namespace',
    inputs: { context: 'components', namespace: 'test-namespace' },
    outputs: {
      image: 'keg-components',
      tag: 'master',
      provider: 'docker.pkg.github.com',
      namespace: 'test-namespace',
      imageWTag: 'keg-components:master',
      full: 'docker.pkg.github.com/test-namespace/keg-components:master'
    }
  },
}

describe('getImgNameContext', () => {

  afterAll(() => jest.resetAllMocks())

  Object.entries(testArgs).map(([name, data]) => {
    it(data.description, () => {
      expect(getImgNameContext(data.inputs)).toEqual(data.outputs)
    })
  })

})