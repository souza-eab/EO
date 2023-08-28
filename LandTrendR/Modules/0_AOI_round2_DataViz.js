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
