#!/bin/bash

# Github Repos
KEG_CLI_URL=github.com/simpleviewinc/keg-cli.git

# Install location
KEG_INSTALL_DIR=~/keg
KEG_CLI_PATH=$KEG_INSTALL_DIR/keg-cli

# Size of the docker-machien virtual box hhd
# KEG_VB_SIZE=24288
KEG_VB_SIZE=8192

# Prints a message to the terminal through stderr
keg_message(){
  echo "[ KEG CLI ] $@" >&2
  return
}

# Asks a question in the terminal
keg_ask_question(){
  keg_message "$1"
  read -p "" INPUT;
  local ANSWER="${INPUT:0:1}"

  echo "$ANSWER"
}

# Reloads the .bash_profile and .bashrc if the exist
keg_src_bash(){
  # Check for .bash_profile file
  local PROFILE=~/.bash_profile
  if [[ -f "$PROFILE" ]]; then
    source $PROFILE

  else

    # Check for the .bash_rc file
    local BASH_RC=~/.bash_rc
    if [[ -f "$BASH_RC" ]]; then
      source $BASH_RC
    fi

  fi
}

# Check and install homebrew
keg_brew_install(){
  # Check for brew install
  if [[ -x "$(command -v brew 2>/dev/null)" ]]; then
    keg_message "Brew is installed"
  else
    #  Install brew
    /usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
  fi
}

# Checks and install docker / docker-machine / docker-compose
keg_docker_install(){

  if [[ -x "$(command -v docker 2>/dev/null)" ]]; then
    keg_message "Docker is installed"
  else
    brew install docker
  fi

  if [[ -x "$(command -v docker-machine 2>/dev/null)" ]]; then
    keg_message "Docker-machine is installed"
  else
    brew install docker-machine
  fi

  if [[ -x "$(command -v docker-compose 2>/dev/null)" ]]; then
    keg_message "Docker-compose is installed"
  else
    brew install docker-compose
  fi

}

# Setup docker-machine to use virtualbox
# Create a new docker-machine instance
keg_setup_docker_machine(){

  keg_message "Setting up docker-machine..."

  # Ensure docker-machine starts on launch
  local BREW_DOC="$(brew services list | grep docker-machine)"
  if [[ "$BREW_DOC" ]]; then
    local BREW_SPLIT=($BREW_DOC)
    local BREW_STATUS="${BREW_SPLIT[1]}"
    if [[ "$BREW_STATUS" != "started" ]]; then
      keg_message "Starting 'brew docker-machine' service..."
      brew services start docker-machine
    else
      keg_message "The 'brew docker-machine service' is already started!"
    fi
  else
    keg_message "Starting 'brew docker-machine' service..."
    brew services start docker-machine
  fi

  local DOCKER_INSTANCE=$(docker-machine ls | grep $KEG_DOCKER_IP)
  
  if [[ "$DOCKER_INSTANCE" ]]; then
    local DOC_SPLIT=($DOCKER_INSTANCE)
    local DOC_NAME="${DOC_SPLIT[0]}"
    if [[ "$DOC_NAME" == "$KEG_DOCKER_NAME" ]]; then
      keg_message "Docker machine instance '$KEG_DOCKER_NAME' already setup!"
      return
    fi
  fi

  keg_message "Creating docker-machine instance..."
  docker-machine create --driver virtualbox --virtualbox-memory $KEG_VB_SIZE $KEG_DOCKER_NAME

  keg_message "Updating docker-machine environment..."
  docker-machine env $KEG_DOCKER_NAME

  keg_setup_static_ip

}

# Update docker-machines ip-address to be static
# So it's the same every time the instance boots
keg_setup_static_ip(){
  # Add this to the bootup script
  # Will kill the dhcp server for eth1,
  # Then sets a static ip address for the machine everytime it boots up
  echo "kill \$(more /var/run/udhcpc.eth1.pid); ifconfig eth1 $KEG_DOCKER_IP netmask $KEG_DOCKER_SUBNET_MASK broadcast $KEG_DOCKER_BROADCAST up" | docker-machine ssh $KEG_DOCKER_NAME sudo tee /var/lib/boot2docker/bootsync.sh > /dev/null

  keg_message "Stoping $KEG_DOCKER_NAME to set static ip address..."
  docker-machine stop $KEG_DOCKER_NAME

  keg_message "Starting $KEG_DOCKER_NAME with ip address => $KEG_DOCKER_IP"
  docker-machine start $KEG_DOCKER_NAME

  keg_message "Regenerating $KEG_DOCKER_NAME certs..."
  docker-machine regenerate-certs --force $KEG_DOCKER_NAME
  
  keg_message "Docker IP Address: $(docker-machine ip $KEG_DOCKER_NAME)"
  
  eval $(docker-machine env $KEG_DOCKER_NAME)
}

# Check and install virtualbox
keg_setup_virtualbox(){

  # Check for virtualbox install
  if [[ -x "$(command -v VBoxManage 2>/dev/null)" ]] && [[ -d "/Applications/VirtualBox.app" ]]; then
    keg_message "Virtualbox is installed"
  else
    brew cask install virtualbox
  fi

}

# Fixes a bug that leaves some virtual-box processes still running
keg_virtualbox_process_fix(){
  local VB_PIDS=$(ps aux | grep VB | | awk '{ print $2 }' | cut -d'/' -f1)
  # Loop over pids, and kill -9 each one
}

# Check and install nvm and node
keg_setup_nvm_node(){

  if [[ -z "$(which nvm)" ]]; then
    keg_message "NVM already installed!"
  else
    keg_message "Installing NVM"

    # Download and run the bash install script
    curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.34.0/install.sh | bash

    # Sets up NVM to be used right away
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

    # Install the node version
    nvm install 12.15.0
  fi

}

# Check and install yarn
keg_setup_yarn(){

  # Check for yarn install
  if [[ -x "$(command -v yarn 2>/dev/null)" ]]; then
    keg_message "yarn is installed"
  else
    brew install yarn
  fi
  
}

# If you run into this problem =>
# mkmf.rb can't find header files for ruby at /System/Library/Frameworks/Ruby.framework/Versions/2.3/usr/lib/ruby/include/ruby.h
# Follow the stpes of the first answer here=>
# https://stackoverflow.com/questions/46377667/docker-for-mac-mkmf-rb-cant-find-header-files-for-ruby
keg_setup_docker_sync(){

  if which ruby >/dev/null && which gem >/dev/null; then
    keg_message "Installing docker-sync"
    gem install docker-sync
    keg_message "Updating \$PATH"
    export PATH="$(ruby -r rubygems -e 'puts Gem.user_dir')/bin:$PATH"
  fi

  # Install the docker-sync dep unison
  if [[ -z "$(which unison)" ]]; then
    keg_message "Installing unison"
    brew install unison
    brew tap eugenmayer/dockersync
    brew install eugenmayer/dockersync/unox
    brew link unison
  else
    keg_message "Linking unison"
    brew link unison
  fi

  keg_src_bash
}

# Close a github repo locally
# Tries to use the $GITHUB_KEG if it exists, othwise tries to clone without it
keg_install_repo(){

  # Check if the path already exists
  if [[ -d "$2" ]]; then
    keg_message "Skipping git clone of '$2 repo'. Folder already exists!"
    return
  fi

  # Check if there is a GITHUB_KEY in the ENV, and is so use it to clone the repos
  if [[ "$GITHUB_KEY" ]]; then
    git clone --recurse-submodules https://$GITHUB_KEY@$1 $2
  
  # Otherwise use the a regular git clone, without the key
  else
    git clone --recurse-submodules https://$1 $2
  fi

  # Navigate to the repo, and update that it's a shared repo in the config
  cd $2
  git reset --hard HEAD
  git config core.sharedRepository group

}

# Checks the bash_profile and bashrc files for entries of the keg-cli
# If not found, it will add it; and reload the bash file
keg_check_bash_file(){

  keg_message "Checking bash profile for keg-cli..."

  # Check if the bashfile exists
  local BASHRC_FILE

  # Check for .bash file
  local PROFILE=~/.bash_profile
  local BRC=~/.bashrc
  if [[ -f "$PROFILE" ]]; then
    BASH_FILE="$PROFILE"
  elif [[ -f "$BRC" ]]; then
    BASH_FILE="$BRC"
  fi

  # If no bash file is found, create the bash_profile
  if [[ ! -f "$BASH_FILE" ]]; then
    # Create the file if it does not exist
    keg_message ".bash file not found, creating at $BASH_FILE"
    touch $BASH_FILE
  fi

  # Check if the keg cli is installed, and if not, add it to bash file
  if grep -Fq $KEG_CLI_PATH/keg "$BASH_FILE"; then
    keg_message "keg-cli already added to $BASH_FILE"
  else

    # TODO: Add check for NVM => export NVM_DIR=
    # The entry for the keg should come before the NVM entry
    # We need to load the keg-cli and $GIT_KEY before loading NVM

    keg_message "Adding keg-cli to $BASH_FILE"
    echo "" >> $BASH_FILE
    echo "source $KEG_CLI_PATH/keg" >> $BASH_FILE

  fi

  # Re-Souce bash to include the cli script
  source $BASH_FILE

}

# Installs the keg-cli, and clones the keg-core / keg-componets repos locally
# Updates the bash_profile to source the keg-cli when loaded!
keg_install_cli(){

  # Check if the keg-cli install directory exists
  # If not, then create it, and set it's permissions to the current user/group
  if [[ ! -d "$KEG_INSTALL_DIR" ]]; then
    keg_message "Creating /keg directory..."
    local USR=$(logname)
    local GROUP=$(id -g -n $USR)
    sudo mkdir -p $KEG_INSTALL_DIR
    sudo chown -R $USER:$GROUP $KEG_INSTALL_DIR
  fi

  cd $KEG_INSTALL_DIR

  # Clone the needed key repos
  keg_install_repo $KEG_CLI_URL keg-cli

  # Update the bash profile to include the keg-cli bash commands
  keg_check_bash_file

}

# Removes all install docker software
keg_clean_all(){

  keg_message "Removing docker-sync..."
  gem uninstall docker-sync
  brew uninstall unison
  brew uninstall eugenmayer/dockersync/unox

  keg_message "Removing docker-compose..."
  brew uninstall docker-compose

  keg_message "Removing docker-machine..."
  docker-machine rm $KEG_DOCKER_NAME
  brew uninstall docker-machine

  keg_message "Removing docker..."
  brew uninstall docker

  keg_remove_virtual_box

  # Reload users .bashrc and .bash_profile
  keg_src_bash

}

# Removes virtual box from the machine
keg_remove_virtual_box(){

  keg_message "Checking if virtualbox is installed!"

  if [[ -d "/Applications/VirtualBox.app" ]]; then
    local ANSWER=$(keg_ask_question "Confirm remove Virtual Box? (y/n):")
    if [[ "$ANSWER" == "y" || "$ANSWER" == "Y" ]]; then
      keg_message "Removing virtualbox..."
      brew cask uninstall virtualbox
    else
      keg_message "Skipping virtualbox removal!"
    fi
  fi

}

# Removes the currently running docker-machine instnace
# Then reinstalls it
keg_reset_docker_machine(){
  docker-machine rm $KEG_DOCKER_NAME
  keg_setup_docker_machine
}

# Removes all installed keg-cli software, including the github keg repos
keg_uninstall_all(){
  keg_clean_all

  if [[ -d "$KEG_INSTALL_DIR" ]] && [[ "$KEG_INSTALL_DIR" != "/" ]]; then
    local ANSWER=$(keg_ask_question "Confirm remove $KEG_INSTALL_DIR? (y/n):")
    if [[ "$ANSWER" == "y" || "$ANSWER" == "Y" ]]; then
      sudo rm -rf $KEG_INSTALL_DIR
    fi
  fi

}

# Adds the docker machine-envs to the current session
keg_add_machine_envs(){

  keg_message "Loading docker-machine envs"
  local KEG_DM_ENVS=$KEG_CLI_PATH/scripts/setup/docker-machine.env

  # Ensure the env file exists
  if [[ -f "$KEG_DM_ENVS" ]]; then
    keg_message "setting docker-machine ENVs" >&2
    # Load the docker-machine ENVs, but route the output to dev/null
    # This way nothing is printed to the terminal
    set -o allexport
    source $KEG_DM_ENVS >/dev/null 2>&1
    set +o allexport
  else
    # Print message, and direct to stderr, so it's not captured in stdout
    keg_message "Missing ENV file as $KEG_DM_ENVS" >&2
    keg_message  "Can not run setup script" >&2
  fi

}


# Adds act package, which allows testing github actions locally through docker
keg_install_github_cli(){

  # Check for yarn install
  if [[ -x "$(command -v gh 2>/dev/null)" ]]; then
    keg_message "Github CLI is installed"
  else
    brew install github/gh/gh
  fi

}

# Runs methods to setup the keg-cli, with docker and vagrant
# Params
#   * $1 - (Optional) - Section of the setup script to run
#     * If it does not exist, all setup sections are run
keg_setup(){

  # Determin the setup type
  local SETUP_TYPE=$1

  # Uninstalls keg-cli and docker software
  # To run:
  # bash mac-init.sh uninstall
  #  * Runs only the uninstall portion of this script
  if [[ "$SETUP_TYPE" == "uninstall" ]]; then
    keg_uninstall_all
    return
  fi

  # Removes all installed docker software, and recreates it
  # To run:
  # bash mac-init.sh clean
  #  * Runs only the clean portion of this script
  if [[ "$SETUP_TYPE" == "clean" || "$SETUP_TYPE" == "uninstall" ]]; then
    keg_clean_all
    return
  fi

  # Remove currently running docker-machine, and remakes it
  # To run:
  # bash mac-init.sh docker-reset
  #  * Runs only the docker-reset portion of this script
  if [[ "$SETUP_TYPE" == "docker-reset" || "$SETUP_TYPE" == "docre" ]]; then
    keg_message "Reseting docker-machine..."
    keg_reset_docker_machine "${@:2}"
    return
  fi

  # Remove the virtual-box software, and reinstall it
  # To run:
  # bash mac-init.sh vb-reset
  #  * Runs only the vb-reset portion of this script
  if [[ "$SETUP_TYPE" == "vb-reset" ]]; then
    keg_remove_virtual_box
    INIT_SETUP="true"
  fi

  # Remove the installed software, and reinstall it
  # To run:
  # bash mac-init.sh reset
  #  * Runs only the reset portion of this script
  if [[ "$SETUP_TYPE" == "reset" ]]; then
    keg_message "Reseting keg-cli..."
    keg_clean_all
    # Set INIT_SETUP to true, so all below processes run
    INIT_SETUP="true"
  fi

  # To run:
  # bash mac-init.sh
  #  * Full install
  #  * Should be run when first setting up the machine
  #  * Running `bash mac-init.sh init` will do the same thing
  if [[ -z "$SETUP_TYPE" || "$SETUP_TYPE" == "init" ]]; then
    INIT_SETUP="true"
  fi

  # Setup and install brew
  # To run:
  # bash mac-init.sh brew
  #  * Runs only the brew portion of this script
  if [[ "$INIT_SETUP" || "$SETUP_TYPE" == "brew" ]]; then
    keg_message "Checking for brew install..."
    keg_brew_install "${@:2}"
  fi

  # Setup and install brew
  # To run:
  # bash mac-init.sh brew
  #  * Runs only the brew portion of this script
  if [[ "$INIT_SETUP" || "$SETUP_TYPE" == "gh" || "$SETUP_TYPE" == "hub" ]]; then
    keg_message "Checking for github cli install..."
    keg_install_github_cli
  fi

  # Setup and install docker
  # To run:
  # bash mac-init.sh docker
  #  * Runs only the docker portion of this script
  if [[ "$INIT_SETUP" || "$SETUP_TYPE" == "docker" || "$SETUP_TYPE" == "d" ]]; then
    keg_message "Checking for docker install..."
    keg_docker_install "${@:2}"
  fi

  # Setup and install virtualbox
  # To run:
  # bash mac-init.sh virtualbox
  #  * Runs only the virtualbox portion of this script
  if [[ "$INIT_SETUP" || "$SETUP_TYPE" == "virtualbox" || "$SETUP_TYPE" == "vb" ]]; then
    keg_message "Checking for virtualbox install..."
    keg_setup_virtualbox "${@:2}"
  fi

  # Setup and install machine
  # To run:
  # bash mac-init.sh machine
  #  * Runs only the docker-machine portion of this script
  if [[ "$INIT_SETUP" || "$SETUP_TYPE" == "machine" || "$SETUP_TYPE" == "dm" ]]; then
    keg_message "Checking if docker-machine is setup..."
    keg_setup_docker_machine "${@:2}"
  fi

  # Setup and install node
  # To run:
  # bash mac-init.sh node
  #  * Runs only the node portion of this script
  if [[ "$INIT_SETUP" || "$SETUP_TYPE" == "node" ]]; then
    keg_message "Checking for node install..."
    keg_setup_nvm_node "${@:2}"
  fi

  # Setup and install yarn
  # To run:
  # bash mac-init.sh yarn
  #  * Runs only the yarn portion of this script
  if [[ "$INIT_SETUP" || "$SETUP_TYPE" == "yarn" ]]; then
    keg_message "Checking for yarn install..."
    keg_setup_yarn "${@:2}"
  fi

  # Setup and install cli
  # To run:
  # bash mac-init.sh cli
  #  * Runs only the keg cli portion of this script
  if [[ "$INIT_SETUP" || "$SETUP_TYPE" == "cli" ]]; then
    keg_message "Checking keg cli install..."
    keg_install_cli "${@:2}"
  fi

  # Setup and install cli
  # To run:
  # bash mac-init.sh cli
  #  * Runs only the keg cli portion of this script
  if [[ "$INIT_SETUP" || "$SETUP_TYPE" == "sync" ]]; then
    keg_message "Checking docker-sync install..."
    keg_setup_docker_sync "${@:2}"
  fi

  keg_message "Keg CLI setup complete!"

}

# Unset these envs so we can validate that the current envs get loaded
unset KEG_DOCKER_IP
unset KEG_DOCKER_NAME

# Only run the setup scirpt if the ENVs are unset from above
if [[ -z "$KEG_DOCKER_IP" && -z "$KEG_DOCKER_NAME" ]]; then

  # Re-add all machine envs
  keg_add_machine_envs

  # Ensure the ENVs were reset, so we can properly setup the keg-cli
  if [[ "$KEG_DOCKER_IP" && "$KEG_DOCKER_NAME" ]]; then
    keg_setup "$@"

  # Show message if setup ENVs could not be set
  else
    keg_message "Error running keg-cli setup. Could not set keg-cli setup ENVs!"
  fi

# Show message if setup ENVs could not be unset
else
  keg_message "Error running keg-cli setup. Could not unset keg-cli setup ENVs!"
fi