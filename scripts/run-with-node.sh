#!/bin/sh

if ! command -v node >/dev/null 2>&1; then
  dsh_nvm_directory=${NVM_DIR:-"$HOME/.nvm"}
  dsh_nvm_default=
  if [ -r "$dsh_nvm_directory/alias/default" ]; then
    IFS= read -r dsh_nvm_default < "$dsh_nvm_directory/alias/default"
  fi

  dsh_node_directory="$dsh_nvm_directory/versions/node/$dsh_nvm_default/bin"
  if [ -n "$dsh_nvm_default" ] && [ -x "$dsh_node_directory/node" ]; then
    PATH="$dsh_node_directory:$PATH"
    export PATH
  elif [ -s "$dsh_nvm_directory/nvm.sh" ]; then
    NVM_DIR=$dsh_nvm_directory
    export NVM_DIR
    # shellcheck disable=SC1090
    . "$NVM_DIR/nvm.sh"
    nvm use --silent default >/dev/null 2>&1 || true
  fi
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js was not found in PATH or through the NVM default alias." >&2
  exit 127
fi

exec "$@"
