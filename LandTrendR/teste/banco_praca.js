
// Carregar a FeatureCollection
var pontos = ee.FeatureCollection('users/felipelenti/20230711_044903_loss_and_sec_veg');

// Definir a distância do buffer em metros (10 km = 10000 metros)
var distanciaBuffer = 10000;


var roi = ee.Geometry.Point([-47.8657, -15.9119]).buffer(75000);
// Função para adicionar o buffer em cada ponto
var adicionarBuffer = function(feature) {
  var ponto = ee.Feature(feature);
  var buffer = ponto.geometry().buffer(distanciaBuffer);
  return ponto.set('buffer', buffer);
};

// Mapear a função em cada elemento da FeatureCollection
var pontosComBuffer = pontos.map(adicionarBuffer);

// Visualizar os pontos com o buffer no mapa
Map.addLayer(pontosComBuffer, {}, 'Pontos com Buffer');


print(pontosComBuffer)

var aoi_cerrado = ee.FeatureCollection('users/barbarazimbres/Cerrado_2019');
var mb = ee.Image('projects/mapbiomas-workspace/public/collection7/mapbiomas_collection70_integration_v2')
        .select('classification_2015');
      
var lulc_For = mb.eq(3)
var lulc_Sav= mb.eq(4)
var lulc_Gra= mb.eq(12);
var lulc = lulc_For.add(lulc_Sav).add(lulc_Gra).rename('lulc')
lulc = lulc.eq(1).updateMask(lulc.eq(1)).clip(aoi_cerrado);


Map.addLayer(lulc);
Map.addLayer(aoi_cerrado);









// Carregar a FeatureCollection
var pontos = ee.FeatureCollection('users/felipelenti/20230711_044903_loss_and_sec_veg');

// Função para imprimir as coordenadas de cada ponto
var imprimirCoordenadas = function(feature) {
  var ponto = ee.Feature(feature);
  var coordenadas = ponto.geometry().coordinates().getInfo();
  print('Coordenadas do Ponto:', coordenadas);
};

// Obtém a lista de pontos
var listaPontos = pontos.toList(pontos.size());

// Itera sobre a lista de pontos e imprime as coordenadas
listaPontos.evaluate(function(pontos) {
  pontos.forEach(imprimirCoordenadas);
});



// Criar a ROI inicial
var roi_1 = ee.Geometry.Point([-44.1285, -11.0351]).buffer(5000);
var roi_2 = ee.Geometry.Point([-44.263093028651596, -11.141555021980862]).buffer(5000);
var roi_3 = ee.Geometry.Point([-47.211234608351944,-15.851597404114354]).buffer(5000);
var roi_4 = ee.Geometry.Point([-44.48368022273305,-7.947553865379715]).buffer(5000);
var roi_5 = ee.Geometry.Point([-44.9203867657018,-8.078102643933084]).buffer(5000);

// Adicionar buffers à ROI inicial
var roi = roi_1.union(roi_2).union(roi_3).union(roi_4).union(roi_5)


// Visualizar a ROI com os buffers no mapa
Map.addLayer(roi, {}, 'ROI com Buffers');
