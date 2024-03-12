/////////////////////////////////////////////////////////////////////////////////////////////////////////
//Main code body written by: Pedro Rodriguez-Veiga
//Organization: National Centre for Earth Observation - University of Leiceicester (UK)
//Purpose: Generate ALOS PALSAR / ALOS-2 PALSAR-2 mosaics multi-temporal filtered, normalised and gap-filled
//Current version: 1.0
/////////////////////////////////////////////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////////////////////////////////////////////////
// 1 - INITIAL SETTINGS (Input needed)
/////////////////////////////////////////////////////////////////////////////////////////////////////////
//Study area
// Polygon study area
var polygon = ee.FeatureCollection('users/prv/Cerrado_Retangulo');
Map.centerObject(polygon);

// Set initial and final year for the PALSAR-2 annual mosaic. Set the same year for both if you only one 1 year ourput, or different for temporal composite
// PALSAR-2 mosaics available: 2015,2016,2017,(2018, 2019, and ahead should be available in the future)
var YiniDate = 2015;
var YendDate = 2017;

// Set initial and final year for the PALSAR baseline mosaic. Set the same year for both if you only one 1 year ourput, or different for temporal composite
// PALSAR/PALSAR-2 mosaics available: 2007,2008,2009,2010
var BiniDate = 2007;
var BendDate = 2009;

//Moving window size for the multi-temporal filter (radius = 5 means 5x5 pixels)
//It has to be an odd number (e.g.3,5,7,etc)
var radius = 5;

//Note: If you need to export the mosaics in a smaller format (DN instead of dB) go to section 8- Export for input

/////////////////////////////////////////////////////////////////////////////////////////////////////////
// 2 - FUNCTIONS
/////////////////////////////////////////////////////////////////////////////////////////////////////////
// Functions for ALOS collection qa, and data transformations
var maskQA = function(image) {
   return image.mask(image.select('qa').neq(0)
   .and(image.select('qa').neq(100)
   .and(image.select('qa').neq(150)
   )));
  };

var to_dB = function(image) {
  // Keep this list of properties.
  var keepProperties = ['system:asset_size', 'system:footprint', 'system:index','system:time_start'];
  // apply function
  var log = image.multiply(image).log10().multiply(10).subtract(83);
  // Return a new Feature, copying properties from the old Feature.
  return ee.Image(log).set({
    'system:asset_size':image.get('system:asset_size'),
    'system:footprint':image.get('system:footprint'), 
    'system:index':image.get('system:index'),
    'system:time_start':image.get('system:time_start'),
  });
};

var to_power = function(image) {
  // Keep this list of properties.
  var keepProperties = ['system:asset_size', 'system:footprint', 'system:index','system:time_start'];
  // apply function
  var power = image.expression('10**(0.1*image)',{'image': image})
  // Return a new Feature, copying properties from the old Feature.
  return ee.Image(power).set({
    'system:asset_size':image.get('system:asset_size'),
    'system:footprint':image.get('system:footprint'), 
    'system:index':image.get('system:index'),
    'system:time_start':image.get('system:time_start'),
  });
};

var power_to_dB = function(image) {
  // Keep this list of properties.
  var keepProperties = ['system:asset_size', 'system:footprint', 'system:index','system:time_start'];
  // apply function
  var db = image.abs().log10().multiply(10.0);
  // Return a new Feature, copying properties from the old Feature.
  return ee.Image(db).set({
    'system:asset_size':image.get('system:asset_size'),
    'system:footprint':image.get('system:footprint'), 
    'system:index':image.get('system:index'),
    'system:time_start':image.get('system:time_start'),
  });
};

// Normalization as in Marshak, C., M. Simard and M. Denbina (2019). "Monitoring Forest Loss in ALOS/PALSAR Time-Series with Superpixels." Remote Sensing 11(5): 556.
var normalize = function(image,image2) {
  var mnmx1 = image.reduceRegion(ee.Reducer.mean().combine(ee.Reducer.stdDev(), null, true),polygon,5000);  
  var means1 = ee.Image.constant(mnmx1.values(["HH_mean", "HV_mean"]));
  var stdDev1 = ee.Image.constant(mnmx1.values(["HH_stdDev", "HV_stdDev"]));
  var mnmx2 = image2.reduceRegion(ee.Reducer.mean().combine(ee.Reducer.stdDev(), null, true),polygon,5000);  
  var means2 = ee.Image.constant(mnmx2.values(["HH_mean", "HV_mean"]));
  var stdDev2 = ee.Image.constant(mnmx2.values(["HH_stdDev", "HV_stdDev"]));
  var rgb = image.select(['HH','HV']).subtract(means1).multiply(stdDev2.divide(stdDev1)).add(means2);
  return rgb;
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////
// 3 - MULTITEPORAL SPECKLE FILTER (long function)
/////////////////////////////////////////////////////////////////////////////////////////////////////////
function multitemporalDespeckle(images, radius, units, opt_timeWindow) {
  var timeWindow = opt_timeWindow || { before: -11, after: 11, units: 'year' }
  
  var bandNames = ee.Image(images.first()).bandNames()
  var bandNamesMean = bandNames.map(function(b) { return ee.String(b).cat('_mean') })
  var bandNamesRatio = bandNames.map(function(b) { return ee.String(b).cat('_ratio') })
  
  // compute space-average for all images
  var meanSpace = images.map(function(i) {
    var reducer = ee.Reducer.mean()
    var kernel = ee.Kernel.square(radius, units)
    
    var mean = i.reduceNeighborhood(reducer, kernel).rename(bandNamesMean)
    var ratio = i.divide(mean).rename(bandNamesRatio)

    return i.addBands(mean).addBands(ratio)
  })

  /***
   * computes a multi-temporal despeckle function for a single image
   */
  function multitemporalDespeckleSingle(image) {
    var t = image.date()
    var from = t.advance(ee.Number(timeWindow.before), timeWindow.units)
    var to = t.advance(ee.Number(timeWindow.after), timeWindow.units)
    var keepProperties = ['system:asset_size', 'system:footprint', 'system:index','system:time_start'];

    var meanSpace2 = ee.ImageCollection(meanSpace)
                        .select(bandNamesRatio)
                        .filterDate(from, to)

    var b = image.select(bandNamesMean)
    
    return b.multiply(meanSpace2.sum())
            .divide(meanSpace2.count())
            .rename(bandNames)
            .set({
                'system:asset_size':image.get('system:asset_size'),
                'system:footprint':image.get('system:footprint'), 
                'system:index':image.get('system:index'),
                'system:time_start':image.get('system:time_start'),
              });
  }
  
  return meanSpace.map(multitemporalDespeckleSingle).select(bandNames)
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////
// 4 - FILTERING COLLECTIONS AND PROCESSING
/////////////////////////////////////////////////////////////////////////////////////////////////////////
//Filter temporary collection for multi-temporal filter
var PALSARtemp = ee.ImageCollection('JAXA/ALOS/PALSAR/YEARLY/SAR')
        .filterDate('2006-01-01', '2024-12-31')
        .filterBounds(polygon)
        .map(maskQA)
        .map(to_dB);
print ('PALSARtemp', PALSARtemp, PALSARtemp.sum());

//Select only polarization bands and convert to power
var PALSAR = PALSARtemp.select(['HH','HV'])
                       .map(to_power);
print('PALSAR', PALSAR);

// Apply multi-temporal filter (denoise images)
var units = 'pixels';
var PALSARDenoised = multitemporalDespeckle(PALSAR, radius, units);
print('PALSARDenoised', PALSARDenoised);


/////////////////////////////////////////////////////////////////////////////////////////////////////////
// 5 - TEMPORAL COMPOSITING
/////////////////////////////////////////////////////////////////////////////////////////////////////////
var iniDate = YiniDate+'-01-01';
var endDate = YendDate+'-12-31';

var BBiniDate = BiniDate+'-01-01';
var BBendDate = BendDate+'-12-31';

//NOTE: I am using the min value for the composites instead of mean or median. 
//      The aim is to reduce the number of pixels with anomalous high backscatter due to soil moisture, and preserve forest disturbances (lower backscatter) up to the last date of the composite  

/// Composites without multi-temporal filter for the selected dates
var Original_data = PALSAR.map(power_to_dB)
.filterDate(iniDate, endDate)
.reduce(ee.Reducer.min()).rename('HH','HV');
print('Original_data', Original_data);

///Composites with multi-temporal filter for the selected dates
var Denoised_data = PALSARDenoised.map(power_to_dB)
.filterDate(iniDate, endDate)
.reduce(ee.Reducer.min()).rename('HH','HV');
print('Denoised_data', Denoised_data);

///Baseline ALOS PALSAR
var Denoised_data_base = PALSARDenoised.map(power_to_dB)
.filterDate(BBiniDate, BBendDate)
.reduce(ee.Reducer.min()).rename('HH','HV');
print('Denoised_data_base', Denoised_data_base);

/// Rename variable
var PALSAR2d = Denoised_data;
var PALSARd = Denoised_data_base;

// Normalize PALSAR-2 to PALSAR-1
var nPALSAR2d = normalize(PALSAR2d, PALSARd);

/////////////////////////////////////////////////////////////////////////////////////////////////////////
// 6 - GAP FILLING
/////////////////////////////////////////////////////////////////////////////////////////////////////////
//Several focal mean textures to fill gaps
var P2texture7 = nPALSAR2d.focal_mean({
  radius:3,
  kernelType: 'circle',
  iterations:7
});

var Ptexture7 = PALSARd.focal_mean({
  radius:3,
  kernelType: 'circle',
  iterations:7
});


//Sequential gap filling process
var nPALSAR2dg = nPALSAR2d.unmask(P2texture7);
var PALSARdg = PALSARd.unmask(Ptexture7);

/////////////////////////////////////////////////////////////////////////////////////////////////////////
// 7 - VISUALIZATION
/////////////////////////////////////////////////////////////////////////////////////////////////////////
// Vis parameters
var imageVisParam = {"opacity":1,"bands":["HV","HH","HV"],"max":0, "min":-20,"gamma":0.5};
Map.addLayer(PALSARd.clip(polygon), imageVisParam,'PALSAR_denoised_baseline');
Map.addLayer(PALSARdg.clip(polygon), imageVisParam,'PALSAR_denoised_baseline_gapfilled');
Map.addLayer(Original_data.clip(polygon), imageVisParam,'PALSAR2_original');
Map.addLayer(PALSAR2d.clip(polygon), imageVisParam,'PALSAR2_denoised');
Map.addLayer(nPALSAR2d.clip(polygon), imageVisParam,'norm_PALSAR2_denoised');
Map.addLayer(nPALSAR2dg.clip(polygon), imageVisParam,'norm_PALSAR2_denoised_gapfilled');

/////////////////////////////////////////////////////////////////////////////////////////////////////////
// 8 - EXPORT
/////////////////////////////////////////////////////////////////////////////////////////////////////////
// OPTIONAL: Un-comment the 2 lines below to transform to DN from dB (for smaller exporting)
var nPALSAR2dg = nPALSAR2dg.multiply(0.1151).exp().multiply(14125).uint16().clip(polygon);
var PALSARdg = PALSARdg.multiply(0.1151).exp().multiply(14125).uint16().clip(polygon);

Export.image(PALSARdg.clip(polygon), 'PALSAR_denoised_gapfilled'+ '_' + BBiniDate + '_' + BBendDate,
{region: polygon, assetId: 'PALSAR_denoised_gapfilled'+ '_' + BBiniDate + '_' + BBendDate, maxPixels: 10000000000000, 'scale':30,'driveFolder':'EarthEngine'});

Export.image(nPALSAR2dg.clip(polygon), 'PALSAR2_norm_denoised_gapfilled'+ '_' + iniDate + '_' + endDate,
{region: polygon, assetId: 'PALSAR2_norm_denoised_gapfilled'+ '_' + iniDate + '_' + endDate, maxPixels: 10000000000000, 'scale':30,'driveFolder':'EarthEngine'});
