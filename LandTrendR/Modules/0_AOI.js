// AOI 
var pontos = ee.FeatureCollection('users/felipelenti/20230711_044903_loss_and_sec_veg');

// Imprimir as coordenadas de cada AOI
var imprimirCoordenadas = function(feature) {
  var ponto = ee.Feature(feature);
  var coordenadas = ponto.geometry().coordinates().getInfo();
  print('Coordenadas do Ponto:', coordenadas);
};

// Lista AOI
var listaPontos = pontos.toList(pontos.size());

// Itera sobre a lista de pontos e imprime as coordenadas
listaPontos.evaluate(function(pontos) {
  pontos.forEach(imprimirCoordenadas);
});

/// Output
// AOI |> Formigueiro-BA: [-44.1285,-11.0351]);
// AOI |> Marrecas-BA:    [-44.263093028651596,-11.141555021980862]
// AOI |> St. Tereza-DF:  [-47.211234608351944,-15.851597404114354]
// AOI |> Malicas- PI     [-44.48368022273305,-7.947553865379715]
// AOI |> Jatoba-PI :     [-44.9203867657018,-8.078102643933084]
