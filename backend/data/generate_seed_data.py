import os
import warnings
from utils.data_processor import load_data, process_data

data_dir = "backend/data/cdphe_open_data"

# Suppress FutureWarning
warnings.simplefilter(action='ignore', category=FutureWarning)

if __name__ == "__main__":
    csv_file_path = os.path.abspath(f"{data_dir}/target_citylist.csv")
    geojson_file_path = os.path.abspath(f"{data_dir}/Colorado_City_Boundaries.geojson")
    output_file_path = os.path.abspath("shared/citydict.json")

    csv_data, geojson_data = load_data(csv_file_path, geojson_file_path)
    process_data(csv_data, geojson_data, output_file_path)
