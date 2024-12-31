import os
import warnings
from utils.data_processor import load_data, process_city_data

# Suppress FutureWarning
warnings.simplefilter(action='ignore', category=FutureWarning)

if __name__ == "__main__":
    csv_file_path = os.path.abspath("./cdphe_open_data/target_citylist.csv")
    geojson_file_path = os.path.abspath("./cdphe_open_data/Colorado_City_Boundaries.geojson")
    output_file_path = os.path.abspath("../../shared/citylist.json")

    # Load data
    csv_data, geojson_data = load_data(csv_file_path, geojson_file_path)
    # Process city data
    process_city_data(csv_data, geojson_data, output_file_path)