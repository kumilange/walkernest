1. **Open QGIS**:

   - Launch QGIS on your machine.

2. **Connect to Your PostGIS Database**:

   1. Go to **Layer > Add Layer > Add PostGIS Layers...**.
   2. Click on the **New** button to create a new connection.
   3. Enter the connection details:
      - **Name**: Any name you prefer (e.g., PostGIS Connection).
      - **Host**: `localhost` (or the IP address of your Docker container if running on a remote server).
      - **Port**: `5432`.
      - **Database**: `gis`.
      - **Username**: `postgres`.
      - **Password**: `postgres` (or the password you set).
   4. Click **OK** to save the connection.
   5. Select the connection you just created and click **Connect**.
   6. Select the `geojsons` table (or any other table you want to visualize).
   7. Click **Add** to add the selected layers to the QGIS map canvas.

3. **Open the Attribute Table**:
   1. Once the layer is added to the map canvas, right-click on the layer in the Layers panel.
   2. Select **Open Attribute Table** from the context menu.

**Get Centroid from query\***

- SELECT city_id, name, ST_Centroid(geom) as centroid FROM geojsons WHERE name = 'supermarket' AND city_id = 1;
