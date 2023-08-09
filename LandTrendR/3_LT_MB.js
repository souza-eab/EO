//Gena libraries are super useful!
var palettes = require('users/gena/packages:palettes');
var style = require('users/gena/packages:style');
var utils = require('users/gena/packages:utils');


var assetMosaic = 'projects/nexgenmap/MapBiomas2/LANDSAT/BRAZIL/mosaics-2';
var assetDyn = '"projects/mapbiomas-workspace/public/collection7_1/mapbiomas_collection71_secondary_vegetation_age_v1"';
var cerr = ee.Image("projects/mapbiomas-workspace/AUXILIAR/biomas-2019-raster").eq(4).selfMask();

var years = [
                            '1985',
                            //'1986', '1987', '1988','1989', 
                            '1990',
                            // '1991', '1992','1993', '1994',
                            '1995',
                            // '1996','1997', '1998', '1999',
                            '2000',
                            // '2001', '2002', '2003', '2004',
                            '2005',
                            // '2006', '2007', '2008', '2009',
                            '2010',
                            // '2011', '2012', '2013', '2014',
                            '2015',
                            // '2016','2017', '2018', '2019','2020',
                            '2021'
                        ]


var biomes = [
    //'CAATINGA',
    'CERRADO',
   // 'MATAATLANTICA',
   // 'PAMPA',
    //'PANTANAL',
    // 'AMAZONIA'
];


var sec_veg = ee.Image("projects/mapbiomas-workspace/public/collection7_1/mapbiomas_collection71_secondary_vegetation_age_v1")
            .select("secondary_vegetation_age_2021")
            .selfMask()
            .updateMask(cerr);


var collection = ee.ImageCollection(assetMosaic)
    .filter(ee.Filter.inList('biome', biomes))
    .filter(ee.Filter.neq('satellite', 'l5'))
    .filterBounds(geom);


var vis = {
  bands: ['swir1_median_dry', 'nir_median_dry', 'red_median_dry'],
  gain: [0.08, 0.06, 0.2],
  gamma: 0.85
};


years.forEach(
    function(year){
        var subcollection = collection.filter(ee.Filter.eq('year', parseInt(year)));
        //print(subcollection)
        Map.addLayer(subcollection, vis, year.toString());
    }  
);

Map.addLayer(sec_veg, 
            {palette:[
                '#ffffe5',
                '#f7fcb9',
                '#d9f0a3',
                '#addd8e',
                '#78c679',
                '#41ab5d',
                '#238443',
                '#006837',
                '#004529'
            ].reverse()},
            "sec_veg_age_2021");  
Map.addLayer(table);





//////////////////LT 
// |>ID-AOI_ALGORITHM_INDEX_SEASON_DRY-WET-ANNUAL_YEAR
// ALGORITHM = A1-Kennedy et al, 2018, A2-Shimizu et al, 2023, A3- Shimizu et al, 2023 ...
// LT_AOI = 1-5 | DF, BA (n=2), PI (n=2); 

// Path img
var pathSWIR1 = 'projects/mapbiomas-workspace/SEEG/2023/EO/LT_AOI/1_A1_B5_DRY_2021';
var pathNIR = 'projects/mapbiomas-workspace/SEEG/2023/EO/LT_AOI/1_A1_B4_DRY_2021';
var pathRED = 'projects/mapbiomas-workspace/SEEG/2023/EO/LT_AOI/1_A1_B7_DRY_2021';

// RenameBands
var renameBands = function(image, bands) {
  var bandNames = image.bandNames();
  var renamedBands = bandNames.map(function(name) {
    return ee.String(name).replace('yr_2021', bands);
  });
  return image.select(bandNames, renamedBands);
};

// Importar as imagens e renomear as bandas
var imageSWIR1 = ee.Image(pathSWIR1);
var imageNIR = ee.Image(pathNIR);
var imageRED = ee.Image(pathRED);

var bands = ['swir1_median', 'nir_median', 'red_median'];

imageSWIR1 = renameBands(imageSWIR1, bands[0]);
imageNIR = renameBands(imageNIR, bands[1]);
imageRED = renameBands(imageRED, bands[2]);

// Compor a imagem RGB usando as bandas SWIR1, NIR e RED
var Composite = ee.Image.cat(imageSWIR1, imageNIR, imageRED);


var vis2 = {
  bands: ['swir1_median', 'nir_median', 'red_median'],
  gain: [0.08, 0.06, 0.2],
  gamma: 0.85
};


// Visualizar a imagem RGB no mapa com os parâmetros definidos
Map.centerObject(Composite, 10); // Centralizar o mapa na área coberta pelo mosaico
Map.addLayer(Composite, vis, 'Composição RGB');

var delta = Composite,subtract


//// AOI |> St. Tereza-DF:  
//var lat = -47.211234608351944;
//var long =-15.851597404114354;
//var point = ee.Geometry.Point([lat, long]);
//
//// Criar um buffer de 1 km em torno do ponto
//var geom = point.buffer(1000); // 1000 metros é igual a 1 km
//
//Map.addLayer(geom, {color: 'red'}, 'Buffer de 1 km');
//
//
//
//
