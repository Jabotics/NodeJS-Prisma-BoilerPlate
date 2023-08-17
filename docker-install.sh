sudo apt update
echo "[+] Sources updated"

sudo apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

echo "[+] Dependencies installed"

echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
    $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

echo "[+] Docker sources added"

sudo apt-get update
echo "[+] Sources updated"

sudo apt install -y \
    docker.io \
    docker-compose

echo "[+] Docker installed, you're good to go!"