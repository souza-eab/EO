/////////////////////////////////////////////////////////////////////////////////////////////////////////
// Main code body written by: Pedro Rodriguez-Veiga | Edriano Souza (Refactored)
// Organization: National Centre for Earth Observation - University of Leiceicester (UK) | Amazon Environmental Research Institute
// Purpose: Generate cloud free Landsat 8 C1 temporal median composites (v1)
// Purpose: Generate cloud-free Landsat 8 C2 annual median composites (v2)
// Current version: 2.2
// Collaborators: Barbara Zimbres (IPAM) | Edriano Souza
// New in this version:
//  + Export Full |>
//  + creating seasonal composites (2.1)
//  + Code Refactored (2.0)
/////////////////////////////////////////////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////////////////////////////////////////////////
// 1 - INITIAL SETTINGS (Input needed)
/////////////////////////////////////////////////////////////////////////////////////////////////////////
// Polygon study area
var polygon = ee.FeatureCollection('users/prv/Cerrado_Retangulo');
Map.centerObject(polygon);

// Set Years
var years = [
  //['2013-12-01', '2014-03-31', '2014-06-01', '2014-09-30'],
  ['2014-12-01', '2015-03-31', '2015-06-01', '2015-09-30'], 
  ['2015-12-01', '2016-03-31', '2016-06-01', '2016-09-30'],
  ['2016-12-01', '2017-03-31', '2017-06-01', '2017-09-30'],
  ['2017-12-01', '2018-03-31', '2018-06-01', '2018-09-30'],
  ['2018-12-01', '2019-03-31', '2019-06-01', '2019-09-30'],
  ['2019-12-01', '2020-03-31', '2020-06-01', '2020-09-30'],
  ['2020-12-01', '2021-03-31', '2021-06-01', '2021-09-30'],
  ['2021-12-01', '2022-03-31', '2022-06-01', '2022-09-30']
  ];

/////////////////////////////////////////////////////////////////////////////////////////////////////////
// 2 - FUNCTIONS
/////////////////////////////////////////////////////////////////////////////////////////////////////////
//Functions to mask using pixel_qa layer 
var maskClouds = function(image) {
   return image.mask(image.select('pixel_qa').bitwiseAnd(32).eq(0)
   .and(image.select('pixel_qa').bitwiseAnd(8).eq(0)));
  };

// Function to rename bands and convert to integer16 data type
var renameBands = function(image) {
  var bands = image.bandNames();
  var newNames = ['blue', 'green', 'red', 'NIR', 'SWIR_1', 'SWIR_2'];
  
  return image.select(bands).rename(newNames).int16();
};


/////////////////////////////////////////////////////////////////////////////////////////////////////////
// 3- FILTER COLLECTION & CLOUD MASKING
/////////////////////////////////////////////////////////////////////////////////////////////////////////
var collection_rain = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2').filterBounds(polygon);
//print('collection_rain',collection_rain.limit(50))
var collection_dry = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2').filterBounds(polygon);
//print('collection_dry',collection_dry.limit(50))

for (var i = 0; i < years.length; i++) {
  var rainPeriod = years[i].slice(0, 2);
  print('RainPeriod',rainPeriod)
  var dryPeriod = years[i].slice(2);
  print('DryPeriod',dryPeriod)  
  var collection_rainPeriod = 
    ee.ImageCollection("LANDSAT/LC08/C01/T1_SR").filterDate(rainPeriod[0], rainPeriod[1]);
  
  var collection_dryPeriod = 
    ee.ImageCollection("LANDSAT/LC08/C01/T1_SR").filterDate(dryPeriod[0], dryPeriod[1]);
  
    // Apply cloud masking function
    var collection_rain_nd = collection_rainPeriod.map(maskClouds);
    var collection_dry_nd = collection_dryPeriod.map(maskClouds);
    
    // Calculate median composite
    var composite_rain_median = collection_rain_nd.reduce(ee.Reducer.median());
    print('Rain_Composite',composite_rain_median);
    var composite_dry_median = collection_dry_nd.reduce(ee.Reducer.median());
    print('Dry_Composite', composite_dry_median);
    
    // Clip composite to polygon
    var compositeclip_rain = composite_rain_median.clip(polygon);
    print(compositeclip_rain);
    var compositeclip_dry = composite_dry_median.clip(polygon);
    print(compositeclip_dry);
    
    // Rename bands and convert to integer16 data type
    var L8_composite_rain = compositeclip_rain.select(
    ["B1_median", "B2_median", "B3_median", "B4_median", "B5_median", "B7_median"], // old names
    ["blue","green","red","NIR","SWIR_1","SWIR_2"] // new names
    ).int16();
    print(L8_composite_rain);
    
    var L8_composite_dry = compositeclip_dry.select(
      ["B1_median", "B2_median", "B3_median", "B4_median", "B5_median", "B7_median"], // old names
      ["blue","green","red","NIR","SWIR_1","SWIR_2"] // new names
      ).int16();
      print(L8_composite_dry);
      
      //Visualization parameters
      var vizParams = 
      {min: 0,
      max: 2000,
      gamma: [1, 1, 1]
      };
      // Add visualization to map (2, 1, 0)
      //Map.addLayer(L8_composite_rain.select("SWIR_1","NIR",'red'), vizParams, 'L8 Composite Rain ' + (i + 2013));
      //Map.addLayer(L8_composite_dry.select("SWIR_1","NIR",'red'), vizParams, 'L8 Composite Dry ' + (i + 2013));
      
      //Map.addLayer(L8_composite_rain.select("red","green",'blue'), vizParams, 'L8 Composite Rain ' + (i + 2013));
      //Map.addLayer(L8_composite_dry.select("red","green",'blue'), vizParams, 'L8 Composite Dry ' + (i + 2013));
     
      //Map.addLayer(L8_composite_rain.select(2, 1, 0), vizParams, 'L8 Composite Rain ' + (i + 2015));
      //print(L8_composite_rain.projection())
      //Map.addLayer(L8_composite_dry.select(2, 1, 0), vizParams, 'L8 Composite Dry ' + (i + 2015));
      
      
      // Export L8CompositeRain to Image Collection
      var imageIdRain = 'C1_Rain_' + (i + 2015);
      var collectionIdRain = 'projects/mapbiomas-workspace/SEEG/2023/EO/L8';
      exportImageToCollection(L8_composite_rain, imageIdRain, collectionIdRain);
      
      // Export L8CompositeDry to Image Collection
      var imageIdDry = 'C1_Dry_' + (i + 2015);
      var collectionIdDry = 'projects/mapbiomas-workspace/SEEG/2023/EO/L8';
      exportImageToCollection(L8_composite_dry, imageIdDry, collectionIdDry);
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////
// 6 - EXPORT TO IMAGE COLLECTION
/////////////////////////////////////////////////////////////////////////////////////////////////////////
// Function to export an image to an Image Collection in the Asset
function exportImageToCollection (image, imageId, collectionId) {
  Export.image.toAsset({
    image: image,
    description: 'L8_' + imageId,
    assetId: collectionId + '/' + imageId,
    scale: 30,
    //crs: 4326,
    maxPixels: 1e13,
    pyramidingPolicy: {'.default': 'mode'},
    region: polygon
  });
}
