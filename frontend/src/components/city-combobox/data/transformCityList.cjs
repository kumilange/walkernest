const fs = require('fs');
const path = require('path');

// Define the CityArrayItem type
/**
 * @typedef {Object} CityArrayItem
 * @property {number} id
 * @property {string} value
 * @property {string} label
 * @property {Object} geometry
 * @property {string} geometry.type
 * @property {Array} geometry.coordinates
 */

const cityListPath = path.join(
  __dirname,
  '../../../../../shared/citylist.json'
);
const cityListData = JSON.parse(fs.readFileSync(cityListPath, 'utf8'));

// Function to capitalize each word
function capitalizeWords(str) {
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
}

// Transform the data to match the CityArrayItem type
const transformedCityList = Object.entries(cityListData).map(
  ([key, value]) => ({
    id: value.id,
    value: key,
    label: capitalizeWords(key.replace(/_/g, ' ')),
    geometry: value.geometry,
  })
);

// Sort the array in alphabetical order based on the label property
transformedCityList.sort((a, b) => a.label.localeCompare(b.label));

// Write the transformed data to a new JSON file
const outputPath = path.join(__dirname, 'citylistArray.json');
fs.writeFileSync(outputPath, JSON.stringify(transformedCityList, null, 2));

console.log('Transformed city list has been written to citylistArray.json');
