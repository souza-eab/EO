/////////////////////////////////////////////////////////////////////////////////////////////////////////
// Main code body written by: Edriano Souza | Barbara Zimbres
// Organization: Amazon Environmental Research Institute (IPAM)
// Purpose: Using LandTrendR to detect losses based on INDEX (eg.NDVI).
//  Preucations: In this code, we are not using our own images, 
//               but instead utilizing the LandTrendR algorithm to fetch Landsat images.
// Current version: 0.0.1
// Collaborators: Edriano Souza | Barbara Zimbres (IPAM) 

// New in this version:
//  |> 0.0.1 - Test and export loss (magnitude of change) and the year of detection.
//  |> 0.0.0 - Applied test
/////////////////////////////////////////////////////////////////////////////////////////////////////////



/////////////////////////////////////////////////////////////////////////////////////////////////////////
// 1 - INITIAL SETTINGS (Input needed)
/////////////////////////////////////////////////////////////////////////////////////////////////////////

// Set your AOI
var aoi = ee.Geometry.Point(-50.588321420064, -15.808198324577203); // RioVermelho-GO
var aoi_2 = ee.FeatureCollection("projects/mapbiomas-workspace/parcelas_vs_gedi_v1");

// Set the years you want to evaluate
var startYear = 2007;
var endYear = 2023;

// Set the season you want to evaluate
var startDay = '12-01'; // Rainly
var endDay = '03-31'; // Rainly
//var startDay = '06-01'; // Dry
//var endDay = '09-30'; // Dry

// Select the evaluation index: 
//  |>  NBR | NDVI | NDSI | NDMI | TCB| TCG | TCW | TCA | B1…+... B7
var index = 'NDVI';
//var index = 'NBR';
var maskThese = ['cloud', 'shadow', 'water'];

/////////////////////////////////////////////////////////////////////////////////////////////////////////
// 2 - Principal component of parameters to configure in LandTrendR
/////////////////////////////////////////////////////////////////////////////////////////////////////////

// Algorithm parameters |> landtrendR |Kennedy, et al., +<https://doi.org/10.1088/1748-9326/aa9d9e>
var runParams = { 
  maxSegments:            6,
  spikeThreshold:         0.9,
  vertexCountOvershoot:   3,
  preventOneYearRecovery: true,
  recoveryThreshold:      0.25,
  pvalThreshold:          0.05,
  bestModelProportion:    0.75,
  minObservationsNeeded:  6
};

// // Algorithm parameters |> changeParams
var changeParams = {
  delta:  'loss',
  sort:   'greatest',
  year:   {checked:true, start:2007, end:2023},
  mag:    {checked:true, value:50,  operator:'>'}, 
  dur:    {checked:true, value:4,    operator:'<'},
  preval: {checked:true, value:300,  operator:'>'},
  mmu:    {checked:true, value:11},
};


//NBR
// define change parameters
//var changeParams = {
//  delta:  'gain',
//  sort:   'greatest',
//  year:   {checked:true, start:2007, end:2023},
//  mag:    {checked:true, value:300,  operator:'>'},
//  dur:    {checked:true, value:4,    operator:'<'},
//  preval: {checked:true, value:300,  operator:'>'},
//  mmu:    {checked:true, value:11},
//  
//};


/////////////////////////////////////////////////////////////////////////////////////////////////////////
// 3 - Applying the algorithm to your AOI (Area of Interest) eg. Buffer 1000m Rio Vermelho - GO
/////////////////////////////////////////////////////////////////////////////////////////////////////////

// Require LandTrendr.js
var ltgee = require('users/emaprlab/public:Modules/LandTrendr.js'); 

// Apply index
changeParams.index = index;

// Apply LandTrendr.js
var lt = ltgee.runLT(startYear, endYear, startDay, endDay, aoi, index, [], runParams, maskThese);


// Correspondence of layers applied by the algorithm
var changeImg = ltgee.getChangeMap(lt, changeParams);


/////////////////////////////////////////////////////////////////////////////////////////////////////////
// 4 - DataVis
/////////////////////////////////////////////////////////////////////////////////////////////////////////
// Set parameters
var palette = ['#9400D3', '#4B0082', '#0000FF', '#00FF00', '#FFFF00', '#FF7F00', '#FF0000'];
var yodVizParms = {
  min: startYear,
  max: endYear,
  palette: palette
};

var magVizParms = {
  min: 200,
  max: 800,
  palette: palette
};


// Create a buffer of the AOI
var region = aoi.buffer(1000).bounds();
Map.centerObject(region,16);
Map.addLayer(region, {color: 'gray'},'Buffer_1000')

// Datavis
Map.addLayer(changeImg.select(['mag']), magVizParms, 'Magnitude of Change');
Map.addLayer(changeImg.select(['yod']), yodVizParms, 'Year of Detection');



/////////////////////////////////////////////////////////////////////////////////////////////////////////
// 5 - Export
/////////////////////////////////////////////////////////////////////////////////////////////////////////

var exportImg = changeImg.clip(region).unmask(0).short();
print(exportImg)


// Export --
//Export.image.toDrive({
//  image: exportImg, 
//  description: 'lt-gee_disturbance_map_loss_85_23', 
//  folder: 'lt-gee_disturbance_map', 
//  fileNamePrefix: 'lt-gee_disturbance_map_loss_85_23', 
//  region: region, 
//  scale: 30, 
//  crs: 'EPSG:31982', 
//  maxPixels: 1e13
//});


///////////////////////////////////////////////////////////////////////////////////////////////////
// Set DataVis Options Images
///////////////////////////////////////////////////////////////////////////////////////////////////

Map.addLayer(aoi_2,{color:'red'},'FieldData_Barbara_et_al');
// Request the "Mapp" package to define map styles
var Mapp = require('users/joaovsiqueira1/packages:Mapp.js'); 

// Set the available map style options
Map.setOptions({
  'styles': {
    'Dark': Mapp.getStyle('Dark'),
    'Dark2':Mapp.getStyle('Dark2'),
    'Aubergine':Mapp.getStyle('Aubergine'),
    'Silver':Mapp.getStyle('Silver'),
    'Night':Mapp.getStyle('Night'),
  }
});

//  Set the default map style to "Satellite
Map.setOptions('Dark');
