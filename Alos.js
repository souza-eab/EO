/////////////////////////////////////////////////////////////////////////////////////////////////////////
// SET STUDY AREA
/////////////////////////////////////////////////////////////////////////////////////////////////////////

// Polygon study area
var polygon = ee.FeatureCollection('users/prv/Cerrado_Retangulo');
Map.centerObject(polygon);


/////////////////////////////////////////////////////////////////////////////////////////////////////////
// 2 - FUNCTIONS
/////////////////////////////////////////////////////////////////////////////////////////////////////////
// Functions for ALOS collection qa, and data transformations


// Essa função é usada para mascarar pixels noise com base em um valor de qualidade (qa) associado a cada pixel.
var maskQA = function(image) {
  return image.updateMask(
    image.select('qa').neq(0)
    .and(image.select('qa').neq(100)
    .and(image.select('qa').neq(150)))
  );
};

// Converte os valores da imagem para decibéis (dB). 
// Essa conversão é comumente aplicada a imagens de radar para facilitar a interpretação dos dados.
var to_dB = function(image) {
  // Aplicar a função
  var log = image.multiply(image).log10().multiply(10).subtract(83);
  // Manter essa lista de propriedades
  var keepProperties = ['system:asset_size', 'system:footprint', 'system:index', 'system:time_start'];
  // Retornar uma nova imagem, copiando as propriedades da imagem original
  var newImage = ee.Image(log).copyProperties(image, keepProperties);
  return newImage;
};

// Converte os valores da imagem de volta para sua escala original (potência) a partir dos decibéis.
var to_power = function(image) {
  // apply function
  var power = image.expression('pow(10, 0.1 * image)',{'image': image});
  // Keep this list of properties.
  var keepProperties = ['system:asset_size', 'system:footprint', 'system:index', 'system:time_start'];
  // Return a new Image, copying properties from the old Image.
  var newImage = ee.Image(power).copyProperties(image, keepProperties);
  return newImage;
};

// Converte os valores da imagem de potência para decibéis.
var power_to_dB = function(image) {
  // apply function
  var db = image.abs().log10().multiply(10.0);
  // Keep this list of properties.
  var keepProperties = ['system:asset_size', 'system:footprint', 'system:index', 'system:time_start'];
  // Return a new Image, copying properties from the old Image.
  var newImage = ee.Image(db).copyProperties(image, keepProperties);
  return newImage;
};

// Essa função aplica uma máscara na imagem de entrada com base na condição de que os valores da banda 'angle' devem ser maiores que 1 e menores que 80.
var maskLinci = function(image) {
  return image.updateMask(
    image.select('angle').gt(1)
    .and(image.select('angle').lt(80))
  );
};

// Essa função aplica uma máscara na imagem de entrada com base na condição de que os valores da banda 'HH' devem ser menores que 10.000.  
var maskHH = function(image) {
  return image.updateMask(
    image.select('HH').lt(10000)
  );
};


// Collection
var PALSAR = ee.ImageCollection('JAXA/ALOS/PALSAR/YEARLY/SAR_EPOCH')
  .filterDate('2014-01-01', '2021-12-31')
  .filterBounds(polygon)
  .map(maskQA)
  .map(maskLinci)
  .map(maskHH)
  .map(to_dB);
  //.mosaic();

// Select
var PALSAR_raw = PALSAR.select(['HH', 'HV']);
print('PALSAR raw - filtered', PALSAR_raw);

// Endereço da ImageCollection:

PALSAR_raw
  .aggregate_array('system:index')
  .evaluate(function(years){
    print('years',years);
    
    years.forEach(function(year){
      var image = PALSAR_raw
        .filter(ee.Filter.eq('system:index',year))
        .first()
        .set({
          year:ee.Number.parse(year).int(),
          description:'Imagens ALOS HH e HV corrigidas' // descrição do dado
        });
      
      print(year,image);
      
      var description = ''+year; // nome da imagem dentro da image colletion
      var assetId = 'projects/mapbiomas-workspace/SEEG/2023/EO/Alos'; // nome da image collection
      
      Export.image.toAsset({
        image:image,
        description:'SEEG-Alos-'+description,
        assetId:assetId+'/'+description,
        pyramidingPolicy: {'.default': 'mode'},
        // dimensions:,
        region:polygon, // geometria definida no inicio do mapa
        scale:25,
        // crs:,
        // crsTransform:,
        maxPixels:1e13,
        // shardSize:
      });
    });
  });

