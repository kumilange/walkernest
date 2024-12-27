import os
import pandas as pd
import geopandas as gpd
from shapely.geometry import box

# Read the GeoJSON file
input_file_path = os.path.abspath("./denver_city.geojson")
output_file_path = os.path.abspath(".")
gdf = gpd.read_file(input_file_path)

# Calculate the bounding box and centroid of the GeoJSON
bounds = gdf.total_bounds  # [minx, miny, maxx, maxy]

mid_x = (bounds[0] + bounds[2]) / 2
mid_y = (bounds[1] + bounds[3]) / 2

# Define quadrants using bounding boxes
nw_box = box(bounds[0], mid_y, mid_x, bounds[3])
ne_box = box(mid_x, mid_y, bounds[2], bounds[3])
sw_box = box(bounds[0], bounds[1], mid_x, mid_y)
se_box = box(mid_x, bounds[1], bounds[2], mid_y)

# Function to intersect geometries with a given box
def intersect_with_box(gdf, box):
    intersected = gdf.geometry.apply(lambda geom: geom.intersection(box))
    return gdf.assign(geometry=intersected)

# Intersect each quadrant box with the original geometry
nw_gdf = intersect_with_box(gdf, nw_box)
ne_gdf = intersect_with_box(gdf, ne_box)
sw_gdf = intersect_with_box(gdf, sw_box)
se_gdf = intersect_with_box(gdf, se_box)

# Filter out empty geometries
nw_gdf = nw_gdf[~nw_gdf.is_empty]
ne_gdf = ne_gdf[~ne_gdf.is_empty]
sw_gdf = sw_gdf[~sw_gdf.is_empty]
se_gdf = se_gdf[~se_gdf.is_empty]

# Merge southeast and southwest quadrants into one GeoDataFrame
south_gdf = gpd.GeoDataFrame(pd.concat([sw_gdf, se_gdf], ignore_index=True))

# Update OBJECTID values
ne_gdf['OBJECTID'] = 244
nw_gdf['OBJECTID'] = 245
south_gdf['OBJECTID'] = 246

# Save each quadrant as a separate GeoJSON
ne_gdf.to_file(f"{output_file_path}/northeast_denver.geojson", driver="GeoJSON")
nw_gdf.to_file(f"{output_file_path}/north_denver.geojson", driver="GeoJSON")
south_gdf.to_file(f"{output_file_path}/south_denver.geojson", driver="GeoJSON")