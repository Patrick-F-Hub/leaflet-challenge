// Create the 'basemap' tile layer that will be the background of our map.
var defaultMap = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
	maxZoom: 19,
	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

// OPTIONAL: Step 2
// Create the 'grayscale' tile layer as a second background of the map
var grayscale = L.tileLayer('https://tiles.stadiamaps.com/tiles/stamen_toner_lite/{z}/{x}/{y}{r}.{ext}', {
	minZoom: 0,
	maxZoom: 20,
	attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://www.stamen.com/" target="_blank">Stamen Design</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	ext: 'png'
});

// watercolor layer
var waterColor = L.tileLayer('https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.{ext}', {
	minZoom: 1,
	maxZoom: 16,
	attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://www.stamen.com/" target="_blank">Stamen Design</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	ext: 'jpg'
});

// topography later
let topoMap = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
	maxZoom: 17,
	attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
});

// make a basemaps object
let basemaps = {
  GrayScale: grayscale,
  "Water Color": waterColor,
  "Topography": topoMap,
  Default: defaultMap,
};

// Create the map object with center and zoom options.
var myMap = L.map("map", {
    center: [36.7783, -119.4179],
    zoom: 5,
    layers: [grayscale, waterColor, topoMap, defaultMap]
});

// Then add the 'basemap' tile layer to the map.
defaultMap.addTo(myMap);

// get the data for the tectonic plates and draw on the map
// variable to hold the tectonic plates layer
let tectonicplates = new L.layerGroup();

// call the api to get the info for the tectonic plates
d3.json("https://raw.githubusercontent.com/fraxen/tectonicplates/refs/heads/master/GeoJSON/PB2002_boundaries.json").then(function(plateData){
    // console log to make sure the data loaded
    // console.log(plateData);

    // load data using geoJson and add to the tectonic plates layer group
    L.geoJson(plateData,{
      // add styling to make the lines visible
      color: "yellow", 
      weight: 1
    }).addTo(tectonicplates); 
});

// add the tectonic plates to the map
tectonicplates.addTo(myMap);

// variable to hold the earthquake data layer
let earthquakes = new L.layerGroup();

// get the data for the earthquakes and populate the layergroup
// call the USGS GeoJson API
d3.json("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson") 
.then(function(earthquakeData) {
    // console log to make sure the data loaded
    console.log(earthquakeData); 
    // plot circles, where the radius is dependent on the magnitude 
    // and the color is dependent on the depth

    // make a function that chooses the color of the data point
    function dataColor(depth){
      if (depth > 90) return "red";
      else if(depth > 70) return "darkorange";
      else if(depth > 50) return "orange";
      else if(depth > 30) return "yellow";
      else if(depth > 10) return "lightgreen";
      else return "green";
    }

    // make a function that determines the size of the radius
    function radiusSize(mag){
      if (mag == 0) return 1; // makes sure that a 0 mag earthquake shows up
      else return mag * 5; // makes sure that the circle is pronounced in the map
    }  
    
    // add on to the style for each data point
    function dataStyle(feature) {
      return {
        opacity: 0.5,
        fillOpacity: 0.5,
        fillColor: dataColor(feature.geometry.coordinates[2]), // use index 2 for the depth
        color: "#000000", // black outline
        radius: radiusSize(feature.properties.mag), // grabs the magnitude 
        weight: 0.5,
        stroke: true
      };

    }

    // add the GeoJson Data to the earthquake layer group
    L.geoJson(earthquakeData, {
      // make each feature a marker that is on the map, each marker is a circle
      pointToLayer: function(feature, latLng) {
        return L.circleMarker(latLng);
      },
      // set the style for each marker
      style: dataStyle, // calls the data style function and passes in the earthquake data
      // add popups
      onEachFeature: function(feature, layer){
        layer.bindPopup(`Magnitude: <b>${feature.properties.mag}</b><br>
                        Depth: <b>${feature.geometry.coordinates[2]}</b><br>
                        Location: <b>${feature.properties.place}</b>`);
      }
    }).addTo(earthquakes);
  
});

 // add the earthquake layer to the map
 earthquakes.addTo(myMap);

// add the overlay for the tectonic plates for the earthquakes
let overlays = {
  "Tectonic Plates": tectonicplates,
  "Earthquake Data": earthquakes
};

// add the Layer control
L.control
  .layers(basemaps, overlays)
  .addTo(myMap);

// Add the legend to the map
let legend = L.control({
  position: "bottomright"
});

// Add the properties for the legend
legend.onAdd = function() {
  // Div for legend to appear in the page
  let div = L.DomUtil.create("div", "info legend");

  // Set up the intervals
  let intervals = [-10, 10, 30, 50, 70, 90];
  // Set the color for the intervals
  let colors = [
    "green",
    "lightgreen",
    "yellow",
    "orange",
    "darkorange",
    "red"
  ];

  // Loop through the intervals and the colors and generate a label
  // with a colored square for each interval
  for (let i = 0; i < intervals.length; i++) {
    div.innerHTML += `<i style='background: ${colors[i]}'></i> ${intervals[i]}${(intervals[i + 1] ? ` km &ndash; ${intervals[i + 1]} km` : "+")}<br>`;
  }

  return div;
};

// Add the legend to the map
legend.addTo(myMap);