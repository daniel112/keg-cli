# !/bin/bash

# IMPORTANT - This script should be run from the keg-cli root directory

# Exit when any command fails
set -e

# Clones the keg-hub repo locally
# And sets up and env for it's path
keg_setup_keg_hub(){
  # Set the keg-hub root directory
  export KEG_ROOT_DIR="$(dirname $(dirname $(pwd)))/keg-hub"
  echo "::debug::Root directory for keg-hub => $KEG_ROOT_DIR"

  local CUR_CLI_PATH=$(pwd)
  
  # Clone keg-hub into the root directory
  git clone https://github.com/simpleviewinc/keg-hub.git $KEG_ROOT_DIR
  
  echo "::debug::Creating Keg-CLI symlink ..."
  ln -s $CUR_CLI_PATH $KEG_ROOT_DIR/repos/keg-cli

  # Get the keg-cli path from the current directory
  # Should be something like this in the workflow => /home/runner/work/keg-cli/keg-cli
  export KEG_CLI_PATH=$KEG_ROOT_DIR/repos/keg-cli
  echo "::debug::Keg-CLI root directory => $KEG_CLI_PATH"

}

# Sets up ENVs needed to setup the Keg-CLI
keg_setup_cli(){

  # Setup the config paths for the global cli config 
  export KEG_CONFIG_PATH=$KEG_CLI_PATH/.kegConfig
  export KEG_CONFIG_FILE=cli.config.json

  node $KEG_CLI_PATH/scripts/ci/setupCLIConfig.js

  local KEG_GLOBAL_CONFIG=$KEG_CONFIG_PATH/cli.config.json
  if [[ -f "$KEG_GLOBAL_CONFIG" ]]; then
    export KEG_GLOBAL_CONFIG
  fi

}

# Sets up the config files for the keg-cli within the workflow
keg_setup_cli_config(){
  
  echo "::debug::Running Keg-CLI config setup..."

  # Set up the keg-hub repo first
  keg_setup_keg_hub

  # Then setup the cli and ENV's
  keg_setup_cli

  echo "::debug::Keg-CLI config setup complete!"

}

keg_setup_cli_config "$@"

