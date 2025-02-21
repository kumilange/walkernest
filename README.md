# 🏠Walkernest🚶‍♀️

Walkernest is a web application built with FastAPI for the backend and React for the frontend. It uses PostgreSQL with PostGIS for spatial data storage and analysis. The application is containerized using Docker and Docker Compose for easy deployment and development.

## Features

- FastAPI backend with endpoints for various functionalities
- React frontend for user interaction
- PostgreSQL with PostGIS for spatial data storage and analysis
- Docker and Docker Compose for containerization and orchestration

## Prerequisites

- Docker
- Docker Compose
- Python 3.10
- Node.js (for frontend development)

## Getting Started

### Clone the Repository

```sh
git clone https://github.com/yourusername/walkernest.git
cd walkernest
```

### Environment Variables

Create a `.env` file in the `dev`,`ec2` and `frontend`(if you locally develop without docker) directories, and add the following environment variables:

```sh
RUN_SEED=boolean_to_run_seed_dataset
DB_USERNAME=your_db_username
DB_PASSWORD=your_db_password
DB_HOST=your_db_host
DB_PORT=your_db_port
DB_NAME=your_db_name
VITE_API_DOMAIN=your_api_domain
VITE_MAPTILER_API_KEY=your_maptiler_api_key
USER=your_iam_user_name
INSTANCE_IP=your_ec2_ip
KEY_PAIR_FILE=your_keypair_pem_file
```

### Development

#### Frontend

#### Backend

### Build and Run the Apps

1. Run `run-dev.sh` script:

   ```sh
   cd dev
   ./run-dev.sh
   ```

   _NOTE_: Change environment variable `RUN_SEED` to `false` to skip seeding datasets if you just want to run the apps

2. Access the apps:
   - Backend: http://localhost:3000
   - Frontend: http://localhost:5173

### Deployment

#### Initialize EC2 and Deploy the Apps on Docker

```sh
cd ec2
./run-ec2.sh
```

#### Connecting to PostgreSQL on Docker on EC2

1. SSH into the EC2 instance:

   ```sh
   ssh -i your_keypair_pem_file your_iam_user_name@your_ec2_ip
   ```

2. Login to PostgreSQL:
   ```sh
   docker exec -it container_name bash
   psql -U your_db_username -d your_db_name -h your_db_host -W
   ```

### Project Structure

```
walkernest/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── ...other files
│   │   ├── routers/
│   │   └── utils/
│   └── Dockerfile
├── dev/
│   ├── .env
│   ├── docker-compose-dev.yml
│   └── run-dev.sh
├── ec2/
│   ├── .env
│   ├── docker-compose.yml
│   ├── run-ec2.sh
│   └── ...other scripts
├── frontend/
│   ├── src/
│   ├── .env.local
│   ├── .env.production
│   ├── index.html
│   ├── package.json
│   ├── Dockerfile
│   ├── Dockerfile.dev
│   └── ...other config files
├── shared/
│   └──citydict.json
├── seed/
│   ├── cdphe_open_data/
│   ├── data/
│   ├── utils/
│   ├── generate_seed_data.py
│   └── seed.sh
├── .gitignore
└── README.md
```
