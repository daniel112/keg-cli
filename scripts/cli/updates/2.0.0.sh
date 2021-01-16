#!/usr/bin/env

source $(pwd)/keg

source $(pwd)/scripts/cli/updates/update_helpers.sh

keg_cli_2_0_0_update(){

  keg_message "Running update for version 2.0.0..."

  # Install any needed dependencies
  yarn clean:full

  # Update the defaultTag to be master
  keg config set --key cli.settings.docker.defaultTag --value master --confirm false

  echo ""
  keg_message "2.0.0 Update Complete!"
  echo ""

}

keg_cli_2_0_0_update "$@"
