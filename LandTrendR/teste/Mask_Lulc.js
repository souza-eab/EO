var aoi = ee.FeatureCollection('users/prv/Cerrado_Retangulo');
Map.centerObject(aoi);

// makes a global forest mask 
    // Product: Copernicus Global Land Service: Land Cover 100m: collection 2: epoch 2015: Globe>
    // more: <https://zenodo.org/record/3243509>
    var forCol = ee.ImageCollection("COPERNICUS/Landcover/100m/Proba-V/Global"); //PETER ADD (2015)
    //var forCol = ee.ImageCollection("COPERNICUS/Landcover/100m/Proba-V-C3/Global"); //Edriano ADD (2015-2019)
    var imgFor = forCol.toBands(); //PETER ADD
    var forestimage = imgFor.select('2015_forest_type') //PETER ADD

// Mapbiomas stable native vegetation mask
//***NOVO***: Construit uma imagem em que cada banda é a NVmask (conforme abaixo), mas para cada ano
var MB2019_cerrado = ee.Image('users/barbarazimbres/MB5_2019');
var F2019 = MB2019_cerrado.eq(3);
var S2019 = MB2019_cerrado.eq(4);
var G2019 = MB2019_cerrado.eq(12);
var NVmask = F2019.add(S2019).add(G2019).rename("NV_2019");
NVmask = NVmask.eq(1).updateMask(NVmask.eq(1));

// Computes the forest mask into a binary using an expression.
    var selectedForests = forestimage.expression( //PETER ADD
        'Band >= 0 ? 1 : 0', { //PETER ADD
          'Band': forestimage //PETER ADD
    }).clip(aoi); //PETER ADD
    
print(selectedForests)


// Visualizar o resultado no console
print('Resultado:', resultado);
Map.addLayer(forestimage.clip(aoi), {},'S2');
Map.addLayer(forestimage,{min:0,max:1},"NV2019");

Map.addLayer(NVmask,{},"MB");

var resultado = forestimage.clip(aoi).subtract(NVmask).clip(aoi);

Map.addLayer(resultado,{min:0,max:1},"Delta");
