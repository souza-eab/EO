//######################################################################################################## 
//#                                                                                                    #\\
//#                      LANDTRENDR SOURCE AND FITTING ZONAL MEDIAN TIME SERIES                        #\\
//#                                                                                                    #\\
//########################################################################################################


/////////////////////////////////////////////////////////////////////////////////////////////////////////
// Main code adapted written by: Edriano Souza | Felipe Lenti | Barbara Zimbres 
// author: Justin Braaten | jstnbraaten@gmail.com
// Organization: Amazon Environmental Research Institute (IPAM)
// Purpose: this script will plot a time series of original and LandTrendr-fitted data
//        for the area within a given geometry aggregated by the median function
//         Export Img (dev)
// Current version: 0.0.0
// Update version: 0.0.1 - Exports
//                 0.0.0              
// Collaborators: Edriano Souza | Barbara Zimbres (IPAM) 

//########################################################################################################
//##### INPUTS ##### 
//########################################################################################################

// get geometry stuff
var aoi = ee.FeatureCollection('users/prv/Cerrado_Retangulo');
Map.centerObject(aoi);


// define parameters
var startYear = 1985;
var endYear = 2023;


// Set the season you want to evaluate
//var startDay = '12-01'; // Rainly
//var endDay = '03-31'; // Rainly
var startDay = '06-01'; // Dry
var endDay = '09-30'; // Dry

var index = 'NBR';
var maskThese = ['cloud', 'shadow', 'snow']; //Filters +add |> water, waterplus, nonforest 
var summaryScale = 30000; // About plot




// SM-More|> Shimizu et al., 2023 <https://doi.org/10.3390/rs15030851>
var runParams = { 
  maxSegments:            8,
  spikeThreshold:         0.9,
  vertexCountOvershoot:   3,
  preventOneYearRecovery: false,
  //recoveryThreshold:      0.25,
  recoveryThreshold:      1,
  //pvalThreshold:          0.05,
  pvalThreshold:          0.1,
  bestModelProportion:    0.75,
  minObservationsNeeded:  6
};


// Algorithm parameters |> landtrendR |Kennedy, et al., +<https://doi.org/10.1088/1748-9326/aa9d9e>
// var runParams = { 
//  maxSegments:            6,
//  spikeThreshold:         0.9,
//  vertexCountOvershoot:   3,
//  preventOneYearRecovery: true,
//  recoveryThreshold:      0.25,
//  pvalThreshold:          0.05,
//  bestModelProportion:    0.75,
//  minObservationsNeeded:  6
//};


//########################################################################################################
//########################################################################################################
//########################################################################################################

// ----- GET/MAKE FUNCTIONS -----
var ltgee = require('users/emaprlab/public:Modules/LandTrendr.js');

var getSummary = function(img, geom, scale) {
  return img.reduceRegion({
   reducer: ee.Reducer.median(),
   geometry: geom,
   scale: scale,
   maxPixels: 1e13,
   bestEffort: true
  });
};

//----- GET FITTED BAND STACK -----
// run LandTrendr
var lt = ltgee.runLT(startYear, endYear, startDay, endDay, aoi, index, [index], runParams, maskThese);

// get the fitted NBR out

var fitBandStack = ltgee.getFittedData(lt, startYear, endYear, index);
print(fitBandStack,'fitBandStack')

Map.addLayer(fitBandStack.select(['yr_2021']).clip(aoi),{},'NBR |LT-fitBandStack')

//----- GET RAW BAND STACK -----
// build annual surface reflectance collection (cloud and shadow masked medoid composite)
// Construir uma coleção anual de refletância de superfície (composto de medoid com máscara de nuvem e sombra)
var annualSRcollection = ltgee.buildSRcollection(startYear, endYear, startDay, endDay, aoi, maskThese);
print(annualSRcollection,'annualSRcollection')

// Transform the annual surface reflectance bands to whatever is in the bandList variable
// Transformar as bandas anuais de refletância da superfície para o que estiver na variável bandList
var indexCollection = ltgee.transformSRcollection(annualSRcollection, [index]);
print(indexCollection ,'indexCollection')

//Map.addLayer(indexCollection.clip(aoi),{},'NBR|rawBandStack')

// transform image collection of NBR (from bandList) to a image band stack
// Transformar a coleção de imagens NBR (de bandList) em uma pilha de bandas de imagens
var rawBandStack = ltgee.collectionToBandStack(indexCollection, startYear, endYear);
print(rawBandStack,'rawBandStack')
Map.addLayer(rawBandStack.select(['2021']).clip(aoi),{},'NBR |LT-rawBandStack')


//----- GET YEAR BAND STACK -----
var yearBandStack;
var tmp;
for(var yr = startYear; yr <= endYear; yr++){
  tmp = ee.Image(yr);
  tmp = tmp.select([0], [yr.toString()]);
  if(yr == startYear){
    yearBandStack = tmp;
  } else{
    yearBandStack = yearBandStack.addBands(tmp);
  }
}

//----- MAKE ARRAYS -----
var yearSummary = getSummary(yearBandStack, aoi, summaryScale).toArray();
print(yearSummary)
var rawSummary = getSummary(rawBandStack, aoi, summaryScale).toArray();
var fitSummary = getSummary(fitBandStack, aoi, summaryScale).toArray();
var chartArray = ee.Array.cat([rawSummary, fitSummary], 1);

//----- DISPLAY THE AOI -----
Map.setOptions('SATELLITE');
Map.centerObject(aoi, 13);
Map.addLayer(aoi, {color: "FF0000"});

//----- PLOT THE TIME SERIES -----
var chart = ui.Chart.array.values(chartArray, 0, yearSummary)
              .setSeriesNames(['Original', 'Fitted'])
              .setOptions({
                hAxis: {
                  'title': 'Year',
                  'maxValue': startYear,
                  'minValue': endYear,
                  'format': '####'
                },
                vAxis: {
                  'title': index,
                  'maxValue': 1000,
                  'minValue': -1000 
                },
                pointSize: 0,
                lineSize: 2,
            });

print(chart);
