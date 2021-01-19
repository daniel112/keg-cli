#!/bin/bash
# ***************************** IMPORTANT ***************************** #
# This script requries running scripts/ci/setupCLIConfig.sh first       #
# In can be done in a prious step, as long as the keg-hub folder exists #
# ***************************** IMPORTANT ***************************** #

# Exit when any command fails
set -e

# Get the keg-hub root dir setup in the setupCLIConfig.sh script
export KEG_ROOT_DIR="$(dirname $(dirname $(pwd)))/keg-hub"
echo "::debug::KEG_ROOT_DIR directory => $KEG_ROOT_DIR"

# Get the keg-cli path from the KEG_ROOT_DIR directory
# Should be something like this in the workflow => /home/runner/work/keg-hub/repos/keg-cli
export KEG_CLI_PATH=$KEG_ROOT_DIR/repos/keg-cli
echo "::debug::Keg-CLI root directory => $KEG_CLI_PATH"

export KEG_GLOBAL_CONFIG=$KEG_CLI_PATH/.kegConfig/cli.config.json
echo "::debug::Keg-CLI config file => $KEG_GLOBAL_CONFIG"

# Loop over the repos and run the passed in command on them
keg_run_yarn_cmd(){
  # Navigate to the keg-cli within the keg-hub/repos folder
  # This ensures it's in the correct context for running yarn commands
  cd $KEG_CLI_PATH
  echo "::debug::Running yarn cmd $1"
  yarn "$1"
}

keg_run_yarn_cmd "$@"
