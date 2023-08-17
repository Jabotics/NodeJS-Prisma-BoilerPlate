# Updating sources list
sudo apt update

# Installing curl and adding nodeJS sources
sudo apt install curl -y
curl -fsSL https://deb.nodesource.com/setup_14.x | sudo -E bash -

# Updating source list with new dependencies
sudo apt update

# Installing nodeJS and posgreSQL
sudo apt-get install -y nodejs npm