#!/bin/sh

# Exit on error
set -e

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if Python package is installed
check_python_package() {
    local package=$1
    local import_name=${2:-$1}
    
    # Handle special cases
    if [ "$package" = "scikit-learn" ]; then
        import_name="sklearn"
    fi
    
    python -c "import $import_name" >/dev/null 2>&1
    return $?
}

# Display banner
echo "================================"
echo "WalkerNest Setup"
echo "Installing all dependencies..."
echo "================================"

# Create and activate virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "🔨 Creating Python virtual environment..."
    python -m venv venv
    echo "📝 NOTE: After setup completes, activate the virtual environment with:"
    echo "     source venv/bin/activate (Linux/Mac)"
    echo "     venv\\Scripts\\activate (Windows)"
fi

# Activate virtual environment (when running the script directly)
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    # Windows
    if [ -f "venv/Scripts/activate" ]; then
        source venv/Scripts/activate
    fi
else
    # Linux/Mac
    if [ -f "venv/bin/activate" ]; then
        source venv/bin/activate
    fi
fi

# Install root npm dependencies
echo "📦 Installing root npm dependencies..."
npm install || { echo "❌ npm install failed"; exit 1; }

# Install Python dependencies
echo "🐍 Installing Python dependencies..."
python -m pip install --upgrade pip || { echo "❌ pip upgrade failed"; exit 1; }

# Try to install all requirements
echo "🔄 Installing Python test requirements..."
python -m pip install -r requirements-test.txt || {
    echo "⚠️  Some test dependencies couldn't be installed."
    echo "📝 Installing critical packages individually..."
    python -m pip install pytest pytest-mock geopandas pandas networkx shapely fastapi requests osmnx httpx python-multipart starlette uvicorn
    echo "📝 Installing scikit-learn with pre-built wheels..."
    python -m pip install --only-binary=scikit-learn scikit-learn || python -m pip install scikit-learn
}

echo "🔄 Installing all other Python requirements..."
python -m pip install -r requirements-all.txt || {
    echo "⚠️  Some dependencies couldn't be installed."
    echo "   Consider using Docker for development: npm run docker:dev"
}

# Install frontend dependencies
echo "🎨 Installing frontend dependencies..."
cd frontend && npm install || { echo "❌ Frontend dependencies installation failed"; exit 1; }
cd ..

# Ensure scikit-learn is installed
echo "🔄 Verifying scikit-learn installation..."
if ! check_python_package sklearn; then
    echo "📦 scikit-learn not found, installing..."
    # Try with pre-built wheels first, then regular install
    python -m pip install --only-binary=scikit-learn scikit-learn || \
    python -m pip install scikit-learn
fi

# Verify critical dependencies are installed
echo "🔍 Verifying critical dependencies..."
MISSING_PACKAGES=()

# Check Python packages
for package in pandas geopandas networkx shapely fastapi requests pytest scikit-learn; do
    if ! check_python_package $package; then
        MISSING_PACKAGES+=($package)
    fi
done

if [ ${#MISSING_PACKAGES[@]} -eq 0 ]; then
    echo "✅ All critical Python packages are installed."
else
    echo "⚠️  The following critical packages are missing: ${MISSING_PACKAGES[*]}"
    echo "   This might cause tests or the application to fail."
    echo "   Consider using Docker for development: npm run docker:dev"
fi

echo "✅ Setup completed!"
echo "📝 REMINDER: Activate the virtual environment before running the application:"
echo "   source venv/bin/activate (Linux/Mac)"
echo "   venv\\Scripts\\activate (Windows)"
echo ""
echo "🚀 You can now run the application with: npm run dev"

