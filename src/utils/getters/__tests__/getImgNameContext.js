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
  imageId: {
    description: 'It should allow passing in an image id',
    inputs: { image: 'a56406239194' },
    outputs: {
      image: 'keg-components',
      tag: '0.0.1',
      provider: 'docker.pkg.github.com',
      namespace: 'simpleviewinc/keg-packages',
      imageWTag: 'keg-components:0.0.1',
      full: 'docker.pkg.github.com/simpleviewinc/keg-packages/keg-components:0.0.1'
    }
  },
  contextId: {
    description: 'It should allow passing in an image id as the context',
    inputs: { context: 'b80dcb1cac10', tag: 'master' },
    outputs: {
      image: 'keg-core',
      tag: 'master',
      provider: 'docker.pkg.github.com',
      namespace: 'simpleviewinc/keg-packages',
      imageWTag: 'keg-core:master',
      full: 'docker.pkg.github.com/simpleviewinc/keg-packages/keg-core:master'
    }
  },
  contextIdOverride: {
    description: 'It should allow passing in an id as the context and override with inputs ',
    inputs: { context: 'b80dcb1cac10', provider: 'test-provider', namespace: 'test-namespace' },
    outputs: {
      image: 'keg-core',
      tag: '0.0.1',
      provider: 'test-provider',
      namespace: 'test-namespace',
      imageWTag: 'keg-core:0.0.1',
      full: 'test-provider/test-namespace/keg-core:0.0.1'
    }
  },
}

describe('getImgNameContext', () => {

  afterAll(() => jest.resetAllMocks())

  testEnum(testArgs, getImgNameContext)

})