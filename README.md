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
DB_USERNAME=your_db_username
DB_PASSWORD=your_db_password
DB_HOST=your_db_host
DB_PORT=your_db_port
DB_NAME=your_db_name
VITE_MAPTILER_API_KEY=your_maptiler_api_key
VITE_API_DOMAIN=your_api_domain
```

### Development

#### Frontend

#### Backend

### Build and Run the Application

1. Run `docker-compose-dev` with seeding datasets:

   ```sh
   export RUN_SEED=true && docker-compose -f dev/docker-compose-dev.yml up --build -d
   ```

2. Run `docker-compose-dev` without seeding datasets:

   ```sh
   docker-compose -f dev/docker-compose-dev.yml up --build -d
   ```

3. Access the application:
   - Backend: http://localhost:3000
   - Frontend: http://localhost:5173

### Deployment

#### Initialize EC2 and Deploy App including seeding on Docker

```sh
cd ec2
./initialize.sh
```

#### Seed the Database separately on EC2

```sh
cd ec2
./seed.sh
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
│   ├── data/
│   │   ├── cdphe_open_data/
│   │   ├── seed/
│   │   ├── utils/
│   │   └── generate_seed_data.py
│   ├── Dockerfile
│   └── Dockerfile.seed.dev
├── dev/
│   ├── .env
│   ├── docker-compose-dev.yml
├── ec2/
│   ├── .env
│   ├── docker-compose.yml
│   ├── initialize.sh
│   ├── seed.sh
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
│   ├── citydict.json
├── .gitignore
└── README.md
```
