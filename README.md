# 🏠 Walkernest 🚶‍♀️

[Walkernest](https://walkernest.com/) helps you find apartments by prioritizing the `surrounding environment`. Unlike traditional real estate sites, it focuses on amenities like parks, supermarkets, and cafes—ensuring a home that fits your lifestyle in Colorado, USA!

## ✨ Features

- 🔍 Analyze Apartments

  Find apartments that meet your criteria based on the distance to parks, supermarkets, and cafes, ensuring the surrounding environment matches your lifestyle.

- ❤️ Save Favorites

  Save the apartments you like for easy access later, allowing you to revisit your preferred options whenever you need.

- 🚗 Check Route

  Check the driving route and estimated travel time between two points, such as from an apartment to your workplace or your kids' school, to evaluate convenience.

## 🌐 Dev Technology

- 🎨 Frontend: `React`, `Tailwind CSS`, `Shadcn UI`, `Jotai`, `Vite`
- ⚙️ Backend: `FastAPI`
- 🗄️ Database: `PostgreSQL` with `PostGIS`
- 🐳 Containerization: `Docker`
- 🔧 Orchestration: `Docker Compose`

## 🌎 Map Technology

### 📍 Public Geospatial Data

- [OpenStreetMap](https://osm-queries.ldodds.com/): Provides data on apartments, parks, supermarkets, and cafes via the [Overpass API](https://osm-queries.ldodds.com/)
- [Nominatim](https://nominatim.org/): Open-source geocoding service for finding addresses worldwide using OpenStreetMap data.
- [OSRM](https://project-osrm.org/): Open-source geocoding service for finding addresses worldwide using OpenStreetMap data.
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

## 🚀 Getting Started

### 📥 Clone the Repository

```sh
git clone https://github.com/yourusername/walkernest.git
cd walkernest
```

### 🔧 Environment Variables

Create a `.env` file in the `dev`,`ec2` and `frontend` (if you're developing locally without Docker) directories, and add the following environment variables:

```sh
# General settings
RUN_SEED=true_or_false  # Whether to seed the database

# Database settings
DB_USERNAME=your_db_username
DB_PASSWORD=your_db_password
DB_HOST=your_db_host
DB_PORT=your_db_port
DB_NAME=your_db_name

# Deployment settings
DOMAIN_NAME=your_domain_name
USER=your_iam_user_name
INSTANCE_IP=your_ec2_ip
KEY_PAIR_FILE=your_keypair_pem_file

# Frontend settings
VITE_API_DOMAIN=your_api_domain
VITE_API_PROTOCOL=http_or_https
VITE_MAPTILER_API_KEY=your_maptiler_api_key
```

### 💻 Development

#### 🎨 Frontend

1. Run the following commands:

   ```sh
   cd frontend
   npm install
   npm run dev
   ```

   _NOTE_: Make sure to create an env file (e.g., `.env.local`, `.env.development`) and set the following variables for development:

   ```sh
   VITE_API_PROTOCOL=http
   VITE_API_DOMAIN=your_api_domain
   VITE_MAPTILER_API_KEY=your_maptiler_api_key
   ```

2. The frontend will be available at http://localhost:5173

#### ⚙️ Backend

1. Run the following commands:

   ```sh
   cd develop
   docker-compose up --build -d postgis backend
   ```

2. The backend will be available at http://localhost:3000

### 🏗 Build and Run the Apps

1. Run the `run-dev.sh` script:

   ```sh
   cd develop
   ./run-dev.sh
   ```

   _NOTE_: Set the `RUN_SEED` environment variable to `false` to skip seeding the database if you only want to run the apps.

2. Access the apps:
   - 🎨 Frontend: http://localhost:5173
   - ⚙️ Backend: http://localhost:3000

### 🚢 Deployment

#### 🏢 Set up EC2 and Deploy the Apps with Docker

1. Run the `run-prod.sh` script:

   ```sh
   cd deploy
   ./run-prod.sh
   ```

2. The app will be available at `https://walkernest.com/`

### 🛠 Maintainance

#### 🗓️ Cron job executed in GitHub Actions on the 1st of every month

- 🌍 Update the OSM data

### 📂 Project Structure

```
walkernest/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── ...other files
│   │   ├── routers/
│   │   └── utils/
│   └── Dockerfile
├── develop/
│   ├── .env
│   ├── docker-compose-dev.yml
│   └── run-dev.sh
├── deploy/
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
├── seed/
│   ├── cdphe_open_data/
│   ├── data/
│   ├── utils/
│   ├── generate_seed_data.py
│   └── seed.sh
├── shared/
│   └──citydict.json
├── .gitignore
└── README.md
```
