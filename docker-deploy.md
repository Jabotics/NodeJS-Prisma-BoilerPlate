**How to deploy HRM-Backend in Docker**

- Step 1: Install Docker along with dependencies
- - `$ chmod +x docker-install.sh`
- - `$ ./docker-install.sh`
- Step 2: Configure host in swagger.json
- Step 3: Update host of DB URL in .env file
- Step 4: Run Docker
- - `$ docker-compose up`

**Some useful docker commands**
- Build container without turning up
- - `$ docker-compose build`
- Build & Turning up docker container
- - To run as a process: `$ docker-compose up`
- - To run as daemon process in background: `$ docker-compose up -d`
- Turning down docker container
- - `$ docker-compose down`
- Rebuild & Turning up docker container
- - To run as a process: `$ docker-compose up --build`
- - To run as daemon process in background: `$ docker-compose up -d --build`