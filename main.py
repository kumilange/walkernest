import argparse
import warnings
from utils.data_processor import load_data, process_city_data

# Suppress FutureWarning
warnings.simplefilter(action='ignore', category=FutureWarning)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Process city and bbox for main function')
    parser.add_argument('--csv', type=str, required=True, help='Path to the CSV file')
    parser.add_argument('--geojson', type=str, required=True, help='Path to the GeoJSON file')
    args = parser.parse_args()

    # Load data
    csv_data, geojson_data = load_data(args.csv, args.geojson)
    # Process city data
    process_city_data(csv_data, geojson_data)