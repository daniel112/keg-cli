const path = require('path')

const homeDir = require('os').homedir()
const cliRoot = path.join(__dirname, '../../../')
const kegHub = process.env.KEG_ROOT_DIR || path.join(homeDir, './keg-hub')
const kegRepos = path.join(kegHub, 'repos')
const kegTaps = path.join(kegHub, 'taps')

module.exports = {
  version: '1.0.0',
  name: 'keg-cli',
  displayName: 'Keg CLI',
  docker: {
    providerUrl: 'docker.pkg.github.com',
    namespace: "simpleviewinc/keg-packages",
    user: 'testuser',
    token: ''
  },
  cli: {
    git: {
      orgName: 'simpleviewinc',
      orgUrl: 'https://github.com/simpleviewinc',
      repos: {
        hub: "keg-hub",
        rc: 'tap-release-client',
      },
      publicToken: '123456789',
      sshKey: path.join(homeDir, '.ssh/github'),
      key: '123456789'
    },
    paths: {
      keg: kegHub,
      hub: kegHub,
      repos: kegRepos,
      taps: kegTaps,
      cli: path.join(kegRepos, 'keg-cli'),
      components: path.join(kegRepos, 'keg-components'),
      containers: path.join(kegRepos, 'keg-cli/containers'),
      core: path.join(kegRepos, 'keg-core'),
      proxy: path.join(kegRepos, 'keg-proxy'),
      resolver: path.join(kegRepos, 'tap-resolver'),
      customTasks: ''
    },
    settings: {
      docker: {
        preConfirm: false,
        buildKit: true,
        defaultLocalBuild: true,
        force: true,
        imagePullPolicy: "Always",
        defaultTag: "master"
      },
      git: {
        secure: false
      },
      editorCmd: 'code',
      errorStack: false
    },
    taps: {
      test: {
        path: path.join(cliRoot, 'src/__mocks__/tap')
      },
    }
  },
  publish: {
    test: {
      name: 'test',
      dependent: true,
      order: {
        0: '@keg-hub/re-theme',
        1: '@keg-hub/keg-components',
        2: '@keg-hub/keg-core'
      }
    }
  }
}
