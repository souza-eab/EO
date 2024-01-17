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
    .filter(ee.Filter.neq('satellite', 'l9'));


var vis = {
  bands: ['swir1_median', 'nir_median', 'red_median'],
  gain: [0.08, 0.06, 0.2],
  gamma: 0.85
};

years.forEach(
    function(year){
        var subcollection = collection.filter(ee.Filter.eq('year', parseInt(year)));
        
        Map.addLayer(subcollection, vis, year.toString(), false);
    }  
);

Map.addLayer(sec_veg, 
            {min:0, max: 33, palette:[
                '#ffffe5',
                '#f7fcb9',
                '#d9f0a3',
                '#addd8e',
                '#78c679',
                '#41ab5d',
                '#238443',
                '#006837',
                '#004529'
            ]},
            "sec_veg_age_2021");  



var Mapp = require('users/joaovsiqueira1/packages:Mapp.js');
var ColorRamp = require('users/joaovsiqueira1/packages:ColorRamp.js');

Map.setOptions({ 'styles': { 'Dark': Mapp.getStyle('Dark'), 'Dark2':Mapp.getStyle('Dark2'), 'Aubergine':Mapp.getStyle('Aubergine'), 'Silver':Mapp.getStyle('Silver'), 'Night':Mapp.getStyle('Night'), } });
Map.setOptions('Dark2');


/// Assets
var cerrado = ee.FeatureCollection("projects/mapbiomas-workspace/AUXILIAR/biomas-2019")
                  .filterMetadata('Bioma', 'equals', 'Cerrado')
                  .geometry();
Map.addLayer(cerrado, {color: 'gray', opacity: 0.3}, 'Biome-Cerrado')
Map.centerObject(cerrado);                 
Map.setZoom(5.5)



// Define a Point object.
//var AOI_round2 = ee.Geometry.Point(-45.266480925804025,-11.829634919925066);
var AOI_round2 = ee.Geometry.Point(-45.081314362784795,-11.379133298351128);


// Apply the buffer method to the Point object.
var pointBuffer = AOI_round2.buffer({'distance': 1000});

// Print the result to the console.
print('point.buffer(...) =', pointBuffer);

// Display relevant geometries on the map.

Map.centerObject(AOI_round2, 16);
Map.addLayer(AOI_round2,
             {'color': 'black'},
             'Geometry [black]: point');
Map.addLayer(pointBuffer,
             {'color': 'red'},
             'Result [red]: point.buffer');
             
             

var AOI =ee.List([[-49.12170662670784,-15.809106234938541]  // Santo Antônio, Pirenópolis - GO, Brasil
    ,  [-48.88653106956142,-15.644331240083975] // Lagolandia; 
    , [-47.100270247986415,-17.065932751168447] // Porto Velho -MG
    , [-46.92517564349423,-17.114172717153416] // Lagoa - MG
    , [-45.266480925804025,-11.829634919925066] // Pedro Amolar
    , [-45.39937799093191,-11.925875599319191] // Vauzinho
    , [-54.61543339408989,-16.00990782327285] // Jucimeira 1 - MT
    , [-54.61114185966606,-16.033006951551222] // Jucimeira 2 - MT
    , [-48.08248542732097,-7.657674076243871] // Ribeirão Cana-Brava, TO
    , [-48.04377578681804,-7.648657065174058] // Tabuleiro Alto, TO
    , [-48.1090929407487,-7.67247517123241] // Lajinha, TO
    ,  [-52.036927437404685,-18.89070712606298] // Lajinha_2, TO
    ,  [-51.90687420432634,-18.86462180175331] // Vale do Aporé, GO
    ,  [-46.9769624927473,-19.178707714642652] // Fz Morro Agudo, MG
    ,  [-46.48942911803145,-19.116632942516436] // Fz Pavão, MG
    ,  [-45.50378225900385,-13.550152678041423] // Estr. Possebon, BA
    ,  [-45.64454458810541,-13.509429688883838] // Fz Henke, BA
    ,  [-44.32547470148165,-11.038594004898945] // Barrinha, BA
    ,  [-44.15105929247334,-11.033412526563287] // Barro vermelho, BA
    ,  [-45.081314362784795,-11.379133298351128]])  //Fz Vale do Ouro ,BA


// var mp = ee.FeatureCollection(AOI)
// print(mp)
var mp = ee.FeatureCollection(AOI.map(function(p){
  var point = ee.Feature(ee.Geometry.Point(p), {})
  var AOI_2 = point.buffer({'distance': 2000});
  //return point
  return AOI_2
}))
Map.addLayer(mp, {'color': 'blue'}, 'AOI-2k')
print(mp)
