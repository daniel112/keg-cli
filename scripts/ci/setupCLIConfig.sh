#!/bin/bash

# IMPORTANT - This script should be run from the keg-cli root directory

# Exit when any command fails
set -e
# Get the keg-cli path from the current directory
# Should be something like this in the workflow => /home/runner/work/keg-cli/keg-cli
export KEG_CLI_PATH=$(pwd)


keg_setup_keg_hub(){
  # Make the keg-hub folder
  mkdir -p '../../keg-hub'
  # Add the repos folder
  mkdir -p '../../keg-hub/repos'
  # Add the taps folder
  mkdir -p '../../keg-hub/taps'
}

echo "::debug::Keg-CLI root directory => $KEG_CLI_PATH"

# Setup the config paths for the global cli config 
export KEG_CONFIG_PATH=$KEG_CLI_PATH/.kegConfig
export KEG_CONFIG_FILE=cli.config.json

# Sets up the config files for the keg-cli within the workflow
keg_setup_cli_config(){
  
  echo "::debug::Running Keg-CLI config setup..."

  keg_setup_keg_hub

  node $KEG_CLI_PATH/scripts/ci/setupCLIConfig.js

  local KEG_GLOBAL_CONFIG=$KEG_CONFIG_PATH/cli.config.json
  if [[ -f "$KEG_GLOBAL_CONFIG" ]]; then
    export KEG_GLOBAL_CONFIG
  fi

  echo "::debug::Keg-CLI config setup complete!"

}

keg_setup_cli_config "$@"

