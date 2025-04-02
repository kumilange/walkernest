# 🏠 Walkernest 🚶‍♀️

[Walkernest](https://walkernest.com/) helps you find apartments by prioritizing the **surrounding environment**. Unlike traditional real estate sites, it focuses on amenities like parks, supermarkets, and cafes—ensuring a home that fits your lifestyle in Colorado, USA! Compatible with both 💻 and 📱.

## ✨ Features

- 🔍 Analyze Apartments

  Find apartments that meet your criteria based on their distance to parks, supermarkets, and cafes, so your surroundings align with your lifestyle.

- ❤️ Save Favorites

  Save the apartments you like for easy access later, allowing you to revisit your preferred options whenever you need.

- 🚗 Check Route

  View driving routes and estimated travel times between locations, such as from an apartment to your workplace or your kids' school, to evaluate convenience.

## 🌐 Dev Technology

- 🎨 Frontend: React, Tailwind CSS, Shadcn UI, Jotai, Vite
- ⚙️ Backend: FastAPI
- 🗄️ Database: PostgreSQL with PostGIS
- 🐳 Containerization: Docker
- 🔧 Orchestration: Docker Compose
- 🧰 Monorepo: Nx

## 🌎 Map Technology

### 📍 Public Geospatial Data

- [OpenStreetMap](https://osm-queries.ldodds.com/): Provides data on apartments, parks, supermarkets, and cafes via the [Overpass API](https://osm-queries.ldodds.com/)
- [Nominatim](https://nominatim.org/): Open-source geocoding service for finding addresses worldwide using OpenStreetMap data.
- [OSRM](https://project-osrm.org/): Open-source routing engine for calculating driving, cycling, and walking routes.
- [CDPHE Open Data](https://data-cdphe.opendata.arcgis.com/datasets/d618cdac50ac4ed7882db562c9b0ccfa_4/explore) – Colorado city boundary dataset.

### 📊 Geospatial Analysis

- [OSMnx](https://osmnx.readthedocs.io/en/stable/index.html): A Python package for retrieving, modeling, and analyzing OpenStreetMap street networks.
- [NetworkX](https://networkx.org/): A Python library for graph-based spatial analysis, including routing and connectivity.
- [GeoPandas](https://geopandas.org/en/stable/): A Python library that simplifies working with geospatial data.

### 🗺️ Map Rendering

- [MapLibre GL JS](https://maplibre.org/maplibre-gl-js/docs/): An open-source TypeScript library for rendering interactive maps in the browser.
- [react-map-gl](https://visgl.github.io/react-map-gl/): React components for MapLibre GL JS, Mapbox GL JS, and compatible forks.

## 📌 Prerequisites

- 📦 Node.js 20+ & npm
- 🐍 Python 3.10+ & pip
- 🐳 Docker & Docker Compose
- 🧰 Nx CLI

## 🚀 Getting Started

### 📥 Clone the Repository

```sh
git clone https://github.com/yourusername/walkernest.git
cd walkernest
```

### 🔧 Environment Variables

Create `.env.development` and `.env` files in the `root` directory and `frontend` (if you're developing locally without Docker) directories, and add the following environment variables:

```sh
# General settings
RUN_SEED=true_or_false  # Whether to seed the database

# Database settings
DB_USERNAME=your_db_username
DB_PASSWORD=your_db_password
DB_HOST=your_db_host
DB_PORT=your_db_port
DB_NAME=your_db_name

# Frontend settings
VITE_API_DOMAIN=your_api_domain
VITE_API_PROTOCOL=http_or_https
VITE_MAPTILER_API_KEY=your_maptiler_api_key

# Deployment settings (applicable only to the production .env file)
DOMAIN_NAME=your_domain_name
USER=your_iam_user_name
INSTANCE_IP=your_ec2_ip
KEY_PAIR_FILE=your_keypair_pem_file
```

### 🧰 Setup

#### 🔰 First-Time

```sh
# Create a virtual environment named 'venv' using Python 3
python3 -m venv venv

# Activate the virtual environment
# On MacOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# NOTE: Activating the virtual environment is necessary to ensure all Python dependencies are available.

# Run the setup script (installs all dependencies)
npm run setup

# Start the development servers
npm run dev
```

### 💻 Development

#### 🎨 Start Frontend Development Server

1. Run:

   ```sh
   npm run start:frontend
   ```

   _NOTE_: Make sure to create an env file (e.g., `.env.local`, `.env.development`) and set the following variables for development:

   ```sh
   VITE_API_PROTOCOL=http
   VITE_API_DOMAIN=your_api_domain
   VITE_MAPTILER_API_KEY=your_maptiler_api_key
   ```

2. The frontend will be available at http://localhost:5173

#### ⚙️ Start Backend Development Server

1. Run:

   ```sh
   npm run start:backend
   ```

2. The backend will be available at http://localhost:3000

#### 🚀 Start Both Frontend and Backend

1. Run:

   ```sh
   npm run dev
   ```

   _NOTE_: Set the `RUN_SEED` environment variable to `false` to skip seeding the database if you only want to run the apps.

2. Access the apps:
   - 🎨 Frontend: http://localhost:5173
   - ⚙️ Backend: http://localhost:3000

#### 🏗 Build and Preview the Frontend App

```sh
npm run preview
```

#### 🧪 Running Unit Tests

```sh
npm run test
```

- Run only frontend tests:

  ```sh
  npm run test:frontend
  ```

- Run only backend tests:

  ```sh
  npm run test:backend
  ```

- Run only seed tests:
  ```sh
  npm run test:seed
  ```

#### 🌱 Seeding the Database

1. Generate datasets for the database:

   ```sh
   npm run seed:generate
   ```

2. Seed the database:
   ```sh
   npm run seed:db
   ```

#### 🐳 Docker Development Environment

- Start all Docker services with optional database seeding:

  ```sh
  npm run docker:dev
  ```

- Start all Docker services:

  ```sh
  npm run docker:up
  ```

- Stop all Docker services:
  ```sh
  npm run docker:down
  ```

### 🚢 Deployment

#### 🏢 Deploy to AWS EC2

There are two ways to deploy the application:

1. **Deploy via GitHub Actions (Tagging)**:

   ```sh
   git tag vX.X.X
   git push origin vX.X.X
   ```

   - Tag your commit with a version number in the format `vX.X.X` (e.g., `v1.0.0`).
   - Push the tag to the repository. This will trigger the GitHub Actions workflow, which will build and deploy the application automatically.
   - A GitHub release will be created upon successful deployment.

2. **Deploy Locally**:

   ```sh
   npm run deploy
   ```

   - Run this command to deploy the application locally.
   - This method does not create a GitHub release and is intended for local testing or development.

Regardless of the deployment method used, the application will be accessible at [https://walkernest.com/](https://walkernest.com/)!🎉

### 🛠 Maintenance

#### 🗓️ Cron job executed in GitHub Actions on the 1st of every month

- 🌍 Update the OSM data
- 🌱 Reseed the database

### 📂 Project Structure

```
walkernest/
├── backend/              # Backend service (FastAPI)
│   ├── app/
│   │   ├── main.py
│   │   ├── tests/
│   │   ├── routers/
│   │   └── utils/
│   ├── project.json
│   └── Dockerfile
├── develop/              # Development environment setup
│   ├── .env
│   ├── docker-compose.yml
│   ├── project.json
│   └── run-dev.sh
├── deploy/               # Production deployment scripts
│   ├── .env
│   ├── docker-compose.yml
│   ├── project.json
│   ├── run-prod.sh
│   └── ...other scripts
├── frontend/             # Frontend service (React/Vite)
│   ├── src/
│   │   └── tests/
│   ├── .env.local        # Env file for dev server
│   ├── .env.production   # Env file for local build
│   ├── project.json
│   ├── index.html
│   ├── package.json
│   ├── Dockerfile
│   ├── Dockerfile.dev
│   └── ...other config files
├── seed/                 # Database seeding scripts
│   ├── cdphe_open_data/
│   ├── data/
│   ├── tests/
│   ├── project.json
│   ├── generate_seed_data.py
│   └── seed.sh
├── shared/               # Shared resources
│   └── citydict.json
├── nx.json               # Nx workspace configuration
├── package.json          # Root package.json with Nx scripts
├── .gitignore
├── README.md
├── .env
├── .env.development
└── ...other config files
```

## 🧰 Nx Command Reference

### 🏃‍♂️ Run a Specific Project

```sh
npx nx <target> <project>
# Example: npx nx serve frontend
```

### 🔄 Run Multiple Projects

```sh
npx nx run-many --target=<target> --projects=<project1>,<project2>
# Example: npx nx run-many --target=test --projects=frontend,backend
```
