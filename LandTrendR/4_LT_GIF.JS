{"dependencies":
{"users/emaprlab/public:UI Applications/LandTrendr/UI 
LandTrendr Time Series Animator":"
\n/*\n\n
Copyright 2019 Justin Braaten
\n\n
Licensed under the Apache License, Version 2.0 (the \"License\");

\n
you may not use this file except in compliance with the License.
\n
You may obtain a copy of the License at
\n\n    
http://www.apache.org/licenses/LICENSE-2.0\n\nUnless 
required by applicable law or agreed to in writing, 
software\ndistributed under the License is distributed on an 
\"AS IS\" BASIS,\nWITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
\nSee the License for the specific language governing permissions and\nlimitations under the License.\n\n
The drawing tool is a modification from code that was originally 
\ndeveloped by Gennadii Donchyts. \n\n*/\n\n

var theMap = ui.Map();
ui.root.clear();\n 
var ltgeeUI = require('users/emaprlab/public:Modules/LandTrendr-UI.js');  
var lcb = require('users/jstnbraaten/modules:ee-lcb.js'); 


nvar controlPanel = ui.Panel({
    style: {width: '350px', position: 'top-left'} //, backgroundColor: 'rgba(255, 255, 255, 0)'
});


var colYearsPanel = ltgeeUI.colYearsPanel();
var colDatesPanel = ltgeeUI.colDatesPanel();
// NOTE: let people pick seg index?   
var indexSelectPanel = ltgeeUI.indexSelectPanel();
var visSelectPanel = ltgeeUI.visSelectPanel();
visSelectPanel.widgets().get(0).setUrl('https://emaprlab.users.earthengine.app/view/landsat-8-rgb-band-combos');
var fpsPanel = ltgeeUI.fpsPanel();
Var drawPolygonPanel = ltgeeUI.drawPolygonPanel();\n
var drawPolygonBox = drawPolygonPanel.widgets().get(1);
var clearButton = ui.Button({label: 'Clear', style:{stretch: 'horizontal'}});
var clearButtonPanel = ui.Panel([clearButton], null, {shown: false});
var rerunButton = ui.Button({label: 'Rerun', style:{stretch: 'horizontal'}});
var rerunButtonPanel = ui.Panel([rerunButton], null, {shown: false});


var instructionsLabel= ui.Label('Instructions',{fontWeight: 'bold'});
var instructions= ui.Label(  \"This EE App will make an animated GIF from\\"+
\"a Landsat time series that has been smoothed\\"+  
\"by LandTrendr spectral-temporal segmentation.\\\"+  
\"1. Set the range of years to animate over\\"+  
\"2. Set the date range to composite over\\n\"+
  \"...note that date range can cross the new year\\"+
  \"3. Select an RGB/band display combination\\"+
  \"4. Set the desired animation frame rate\\"+
  \"5. Click 5 points to close a rectangle (go slow)\\"+
  \"...be patient after 5th click for feature to register\\"+
  \"6. Processing begins, wait a few minutes\\\"+
  \"- Use the 'Clear' button to start over\\"+
  \"- Change RGB combo and 'Rerun' on same region\\"+
  \"- If a video does not render, try making a\\"+
  \"...smaller region and/or zoom out a level\\"\n  , {whiteSpace:'pre'});



var instructionsPanel = ui.Panel([instructionsLabel,instructions]);


var url = ui.Label({  
  value: 'About LandTrendr',
});
url.setUrl('https://emapr.github.io/LT-GEE');


controlPanel.add(colYearsPanel);
controlPanel.add(colDatesPanel);
controlPanel.add(visSelectPanel);
controlPanel.add(fpsPanel);
controlPanel.add(rerunButtonPanel);
controlPanel.add(clearButtonPanel);
controlPanel.add(instructionsPanel);
controlPanel.add(url);


function getlims(geom){  
  var coords = ee.List(geom.coordinates().get(0));  
  var x = coords.map(function(pt){
    return  ee.List(pt).get(0);
  });
  
  var y = coords.map(function(pt){
    return  ee.List(pt).get(1);
  });
    return {
      xmin: ee.Number(x.reduce(ee.Reducer.min())),
      xmax: ee.Number(x.reduce(ee.Reducer.max())),
      ymin: ee.Number(y.reduce(ee.Reducer.min())),
      ymax: ee.Number(y.reduce(ee.Reducer.max()))
  };
}

var plotTheMap = function(){
  var colYrs = ltgeeUI.colYearsGet(colYearsPanel);
  var colDates = ltgeeUI.colDatesGet(colDatesPanel);
  var fps = ltgeeUI.fpsGet(fpsPanel);
  var visSelect = ltgeeUI.visSelectGet(visSelectPanel);
  lcb.setProps({
    startYear: colYrs.startYear,
    endYear: colYrs.endYear,
    startDate: colDates.startDate,
    endDate: colDates.endDate,
    sensors: ['LT05', 'LE07', 'LC08'],
    cfmask: ['cloud', 'shadow'],    //Peter C removed 'snow' from array
    harmonizeTo: 'LC08',
    aoi: finalGeom,[
    resample: 'bicubic'
  });
  var plan = function(year){
    var col = lcb.sr.gather(year)
    .map(lcb.sr.maskCFmask)
    .map(lcb.sr.harmonize)
    //.map(lcb.sr.resample);
    return lcb.sr.mosaicMedoid(col).select(['B2','B3','B4','B5','B6','B7']);
  };
  
  var years = ee.List.sequence(lcb.props.startYear, lcb.props.endYear);
  var annualSR = ee.ImageCollection.fromImages(years.map(plan));
  var ltCol;
  var visFun;
  var bnames;
  if(visSelect == 'TCB/TCG/TCW'){
    ltCol = annualSR.map(lcb.sr.addBandTC).select(['B6','TCB','TCG','TCW']);
    visFun = lcb.sr.visParams.visTC;
    bnames = ['TCB','TCG','TCW'];
  } else if(visSelect == 'SWIR1/NIR/RED'){
    ltCol = annualSR.select(['B6','B6','B5','B4'],['B6LT','B6','B5','B4']);
    visFun = lcb.sr.visParams.vis654;
    bnames = ['B6','B5','B4'];
  } else if(visSelect == 'NIR/RED/GREEN'){
    ltCol = annualSR.select(['B6','B5','B4','B3']);
    visFun = lcb.sr.visParams.vis543;
    bnames = ['B5','B4','B3'];
  } else if(visSelect == 'RED/GREEN/BLUE'){
    ltCol = annualSR.select(['B6','B4','B3','B2']);
    visFun = lcb.sr.visParams.vis432;
    bnames = ['B4','B3','B2'];
  } else if(visSelect == 'NIR/SWIR1/RED'){
    ltCol = annualSR.select(['B6','B6','B5','B4'],['B6LT','B6','B5','B4']);
    visFun = lcb.sr.visParams.vis564;
    bnames = ['B5','B6','B4'];
  }
  
  var ltParams = { 
    maxSegments: 10,
    spikeThreshold: 0.9,
    vertexCountOvershoot: 3,
    preventOneYearRecovery: true,
    recoveryThreshold: 0.75,
    pvalThreshold: 0.05,
    bestModelProportion: 0.75,
    minObservationsNeeded: 6,
    timeSeries: ltCol
  };
  
  var lt = ee.Algorithms.TemporalSegmentation.LandTrendr(ltParams);
  var yearsStr = years.map(function(year){
    return ee.String('yr_').cat(ee.Algorithms.String(year).slice(0,4));
  });
  
  var r = lt.select([bnames[0]+'_fit']).arrayFlatten([yearsStr]).toShort();
  var g = lt.select([bnames[1]+'_fit']).arrayFlatten([yearsStr]).toShort();
  var b = lt.select([bnames[2]+'_fit']).arrayFlatten([yearsStr]).toShort();
  var rgbList = yearsStr.map(function(year){
    return r.select([year]).addBands(g.select([year])).addBands(b.select([year])).rename(bnames);
  });
  
  var rgbColLT = ee.ImageCollection(rgbList.flatten()).map(function(img){return img.visualize(visFun)});
  var gifParams = {
    crs: 'EPSG:3857',
    framesPerSecond: parseInt(fps),
    region: lcb.props.aoi,
    dimensions: 350,
  };
  
  //print(rgbColLT.getVideoThumbURL(gifParams));
  var thumbLabel = ui.Label('Right-click on animation and select\\n\"Save image as...\" to download.\\n\\nIf the video does not render, try making a\\nsmaller region and/or zoom out a level.', {whiteSpace:'pre'});
  
  var thumbVid = ui.Thumbnail({image:rgbColLT, params:gifParams, style:{position:'top-center', padding:'0px'}});
  
  var gistLabel = ui.Label({
    value: 'Make it snazzy with this R Shiny app',
  });
  
  gistLabel.setUrl('https://jstnbraaten.shinyapps.io/snazzy-ee-ts-gif/');
  
  
  var geomLims = getlims(lcb.props.aoi);
  
  console.log(geomLims)
  
  //var bottomLen = ee.Geometry.LineString([[geomLims.xmin, geomLims.ymin],[geomLims.xmax, geomLims.ymin]]).length();
  
  
  var lon = ee.Number(lcb.props.aoi.centroid(ee.ErrorMargin(1)).coordinates().get(0)).multiply(100).round().divide(100).getInfo().toString();
  var lat = ee.Number(lcb.props.aoi.centroid(ee.ErrorMargin(1)).coordinates().get(1)).multiply(100).round().divide(100).getInfo().toString();
  
  
  //var lon = -137.62
  //var lat = 59.37
  //console.log(lon)
  //console.log(lat)
  
  var scaleString = ee.String('Width (km): ').cat(ee.Geometry.LineString([[geomLims.xmin, geomLims.ymin],[geomLims.xmax, geomLims.ymin]]).length().divide(1000).multiply(100).round().divide(100)).getInfo();
  
  var centroidString = '\\nCentroid (lon, lat): '+lon+', '+lat;
  
  var infoString = scaleString+centroidString;
  //var scaleLabel = ui.Label({
    //  value: ,
    //});
  //var centroidLabel = ui.Label({
    //  value: '\\nCentroid (lon, lat): '+lon+', '+lat,
    //});
  var infoLabel = ui.Label({
    value: infoString, style:{whiteSpace:'pre'}
  });
  
  var thumbPanel = ui.Panel([thumbLabel,infoLabel,thumbVid,gistLabel], null, {position:'top-right', padding:'0px'});
  theMap.add(thumbPanel);
  dirty = true;
  rerunButtonPanel.style().set('shown', true);
  clearButtonPanel.style().set('shown', true);
};
rerunButton.onClick(function(){
  theMap.remove(theMap.widgets().get(2));
  plotTheMap();
});

var dirty = false;
clearButton.onClick(function(){
  if(dirty === true){
    theMap.remove(theMap.widgets().get(2));
    theMap.remove(theMap.layers().get(0));
    rerunButtonPanel.style().set('shown', false);
    clearButtonPanel.style().set('shown', false);
    tool = new DrawAreaTool(theMap);
    tool.startDrawing();
    tool.onFinished(function(geometry) {
      drawPolygonBox.setValue(false, false);
      finalGeom = geometry;
      plotTheMap();
    });
  }
});


// https://code.earthengine.google.com/82b08b69bd596ada4747cb4bb7ea9526

var DrawAreaTool = function(map) {
  var drawingToolLayer = ui.Map.Layer({name: 'Area Selection Tool', visParams: {palette:'#4A8BF4', color:'#4A8BF4' }});
  
  this.map = map;
  this.selection = null;
  this.active = false;
  this.points = [];
  this.area = null;
  
  this.listeners = [];

var tool = this;

this.initialize = function() {
  this.map.onClick(this.onMouseClick);
  map.layers().set(1, drawingToolLayer);
};
this.startDrawing = function() {
  this.active = true;
  this.points = [];
  
  this.map.style().set('cursor', 'crosshair');
  drawingToolLayer.setShown(true);
};

this.stopDrawing = function() {
  tool.active = false;
  tool.map.style().set('cursor', 'hand');
    if(tool.points.length < 2) {
      return;
    }
var closedPoints = tool.points.slice(0,-1);
tool.area = ee.Geometry.Polygon(closedPoints).bounds();
var empty = ee.Image().byte();
var test = empty.paint({
  featureCollection: ee.FeatureCollection(tool.area),
  color: 1,
  width: 4
});
  drawingToolLayer.setEeObject(test);
  tool.listeners.map(function(listener) {
    listener(tool.area);
  });
};
this.onMouseClick = function(coords) {
  if(!tool.active) {
    return;
  }
tool.points.push([coords.lon, coords.lat]);


var geom = tool.points.length > 1 ? ee.Geometry.LineString(tool.points) : ee.Geometry.Point(tool.points[0]);
drawingToolLayer.setEeObject(geom);
//var l = ee.Geometry.LineString([tool.points[0], tool.points[tool.points.length-1]]).length(1).getInfo();
//print('l/scale: '+(l / theMap.getScale()).toString());
//if(tool.points.length > 2 && l / theMap.getScale() < 5) {
  //  tool.stopDrawing();
  //}
if(tool.points.length > 4) {
  tool.stopDrawing();
}
};
this.onFinished = function(listener) {
  tool.listeners.push(listener);
};
this.initialize();
};

var tool = new DrawAreaTool(theMap);

var finalGeom;
tool.onFinished(function(geometry) {
  drawPolygonBox.setValue(false, false);
  finalGeom = geometry;
  plotTheMap();
});
tool.startDrawing();

drawPolygonBox.onChange(function(checked) {
  if(checked) {
    tool.startDrawing();
  } else {
    tool.stopDrawing();
  }
});

theMap.setOptions('HYBRID');
Map.setControlVisibility(null, null, false, false, false);

ui.root.add(controlPanel);
ui.root.add(theMap);



var emaprLabel = ui.Label({
  value: 'More info',
  style: {position:'bottom-right'}
});
emaprLabel.setUrl('https://jdbcode.github.io/Snazzy-EE-TS-GIF/');
theMap.add(emaprLabel);


var zoomLevel = ui.Label({
  value: 'Zoom level: 4',
  style: {position:'top-left', color:'red'}
});
theMap.add(zoomLevel);

theMap.onChangeZoom(function(z,b){
  print(z)
  zoomLevel.setValue('Zoom level: '+z);
  if(z > 10 & z < 15){
    zoomLevel.style().set('color', '#4A8BF4');\n  } else{
      zoomLevel.style().set('color', 'red');
    }
  });
  //","users/emaprlab/public:Modules/LandTrendr-UI.js":"
  

  // #######################################################################################
  // ###### UI STUFF #######################################################################
  // #######################################################################################
  
  
  // LT PARAMS
  
exports.paramPanel = function(){
  var runParams = [
    {label: 'Max Segments:', value: 6},
    {label: 'Spike Threshold:', value: 0.9},
    {label: 'Vertex Count Overshoot:', value: 3},
    {label: 'Prevent One Year Recovery:', value: true},
    {label: 'Recovery Threshold:', value: 0.25},
    {label: 'p-value Threshold:', value: 0.05},
    {label: 'Best Model Proportion:', value: 0.75},
    {label: 'Min Observations Needed:', value: 6},
  ];
  
  var paramBoxes = [];
  var paramPanels = [ui.Label('Define Segmentation Parameters',{fontWeight: 'bold'})];
  
  runParams.forEach(function(param, index){
    var paramLabel = ui.Label(param.label);
    var paramBox = ui.Textbox({value:param.value});
    paramBox.style().set('stretch', 'horizontal');
    var paramPanel = ui.Panel([paramLabel,paramBox], ui.Panel.Layout.Flow('horizontal'));
    paramBoxes.push(paramBox);
    paramPanels.push(paramPanel);
  });
  return ui.Panel(paramPanels, null, {stretch: 'horizontal'});
};

exports.getParams = function(paramPanel){
  var prevOneYrRec = paramPanel.widgets().get(4).widgets().get(1).getValue();
  
  prevOneYrRec = makeBoolean(prevOneYrRec);
  //if(typeof(prevOneYrRec) !== \"boolean\"){
    //  prevOneYrRec = prevOneYrRec.toLowerCase() != 'false';
    //}
  return {
    maxSegments: 
    parseInt(paramPanel.widgets().get(1).widgets().get(1).getValue()),
    spikeThreshold: 
    parseFloat(paramPanel.widgets().get(2).widgets().get(1).getValue()),
    vertexCountOvershoot: 
    parseInt(paramPanel.widgets().get(3).widgets().get(1).getValue()),
    preventOneYearRecovery:
    prevOneYrRec,
    recoveryThreshold:      
    parseFloat(paramPanel.widgets().get(5).widgets().get(1).getValue()),
    pvalThreshold:          
    parseFloat(paramPanel.widgets().get(6).widgets().get(1).getValue()),
    bestModelProportion:    
    parseFloat(paramPanel.widgets().get(7).widgets().get(1).getValue()),
    minObservationsNeeded:    
    parseInt(paramPanel.widgets().get(8).widgets().get(1).getValue())
  };
};



// SINGLE INDEX PANEL
exports.indexSelectPanel = function(){
  var indexLabel = ui.Label('Select Index',{fontWeight: 'bold'});
  var indexList = ['NBR','NDVI','EVI','NDSI','NDMI','TCB','TCG','TCW','B1','B2','B3','B4','B5','B7','NBRz','Band5z','ENC'];
  var indexSelect = ui.Select({items:indexList, value:'NBR', style:{stretch: 'horizontal'}});
    return ui.Panel([indexLabel,indexSelect], null, {stretch: 'horizontal'});
  };

exports.indexSelectGet = function(indexSelectPanel){
  return indexSelectPanel.widgets().get(1).getValue();
};



// SINGLE VIS PANEL
exports.visSelectPanel = function(){
  var indexLabel = ui.Label('Select RGB Combo',{fontWeight: 'bold'});
  var indexList = ['TCB/TCG/TCW','SWIR1/NIR/RED','NIR/RED/GREEN','RED/GREEN/BLUE','NIR/SWIR1/RED'];
  var indexSelect = ui.Select({items:indexList, value:'SWIR1/NIR/RED', style:{stretch: 'horizontal'}});
    return ui.Panel([indexLabel,indexSelect], null, {stretch: 'horizontal'});
  };

exports.visSelectGet = function(indexSelectPanel){
  return indexSelectPanel.widgets().get(1).getValue();
};



// MULTI-INDEX PANEL

exports.indexSelectPanelTS = function(){
  var indexListTS = [['NBR',-1], ['NDVI',-1], ['EVI',-1], ['NDMI',-1], ['TCB',1], ['TCG',-1],
  ['TCW',-1], ['TCA' ,-1], ['B1' ,1], ['B2' , 1],
  ['B3' , 1], ['B4'  ,-1], ['B5'  , 1], ['B7' ,1], ['NBRz',1],['B5z',1],['ENC', 1]];
  var indexBoxes = [];
  indexListTS.forEach(function(name, index) {
    var checkBox = ui.Checkbox(name[0]);
    indexBoxes.push(checkBox);
  });
  /*  
  var indexLabel = ui.Label('Select Indices', {fontWeight : 'bold'});
  var indexPanel = ui.Panel(
    [
      ui.Panel([indexBoxes[0], indexBoxes[4], indexBoxes[8], indexBoxes[12]], null, {stretch: 'horizontal'}),
      ui.Panel([indexBoxes[1], indexBoxes[5], indexBoxes[9], indexBoxes[13]], null, {stretch: 'horizontal'}),
      ui.Panel([indexBoxes[2], indexBoxes[6], indexBoxes[10]], null, {stretch: 'horizontal'}),
      ui.Panel([indexBoxes[3], indexBoxes[7], indexBoxes[11]], null, {stretch: 'horizontal'})
    ],
    ui.Panel.Layout.Flow('horizontal'), {stretch: 'horizontal'}
    );
    
    indexBox[0].setValue(1)
    return {panel:ui.Panel([indexLabel,indexPanel], null, {stretch: 'horizontal'}), indexBoxes:indexBox};
    */
  return {ui:indexBoxes, list:indexListTS};
};






// MASK PANEL
exports.maskSelectPanel = function(){
  var maskLabel = ui.Label('Define Mask Elements',{fontWeight: 'bold'});
  var maskPanel = ui.Panel([
    ui.Panel([ui.Checkbox({label:'Clouds', value:1}),ui.Checkbox({label:'Shadows', value:1})],ui.Panel.Layout.Flow('horizontal'), {stretch: 'horizontal'}),
    ui.Panel([ui.Checkbox({label:'Snow', value:1}),ui.Checkbox({label:'Water', value:1})],ui.Panel.Layout.Flow('horizontal'), {stretch: 'horizontal'})
  ]);
  return ui.Panel([maskLabel, maskPanel]);
};

exports.getMaskSelect = function(maskSelectPanel){
  var selectionBoo = [
    maskSelectPanel.widgets().get(1).widgets().get(0).widgets().get(0).getValue(),
    maskSelectPanel.widgets().get(1).widgets().get(0).widgets().get(1).getValue(),
    maskSelectPanel.widgets().get(1).widgets().get(1).widgets().get(0).getValue(),
    maskSelectPanel.widgets().get(1).widgets().get(1).widgets().get(1).getValue(),
  ];

  var selection = [];
  if(selectionBoo[0] === true){selection.push('cloud')}
  if(selectionBoo[1] === true){selection.push('shadow')}
  if(selectionBoo[2] === true){selection.push('snow')}
  if(selectionBoo[3] === true){selection.push('water')}
  
  
  return selection;
};




// YEAR PANEL

exports.colYearsPanel = function(){
  var d = new Date();
  var y = d.getFullYear();
  
  var yearSectionLabel = ui.Label('Define Year Range',{fontWeight: 'bold'});
  var startYearLabel = ui.Label('Start Year:');
  var startYearslider = ui.Slider({min:1984, max:y, value:1984, step:1});
  startYearslider.style().set('stretch', 'horizontal');
  
  var endYearLabel = ui.Label('End Year:');
  var endYearslider = ui.Slider({min:1984, max:y, value:y-1, step:1});
  endYearslider.style().set('stretch', 'horizontal');
    return ui.Panel(
      [
        yearSectionLabel,
        ui.Panel([startYearLabel, startYearslider], ui.Panel.Layout.Flow('horizontal'), {stretch: 'horizontal'}), //
        ui.Panel([endYearLabel  , endYearslider], ui.Panel.Layout.Flow('horizontal'), {stretch: 'horizontal'})
      ]
      );
    };
    
exports.colYearsGet = function(colYearsPanel){
  return {
    startYear:colYearsPanel.widgets().get(1).widgets().get(1).getValue(),
    endYear:colYearsPanel.widgets().get(2).widgets().get(1).getValue()
  };
};



// FRAMES PER SECOND
exports.fpsPanel = function(){
  var fpsSectionLabel = ui.Label('Define Frames Per Second',{fontWeight: 'bold'});
  var fpsSlider = ui.Slider({min:1, max:30, value:5, step:1});
  fpsSlider.style().set('stretch', 'horizontal');
    return ui.Panel(
      [
        fpsSectionLabel,
        ui.Panel([fpsSlider], ui.Panel.Layout.Flow('horizontal'), {stretch: 'horizontal'})
      ]
      );
    };
    

exports.fpsGet = function(fpsPanel){
  return fpsPanel.widgets().get(1).widgets().get(0).getValue();
};






// DATE PANEL
exports.colDatesPanel = function(){
  var dateSectionLabel = ui.Label('Define Date Range (month-day)',{fontWeight: 'bold'});
  var startDayLabel = ui.Label('Start Date:');\n  var startDayBox = ui.Textbox({value:'06-10'});
  startDayBox.style().set('stretch', 'horizontal');
  
  
  var endDayLabel = ui.Label('End Date:');
  var endDayBox = ui.Textbox({value:'09-20'});
  endDayBox.style().set('stretch', 'horizontal');
    return ui.Panel(
      [
        dateSectionLabel,
        ui.Panel(
          [startDayLabel, startDayBox, endDayLabel, endDayBox],
        ui.Panel.Layout.Flow('horizontal'), {stretch: 'horizontal'}
        )
      ]
      );
    };
  
  exports.colDatesGet = function(colDatesPanel){
    return {
      startDate:colDatesPanel.widgets().get(1).widgets().get(1).getValue(),
      endDate:colDatesPanel.widgets().get(1).widgets().get(3).getValue()
    };[
    ]};
    
    
    
    // RGB YEAR PANEL
    
    exports.rgbYearsPanel = function(){
      var d = new Date();\n  var y = d.getFullYear();
      
      var rgbSectionLabel = ui.Label('Define Years for Red, Green, Blue',{fontWeight: 'bold'});
      
      var redYearLabel = ui.Label('Red Year:');
      var redYearslider = ui.Slider({min:1984, max:y, value:1985, step:1, style:{stretch: 'horizontal'}});
      
      var greenYearLabel = ui.Label('Green Year:');
      var greenYearslider = ui.Slider({min:1984, max:y, value:2000, step:1, style:{stretch: 'horizontal'}});
      
      var blueYearLabel = ui.Label('Blue Year:');
      var blueYearslider = ui.Slider({min:1984, max:y, value:2015, step:1, style:{stretch: 'horizontal'}});
      
      var rgbYearsPanel = ui.Panel([
        rgbSectionLabel,
          ui.Panel([redYearLabel, redYearslider], ui.Panel.Layout.Flow('horizontal'), {stretch: 'horizontal'}),
          ui.Panel([greenYearLabel, greenYearslider], ui.Panel.Layout.Flow('horizontal'), {stretch: 'horizontal'}),
          ui.Panel([blueYearLabel, blueYearslider], ui.Panel.Layout.Flow('horizontal'), {stretch: 'horizontal'})
        ]
        );
          return rgbYearsPanel;
        };
    
    exports.rgbYearsGet = function(rgbYearsPanel){
      return {
        red: rgbYearsPanel.widgets().get(1).widgets().get(1).getValue(),
        green: rgbYearsPanel.widgets().get(2).widgets().get(1).getValue(),
        blue: rgbYearsPanel.widgets().get(3).widgets().get(1).getValue(),
      };
    };
  
  
  
    // YEAR PANEL - SIDE-BY-SIDE
  exports.twoYearPanel = function(){
    var d = new Date();
    var y = d.getFullYear().toString();
    
    
    var twoYearSectionLabel = ui.Label('Define Left & Right Map Years',{fontWeight: 'bold'});
    var leftYearLabel = ui.Label('Left:');
    var leftYearBox = ui.Textbox({value:'1984'});
    leftYearBox.style().set('stretch', 'horizontal');
    var rightYearLabel = ui.Label('Right:');
    var rightYearBox = ui.Textbox({value:y});
    rightYearBox.style().set('stretch', 'horizontal');
    return ui.Panel(
      [
        twoYearSectionLabel,
        ui.Panel(
          [leftYearLabel, leftYearBox, rightYearLabel, rightYearBox],
          ui.Panel.Layout.Flow('horizontal'), {stretch: 'horizontal'}
          )
        ]
        );
      };
      
  exports.twoYearGet = function(twoYearPanel){
    return {
      leftYear:twoYearPanel.widgets().get(1).widgets().get(1).getValue(),
      rightYear:twoYearPanel.widgets().get(1).widgets().get(3).getValue()
    };
  };
  
  
  
  // COORDINATE PANEL
  
  exports.coordsPanel = function(){
    var coordSectionLabel = ui.Label('Define Pixel Coordinates (optional)',{fontWeight: 'bold'});
    
    var latLabel = ui.Label('Latitude:');
    var latBox = ui.Textbox({value:43.7929});
    latBox.style().set('stretch', 'horizontal');
    
    var lonLabel = ui.Label('Longitude:');
    var lonBox = ui.Textbox({value:-122.8848});
    lonBox.style().set('stretch', 'horizontal');
      return ui.Panel(
        [
          coordSectionLabel,
            ui.Panel([lonLabel, lonBox, latLabel, latBox],
            ui.Panel.Layout.Flow('horizontal'))
          ],
          null,
          {stretch: 'horizontal'}
          );
        };


exports.coordsGet = function(coordsPanel){
  return {
    lon:parseFloat(coordsPanel.widgets().get(1).widgets().get(1).getValue()),
    lat:parseFloat(coordsPanel.widgets().get(1).widgets().get(3).getValue())
  };
};



// BUFFER PANEL

exports.bufferPanel = function(userProps){
  var panelLabel = userProps.panelLabel || 'Define a Buffer Around Point (km)';
  var varLabel = userProps.varLabel || 'Buffer:';
  var defVar = userProps.defVar || 50;
  var bufferSectionLabel = ui.Label(panelLabel,{fontWeight: 'bold'});
  var bufferBoxLabel = ui.Label(varLabel);
  var bufferBox = ui.Textbox({value: defVar, style:{stretch: 'horizontal'}});
  return ui.Panel(
    [
      bufferSectionLabel,
      ui.Panel([bufferBoxLabel,bufferBox], ui.Panel.Layout.Flow('horizontal'), {stretch: 'horizontal'})
    ]
    );
  };
  

exports.getBuffer = function(bufferPanel){
  return parseInt(bufferPanel.widgets().get(1).widgets().get(1).getValue());
};


// REGION DRAWING CHECKBOX

exports.drawPolygonPanel = function(){
  var checkLabel = ui.Label('Draw Region', {fontWeight: 'bold'});
  var checkbox = ui.Checkbox({label: 'Draw'});
  return ui.Panel([checkLabel, checkbox], ui.Panel.Layout.Flow('vertical'), {stretch: 'horizontal'});
};


// SUBMIT BUTTON

exports.submitButton = function(){
  return ui.Button({label: 'Submit', style:{stretch: 'horizontal'}});
};





// HELPERS
var makeBoolean = function(value){
  if(typeof(value) !== \"boolean\"){
    value = value.toLowerCase() != 'false';
  }
    return value;
  };","users/jstnbraaten/modules:ee-lcb.js":"
  /*
  Copyright 2019 Justin Braaten\n\nLicensed under the Apache License, Version 2.0 (the \"License\");\nyou may not use this file except in compliance with the License.\nYou may obtain a copy of the License at\n\n    http://www.apache.org/licenses/LICENSE-2.0\n\nUnless required by applicable law or agreed to in writing, software\ndistributed under the License is distributed on an \"AS IS\" BASIS,\nWITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.\nSee the License for the specific language governing permissions and\nlimitations under the License.\n\n\n> User guide: https://jdbcode.github.io/EE-LCB/\n> Add repo to EE JS IDE - visit: https://code.earthengine.google.com/?accept_repo=users/jstnbraaten/modules\n> Add repo to git - run: git clone https://earthengine.googlesource.com/users/jstnbraaten/modules\n\n
  */
 
  
  
  // slope and intercept citation: Roy, D.P., Kovalskyy, V., Zhang, H.K., Vermote, E.F., Yan, L., Kumar, S.S, Egorov, A., 2016, Characterization of Landsat-7 to Landsat-8 reflective wavelength and normalized difference vegetation index continuity, Remote Sensing of Environment, 185, 57-70.(http://dx.doi.org/10.1016/j.rse.2015.12.024); Table 2 - reduced major axis (RMA) regression coefficient
  
  var harmonizeLine = {
    oliTmTMA: {
      itcps: ee.Image.constant([-0.0095, -0.0016, -0.0022, -0.0021, -0.0030, 0.0029]).multiply(10000),
      slopes: ee.Image.constant([0.9785, 0.9542, 0.9825, 1.0073, 1.0171, 0.9949])
    }
  };

function oli2tm(oli) {
  return oli.select(['B2','B3','B4','B5','B6','B7'])
  .subtract(harmonizeLine.oliTmTMA.itcps)
  .divide(harmonizeLine.oliTmTMA.slopes);
}

function tm2oli(tm) {
  return tm.select(['B2','B3','B4','B5','B6','B7'])
  .multiply(harmonizeLine.oliTmTMA.slopes)
  .add(harmonizeLine.oliTmTMA.itcps);
}

function harmonize(img){
  img = sr_standardizeBands(img);
  var isLC08 = ee.Algorithms.IsEqual(img.get('SATELLITE'), ee.String('LANDSAT_8'));
  
  var dat = ee.Image(ee.Algorithms.If(
    props.harmonizeTo == 'LC08',
    ee.Algorithms.If(
      isLC08,
      img.select(['B2','B3','B4','B5','B6','B7']),
      tm2oli(img)
      ),
    ee.Algorithms.If(
      isLC08,
      oli2tm(img),
      img.select(['B2','B3','B4','B5','B6','B7'])
      )
      )).copyProperties(img)
      .set({'system:time_start': img.get('system:time_start'),
      'system:index': img.get('system:index'),
      'harmonized_to': props.harmonizeTo
    });
    return ee.Image(dat).addBands(img.select('pixel_qa')).toShort(); // adding pixel_qa here so that it does not get resampled by bicubic or bilinear - tested this and it is working - if pixel_qa is selected with the other bands and resampled it is junk?
  }
  
  // #######################################################################################
  // ###### MASKING ########################################################################
  // #######################################################################################
  
  
  function maskCFmask(img){
    if(props.cfmask.length !== 0){
      var mask = ee.Image(1);
      var qa = img.select('pixel_qa');
      if(props.cfmask.indexOf('water') != -1){mask = qa.bitwiseAnd(4).eq(0).multiply(mask)}
      if(props.cfmask.indexOf('shadow') != -1){mask = qa.bitwiseAnd(8).eq(0).multiply(mask)}
      if(props.cfmask.indexOf('snow') != -1){mask = qa.bitwiseAnd(16).eq(0).multiply(mask)}
      if(props.cfmask.indexOf('cloud') != -1){mask = qa.bitwiseAnd(32).eq(0).multiply(mask)}
      return img.updateMask(mask);  // TODO - do we need to mask img margins that do not have all bands?
    } else{
      return img;
    }
  }
  
  
  
  // maskAux1 helper
  
  function getDifFromNorm(img, band, norm, stdev){
    return img.select(band).subtract(norm).divide(stdev);
  }
  
  function maskAux1(img){
    // assumes that images are landsat 8 bands - should check - and do so or warn
    
    var swir1Norm = ee.Image(props.maskAux1.swir1NormPath),
    blueNorm = ee.Image(props.maskAux1.blueNormPath),
    swir1Stdev = ee.Image(props.maskAux1.swir1StdevPath).divide(10),
    blueStdev = ee.Image(props.maskAux1.blueStdevPath).divide(10);
    
    
    // if not harmonized it should be - check metadata to see, if not, then do so - need to default the norm and stdev maker to harmonize
    
    // should images have fmask applied already? don't want to force it to - this should be independent
    
    // get dif from norm relative to stdev
    
    var maskSwir1 = getDifFromNorm(img, 'B6', swir1Norm, swir1Stdev).lt(props.maskAux1.swir1DifLimit)
      .and(img.select('B6')
      .lt(props.maskAux1.swir1ReflLimit))
      .not();
      
    var maskBlue = getDifFromNorm(img, 'B2', blueNorm, blueStdev).gt(props.maskAux1.blueDifLimit).and(img.select('B2')
    .gt(props.maskAux1.blueReflLimit))
    .not();
    

    // combine the masks
    var auxMask = maskSwir1.multiply(maskBlue).unmask(0);
    return img.updateMask(auxMask);
  }
  
  function maskBuffer(img){
    var mask = img.select(0).mask().not();
    var kernel = ee.Kernel.circle({radius:props.maskBuffer, units:'meters', normalize:false, magnitude:1});
    var convolvedMask = mask.convolve(kernel).not();
    return img.updateMask(convolvedMask);
  }
  
  
  // #######################################################################################
  // ###### COLLECTION ASSEMBLY ############################################################
  // #######################################################################################
  
  function getDOY(img){
    return ee.Number(ee.Date(ee.Image(img).get('system:time_start')).getRelative('day', 'year'));
  }
  
  function getNumericMonthDay(date){
    var month = parseInt(date.slice(0, 2));
    var day = parseInt(date.slice(3, 5));
    return {month:month, day:day};
  }
  
  
  function sr_resample(img){
    var refl = img.select(['B[0-9]*']);
    var qa = img.select(['[^B]*']);
    var resamp = refl.resample(props.resample);
    return resamp.addBands(qa);
  }
  
  function filterCollectionByDate(year){
    var start = ee.Date.fromYMD(year, props.startDateInt.month, props.startDateInt.day);
    start = ee.Algorithms.If(props.interYear, start.advance(-1,'year'), start);
    var end = ee.Date.fromYMD(year, props.endDateInt.month, props.endDateInt.day);
    var col = ee.ImageCollection(props.ltCol) // TODO: does this need to be cast as an ee.ImageCollection
    .filterBounds(props.aoi)
    .filterDate(start, end)
    .map(function(img){
      return img.set({'composite_year':year,
      'sensing_year':ee.Number.parse(ee.Date(img.get('system:time_start')).format('yyyy')),
      'filler':'no'
    });
  });
    return col.toList(col.size().add(1));  // NOTE: need to add 1 in case the col is empty - can't have 0 as arg to toList
  }
  
  function sr_standardizeBands(img){
    return ee.Image(ee.Algorithms.If(
      ee.Algorithms.IsEqual(img.get('bands'), ee.String('standardized')),
      img,
      ee.Image(ee.Algorithms.If(
        ee.Algorithms.IsEqual(img.get('SATELLITE'), ee.String('LANDSAT_8')),
        img.select(['B2','B3','B4','B5','B6','B7','pixel_qa']),
        img.select(['B1', 'B2', 'B3', 'B4', 'B5', 'B7','pixel_qa'], ['B2','B3','B4','B5','B6','B7','pixel_qa'])
        ))
        .set({'bands':'standardized', 'band_names':'LC08'})
        )
        );
      }
  function sr_initBandMetadata(img){
    var isL8 = ee.Algorithms.If(
      ee.Algorithms.IsEqual(img.get('SATELLITE'), ee.String('LANDSAT_8')),
      'LC08',
      '!LC08'
      );
      return img.set({
        'bands':'original',
        'band_names':isL8,
        'harmonized_to': 'null',
        'topo_correction': 'null',
        'doy': getDOY(img)
      });
    }
  
  function fillCol457(year){
    var bnames = [\"B1\",\"B2\",\"B3\",\"B4\",\"B5\",\"B6\",\"B7\",\"sr_atmos_opacity\",\"sr_cloud_qa\",\"pixel_qa\",\"radsat_qa\"];
    var imgProps = {
      'composite_year':year,
      'SATELLITE':'!LC08',
      'system:time_start':ee.Date.fromYMD(year, 1, 1).millis(),
      'filler':'yes'
    };
    var img = ee.Image([0,0,0,0,0,0,0,0,0,0,0]).rename(bnames).mask(ee.Image(0)).set(imgProps);
    return ee.ImageCollection(img);
  }
  
  function fillCol8(year){
    var bnames = [\"B1\",\"B2\",\"B3\",\"B4\",\"B5\",\"B6\",\"B7\",\"B10\",\"B11\",\"sr_aerosol\",\"pixel_qa\",\"radsat_qa\"];
    var imgProps = {
      'composite_year':year,
      'SATELLITE':'LC08',
      'system:time_start':ee.Date.fromYMD(year, 1, 1).millis(),
      'filler':'yes'
    };
    var img = ee.Image([0,0,0,0,0,0,0,0,0,0,0,0]).rename(bnames).mask(ee.Image(0)).set(imgProps);
    return ee.ImageCollection(img);
  }
  
  function sr_gather(year) {
    var years = ee.List.sequence(props.startYear, props.endYear);
    var checkEmpty = false;
    if(typeof year !== 'undefined'){
      years = ee.List([year]);
      checkEmpty = true;
    } else {
      year = 2000; // NOTE: this is weird - need a dummy here - the if below evaluates it, but does not actually use it\n  }
      
      
      var imgList = ee.List([]);
      var l5 = false;
      var l7 = false;
      var l8 = false;
      
      if(props.sensors.indexOf('LT05') != -1){
        l5 = true;
        props.ltCol = 'LANDSAT/LT05/C01/T1_SR';
        imgList = imgList.cat(years.map(filterCollectionByDate));
      }
      if(props.sensors.indexOf('LE07') != -1){
        l7 = true;
        props.ltCol = 'LANDSAT/LE07/C01/T1_SR';
        imgList = imgList.cat(years.map(filterCollectionByDate));
      }
      if(props.sensors.indexOf('LC08') != -1){
        l8 = true;
        props.ltCol = 'LANDSAT/LC08/C01/T1_SR';
        imgList = imgList.cat(years.map(filterCollectionByDate));
      }
    var col = ee.ImageCollection(imgList.flatten());
    var l57 = (l5 === true || l7 === true);
    col = ee.ImageCollection(ee.Algorithms.If(checkEmpty,
      ee.Algorithms.If(col.size().eq(0),
      ee.Algorithms.If(l57, fillCol457(year), fillCol8(year)),
      col
      ),
      col
      ));
      /* 
      if(checkEmpty){
        ee.Algorithms.If(col.size().eq(0)
        )
        if(col.size().getInfo() === 0){
          if(l5 === true || l7 === true){
            col = fillCol457(year);
          } else if(l8 === true){
            col = fillCol8(year);
          }
        }
      }
      */
     
     col = col.map(sr_initBandMetadata);
     if((l5 === true || l7 === true) && l8 === true){
      col = col.map(sr_standardizeBands);
    }
      return col;
    }
    
  function removeSLCoff(col){
    return col.filter(ee.Filter.and(ee.Filter.eq('SATELLITE', 'LANDSAT_7'), ee.Filter.gt('SENSING_TIME', '2003-06-01T00:00')).not());
  }
  
  function removeImage(id, col){
    return ee.ImageCollection(col).filter(ee.Filter.neq('system:index', ee.String(id)));
  }
  
  function removeImageList(col){\n  var excludeList = ee.List(props.exclude);
    return ee.ImageCollection(ee.List(props.exclude).iterate(removeImage, col));
  }

  function removeImageFiller(col){
    return col.filter(ee.Filter.eq('filler', 'no'));
  }
  
  // #######################################################################################
  // ###### QUALITY ASSESSMENT #############################################################
  
  // #######################################################################################
  
  function countValid(col){
    return col.select([0]).count().rename(['n_valid_pixels']);\n}\n\nfunction getFilmstrip(col){
    print('Filmstrip Thumb URL (click):');
      print(col.getFilmstripThumbURL({
        dimensions: 500,
        region: props.aoi,
        format:'png'
      }));
    }
    
// #######################################################################################
// ###### IN PROGRESS ####################################################################
// #######################################################################################

function maskOutliers(collection, band, outlierThresh){
  var col = collection.select(band);
  var colMean = col.reduce(ee.Reducer.mean());
  var colStdDev = ee.Algorithms.If(
    outlierThresh == 1,
    col.reduce(ee.Reducer.stdDev()),
    col.reduce(ee.Reducer.stdDev()).multiply(outlierThresh)
    );
  var plus = colMean.add(colStdDev);
  var minus = colMean.subtract(colStdDev);
  
  var colMeanTrim = col.map(function(img){
    var mask = img.gt(minus).and(img.lt(plus));
    return img.updateMask(mask);
  });
  return colMeanTrim;
}

// #######################################################################################
// ###### VISUALIZATION ##################################################################
// #######################################################################################
// ------ helpers ------
function setVisMetadata(img){
  // TODO: check if we can just call copyprops for non-system props
  return {
    'composite_year':img.get('composite_year'),
    'filler':img.get('filler'),
    'harmonized_to':img.get('harmonized_to'),
    'topo_correction':img.get('topo_correction'),
    'system:index':img.get('system:index'),
    'system:time_start':img.get('system:time_start'),
    //'system:annotations':['test',10,10]\n  };
  }
  // ---------------------
  // TODO: make sure we like the stretch of these
  
  function sr_visualize764(img){
    img = getLC08bands(img);
    return img.visualize({
      bands: ['B7', 'B6', 'B4'],
      min: [0, 100, 0],
      max: [3696, 4500, 2500],
      gamma: [1, 1, 1]
    }).set(setVisMetadata(img));
  }
  
  function sr_visualize754(img){
    img = getLC08bands(img);
    return img.visualize({
      bands: ['B7', 'B5', 'B4'],
      min: [-904, 151, -300],
      max: [3696, 4951, 2500],
      gamma: [1, 1, 1]
    }).set(setVisMetadata(img));
  }
  
  function sr_visualize654(img){
    img = getLC08bands(img);
    return img.visualize({
      bands: ['B6', 'B5', 'B4'],
      min: [100,151,0],
      max: [4500,4951,2500],
      gamma: [1, 1, 1]
    }).set(setVisMetadata(img));
  }
  
  function sr_visualize543(img){
    img = getLC08bands(img);
    return img.visualize({
      bands: ['B5', 'B4', 'B3'],
      min: [151, 0, 50],
      max: [4951, 2500, 2500],
      gamma: [1, 1, 1]
    }).set(setVisMetadata(img));
  }
  
  function sr_visualize432(img){
    img = getLC08bands(img);
    return img.visualize({
      bands: ['B4', 'B3', 'B2'],
      min: [0, 50, 50],
      max: [2500, 2500, 2500],
      gamma: [1, 1, 1]
    }).set(setVisMetadata(img));
  }
  
  function sr_visualize564(img){
    img = getLC08bands(img);
    return img.visualize({
      bands: ['B5', 'B6', 'B4'],
      min: [151, 100, 0],
      max: [4951, 4500, 2500],
      gamma: [1, 1, 1]
    }).set(setVisMetadata(img));
  }
  
  
  function sr_visualizeTC(img){
    return img.visualize({
      bands: ['TCB', 'TCG', 'TCW'],
      min: [604, -49, -2245],
      max: [5592, 3147, 843],
      gamma: [1, 1, 1]\n  }).set(setVisMetadata(img));
    }
    
    var sr_visParams = {
      visTC:{
        bands: ['TCB', 'TCG', 'TCW'],
        min: [604, -49, -2245],
        max: [5592, 3147, 843],
        gamma: [1, 1, 1]\n  },
        vis764:{
          bands: ['B7', 'B6', 'B4'],
          min: [0, 100, 0],
          max: [3696, 4500, 2500],
          gamma: [1, 1, 1]
        },
        vis754:{
          bands: ['B7', 'B5', 'B4'],
          min: [0, 151, 0],
          max: [3696, 4951, 2500],
          gamma: [1, 1, 1]\n  },
          vis654:{
            bands: ['B6', 'B5', 'B4'],
            min: [100,151,0],
            max: [4500,4951,2500],
            gamma: [1, 1, 1]
          },
          vis543:{
            bands: ['B5', 'B4', 'B3'],
            min: [151, 0, 50],
            max: [4951, 2500, 2500],
            gamma: [1, 1, 1]
          },
          vis432:{
            bands: ['B4', 'B3', 'B2'],
            min: [0, 50, 50],
            max: [2500, 2500, 2500],
            gamma: [1.4, 1.4, 1.4]
          },
          vis564:{
            bands: ['B5', 'B6', 'B4'],
            min: [151, 100, 0],
            max: [4951, 4500, 2500],
            gamma: [1, 1, 1]
          }
        };
      
      
// #######################################################################################
// ###### MOSAIC #########################################################################
// #######################################################################################

// ------ helpers ------
function sr_removeBandCFmask(img){ // TODO: add this to the exports - possibly make it remove all qa bands
  return img.select(img.bandNames().filter(ee.Filter.neq('item', 'pixel_qa')));
}

function setMosaicMetadata(img){
  var yearString = ee.Algorithms.String(img.get('composite_year')).slice(0,4);
  var yearInt = ee.Number.parse(yearString);
  return {
    'filler': img.get('filler'),
    'band_names': img.get('band_names'),
    'composite_year': yearInt,
    'harmonized_to': img.get('harmonized_to'),
    'system:index': yearString,
    'system:time_start': ee.Date.fromYMD(yearInt, props.compDateInt.month, props.compDateInt.day).millis()
  };
}

function setdistinctPath(img){
  var path = ee.String('000').cat(ee.String(ee.Number(img.get('WRS_PATH')).toShort())).slice(-3);
  var ymd = ee.Date(img.get('system:time_start')).format('YYYYMMdd');
  var distPath = path.cat(ee.String('_').cat(ymd));
  return ee.Image(img.set({'distinct_path': distPath}));
}

function getMediod(col){
  var median = col.median();
  var difFromMedian = col.map(function(img) {
    var dif = ee.Image(img).subtract(median).pow(ee.Image.constant(2));
    return dif.reduce(ee.Reducer.sum()).addBands(img).copyProperties(img, ['system:time_start']);
  }).map(function(img) {
    var doy = ee.Date(ee.Image(img).get('system:time_start')).getRelative('day', 'year');
    var doyImg = ee.Image(doy).rename('DOY').toShort();
    return img.addBands(doyImg);
  });
  var bandNames = difFromMedian.first().bandNames();
  var len = bandNames.length();
  var bandsPos = ee.List.sequence(1, len.subtract(1));
  var bandNamesSub = bandNames.slice(1);
  return difFromMedian.reduce(ee.Reducer.min(len)).select(bandsPos,bandNamesSub);
}

function addDOYtrgtDif(img){
  var dif = ee.Number(img.get('doy')).subtract(ee.Number(props.doyTarget)).abs();
  return img.set('doy_target_dif', dif);
}

function addDOYband(img){
  var doyBand = ee.Image(ee.Number(img.get('doy')))
  .updateMask(img.select(0).mask())
  .toShort().rename('DOY');
  return img.addBands(doyBand);
}

// ---------------------
function sr_mosaicMean(col){ // TODO: check calculation \n  return col.map(sr_removeBandCFmask)
  .reduce(ee.Reducer.mean())
  .set(setMosaicMetadata(col.first()))
  .rename(sr_removeBandCFmask(col.first()).bandNames());
}

function sr_mosaicMedian(col){ // TODO: check calculation
  return col.map(sr_removeBandCFmask)
  .reduce(ee.Reducer.median())
  .set(setMosaicMetadata(col.first()))
  .rename(sr_removeBandCFmask(col.first()).bandNames());
}

function sr_mosaicMin(col){ // TODO: check calculation 
  return col.map(sr_removeBandCFmask)
  .reduce(ee.Reducer.min())
  .set(setMosaicMetadata(col.first()))
  .rename(sr_removeBandCFmask(col.first()).bandNames());
}

function sr_mosaicMax(col){ // TODO: check calculation 
  return col.map(sr_removeBandCFmask)
  .reduce(ee.Reducer.max())
  .set(setMosaicMetadata(col.first()))
  .rename(sr_removeBandCFmask(col.first()).bandNames());
}

function ls_mosaicPath(col){  // TODO: need to add year composite etc
  col = col.map(setdistinctPath);
  var di = ee.ImageCollection(col.distinct(['distinct_path']));
  var date_eq_filter = ee.Filter.equals({leftField: 'distinct_path', rightField: 'distinct_path'});
  var saveall = ee.Join.saveAll('to_mosaic');
  var ji = ee.ImageCollection(saveall.apply(di, col, date_eq_filter));
  var m = ji.map(function(img) {
    return ee.ImageCollection.fromImages(img.get('to_mosaic')).mosaic().set({'distinct_path': img.get('distinct_path')});
  });
    return m;
  }
  
  function sr_mosaicMedoid(col){
    col = col.map(sr_removeBandCFmask);
    return getMediod(col).set(setMosaicMetadata(col.first())); // TODO: check years and dates
  }
  
  function sr_mosaicDOY(col){
    col = col.map(sr_removeBandCFmask)
    .map(addDOYtrgtDif)
    .map(addDOYband)
    .sort('doy_target_dif', false); //TODO - need to add default doyTarget to image examples
    return col.mosaic().set(setMosaicMetadata(col.first()));
  }
  
  // #######################################################################################
  // ###### SAMPLE DATA ####################################################################
  // #######################################################################################
  
function sr_getLT05img(){
   return sr_initBandMetadata(ee.Image('LANDSAT/LT05/C01/T1_SR/LT05_038029_20000707'))
   .set({'composite_year': 2000, 'sensing_year': 2000, 'filler':'no'});
  }
  
function sr_getLE07img(){return sr_initBandMetadata(ee.Image('LANDSAT/LE07/C01/T1_SR/LE07_038029_20050814'))
  .set({'composite_year': 2005, 'sensing_year': 2005, 'filler':'no'});
}

function sr_getLC08img(){
  return sr_initBandMetadata(ee.Image('LANDSAT/LC08/C01/T1_SR/LC08_038029_20150701'))
  .set({'composite_year': 2015, 'sensing_year': 2015, 'filler':'no'});
}

function sr_getLT05col(){
  return ee.ImageCollection('LANDSAT/LT05/C01/T1_SR')
  .filterDate('2000-07-01', '2000-09-01').filterBounds(ee.Geometry.Point([-110.34, 44.45]))
  .map(sr_initBandMetadata)
  .map(function(img){return img.set({'composite_year': 2000, 'sensing_year': 2000, 'filler':'no'})});
}

function sr_getLE07col(){
  return ee.ImageCollection('LANDSAT/LE07/C01/T1_SR').filterDate('2005-07-01', '2005-09-01')
  .filterBounds(ee.Geometry.Point([-110.34, 44.45]))
  .map(sr_initBandMetadata)
  .map(function(img){return img.set({'composite_year': 2005, 'sensing_year': 2005, 'filler':'no'})});
}

function sr_getLC08col(){
  return ee.ImageCollection('LANDSAT/LC08/C01/T1_SR')
  .filterDate('2015-07-01', '2015-09-01').filterBounds(ee.Geometry.Point([-110.34, 44.45]))
  .map(sr_initBandMetadata).map(function(img){return img.set({'composite_year': 2015, 'sensing_year': 2015, 'filler':'no'})});
}

function sr_getL578col(){
  return ee.ImageCollection([
    ee.Image('LANDSAT/LT05/C01/T1_SR/LT05_038029_20000707').set({'composite_year': 2000, 'sensing_year': 2000, 'filler':'no'}),
    ee.Image('LANDSAT/LE07/C01/T1_SR/LE07_038029_20050814').set({'composite_year': 2005, 'sensing_year': 2005, 'filler':'no'}),
    ee.Image('LANDSAT/LC08/C01/T1_SR/LC08_038029_20150701').set({'composite_year': 2015, 'sensing_year': 2015, 'filler':'no'})
  ]).map(sr_initBandMetadata);
}

// #######################################################################################
// ###### INDEX CALCULATION FUNCTIONS ####################################################
// #######################################################################################


var tcTransform = function(img){
  var origImg = img;
  img = getLC08bands(img);
  var b = ee.Image(img).select([\"B2\", \"B3\", \"B4\", \"B5\", \"B6\", \"B7\"]);
  var brt_coeffs = ee.Image.constant([0.2043, 0.4158, 0.5524, 0.5741, 0.3124, 0.2303]);
  var grn_coeffs = ee.Image.constant([-0.1603, -0.2819, -0.4934, 0.7940, -0.0002, -0.1446]);
  var wet_coeffs = ee.Image.constant([0.0315, 0.2021, 0.3102, 0.1594, -0.6806, -0.6109]);
  
  
  var sum = ee.Reducer.sum();
  var brightness = b.multiply(brt_coeffs).reduce(sum);
  var greenness = b.multiply(grn_coeffs).reduce(sum);
  var wetness = b.multiply(wet_coeffs).reduce(sum);
  var angle = (greenness.divide(brightness)).atan().multiply(180/Math.PI).multiply(100);
  var tc = brightness.addBands(greenness)
  .addBands(wetness)
  .addBands(angle)
  .select([0,1,2,3], ['TCB','TCG','TCW','TCA']); // TODO: could probably use rename here
  return origImg.addBands(tc);
};

var nbrTransform = function(img) {
  var origImg = img;
  img = getLC08bands(img).normalizedDifference(['B5', 'B7']).rename(['NBR']);
  return origImg.addBands(img);
};


function ndviTransform(img){
  var origImg = img;
  img = getLC08bands(img).normalizedDifference(['B5', 'B4']).rename(['NDVI']);
  return origImg.addBands(img);
}

function ndsiTransform(img){
  var origImg = img;
  img = getLC08bands(img).normalizedDifference(['B3', 'B6']).rename(['NDSI']);\n  return origImg.addBands(img);
}

function ndmiTransform(img) {
  var origImg = img;\n  img = getLC08bands(img).normalizedDifference(['B5', 'B6']).rename(['NDMI']);
  return origImg.addBands(img);
}

function ndgrTransform(img) {
  var origImg = img;\n  img = getLC08bands(img).normalizedDifference(['B3', 'B4']).rename(['NDGR']);
  return origImg.addBands(img);
}


function getLC08bands(img){
  return ee.Image(ee.Algorithms.If(
    ee.Algorithms.IsEqual(img.get('band_names'), ee.String('LC08')),
    img.select(['B2','B3','B4','B5','B6','B7']),
    img.select(['B1', 'B2', 'B3', 'B4', 'B5', 'B7'], ['B2','B3','B4','B5','B6','B7'])
    ));
  }

// #######################################################################################
// MINNAERT TOPO CORRECTION ##############################################################
// #######################################################################################
// function to return sun azimuth and zenith angle for time of Landsat image acquistion

function getSolarPosition(img){
  var azimuth = img.get('SOLAR_AZIMUTH_ANGLE');
  var zenith = img.get('SOLAR_ZENITH_ANGLE');
  return {azimuth:azimuth, zenith:zenith};
}

// function to convert degrees to radians
function radians(img){return img.toFloat().multiply(Math.PI).divide(180);}

// function to calculate illumination condition
function getIllumination(args){
  // args = {azimuth:azimuth, zenith:zenith}
  var dem = ee.Image(props.demMinnaert);

  // calc illumination condition  
var terrain = ee.Algorithms.Terrain(dem);
var slope = radians(terrain.select(['slope'])).resample('bicubic');
var aspect = radians(terrain.select(['aspect'])).resample('bicubic');
var azimuth = radians(ee.Image.constant(args.azimuth));
var zenith = radians(ee.Image.constant(args.zenith));
var left = zenith.cos()
.multiply(slope.cos());
var right = zenith.sin()
.multiply(slope.sin())
.multiply(azimuth.subtract(aspect).cos()); 
return left.add(right).resample('bicubic');
}

// function to make Minnaert coefficient image per given Landsat band

function getKimg(){
  // define polynomial coefficients to calc Minnaert value as function of slope
  // Ge, H., Lu, D., He, S., Xu, A., Zhou, G., & Du, H. (2008). Pixel-based Minnaert correction method for reducing topographic effects on a Landsat 7 ETM+ image. Photogrammetric Engineering & Remote Sensing, 74(11), 1343-1350. | https://orst.library.ingentaconnect.com/content/asprs/pers/2008/00000074/00000011/art00003?crawler=true&mimetype=application/pdf
  var kPolyCoefs = ee.Dictionary({ // these have been reversed from Fig. 4
        \"B2\": [0.9955046347,-0.1107874514,0.0060353467,-0.000139425,0.0000011256],
        \"B3\": [1.4038672968,-0.1660369464,0.0094389685,-0.0002224522,0.0000018168],
        \"B4\": [1.7297781997,-0.2104072261,0.0119868502,-0.0002844382,0.0000023443],
        \"B5\": [1.0021313684,-0.1308793751,0.0106861276,-0.0004051135,0.0000071825,-4.88e-8],
        \"B6\": [1.3313675208,-0.1857263329,0.014950102,-0.0005601872,0.0000098744,-6.69e-8],
        \"B7\": [1.7780447207,-0.2540062618,0.01957206,-0.0007159317,0.0000124497,-8.37e-8]
      });
  
  var dem = ee.Image(props.demMinnaert);
  var slope = ee.Algorithms.Terrain(dem).select(['slope']).resample('bicubic');
  slope = slope.where(slope.gt(50), 50); // set max slope at 50 degrees - paper does not sample past - authors recommend no extrapolation
  var bnames = kPolyCoefs.keys();
  var kImgList = bnames.map(function(band){
    return slope.polynomial(kPolyCoefs.get(band)).set('band',band);
  });
    return ee.ImageCollection.fromImages(kImgList)
    .sort('band')
    .toBands()
    .rename(bnames);
  }
  
  /*
  function to apply Minnaert Correction - basically just wraps previous functions - if you are going
  to map this on a collection - this function needs to be redone a little as an anonymous function
  when calling .map() so that you can define the dem argument (if you wish - there is also a default), 
  as well as supplying the image - for this toy example it is not being mapped
  */
 
 function topoCorrMinnaert(img){
  img = sr_standardizeBands(ee.Image(img));
  var origImg = img;
  var bNames = img.select(['B[2-7]']).bandNames();
  img = img.select(bNames);
  var solPos = getSolarPosition(img);
  var ic = getIllumination({azimuth:solPos.azimuth, zenith:solPos.zenith});
  var cosTheta = radians(ee.Image.constant(solPos.zenith)).cos();
  var correction = (cosTheta.divide(ic)).pow(getKimg());
  return ee.Image(img.multiply(correction).round().toShort()
  .addBands(origImg.select(['[^B]*']))
  .copyProperties(origImg)
  .set({
    'topo_correction': 'minnaert',
    'system:time_start': origImg.get('system:time_start'),
    'system:index': origImg.get('system:index'),
  }));
}

// #######################################################################################
// ###### PROPS ##########################################################################
// #######################################################################################

function setProps(userProps){
  // TODO: warn if nothing is passed
  props.startYear = userProps.startYear || props.startYear;
  props.endYear = userProps.endYear || props.endYear;
  props.startDate = userProps.startDate || props.startDate;
  props.endDate = userProps.endDate || props.endDate;
  props.cfmask = userProps.cfmask || props.cfmask;
  props.sensors = userProps.sensors || props.sensors;
  props.harmonizeTo = userProps.harmonizeTo || props.harmonizeTo;
  props.exclude = userProps.exclude || props.exclude;
  props.compositeDate = userProps.compositeDate || props.compositeDate;
  props.doyTarget = userProps.doyTarget || props.doyTarget;
  props.aoi = userProps.aoi || props.aoi;
  props.resample = userProps.resample || props.resample;
  props.startDateInt = getNumericMonthDay(props.startDate);
  props.endDateInt = getNumericMonthDay(props.endDate);
  props.interYear = props.startDateInt.month > props.endDateInt.month;
  props.compDateInt = getNumericMonthDay(props.compositeDate);
  props.demMinnaert = userProps.demMinnaert || props.demMinnaert;
  props.maskBuffer =  userProps.maskBuffer || props.maskBuffer;
  if(userProps.maskAux1 !== undefined){
    props.maskAux1.swir1NormPath = userProps.maskAux1.swir1NormPath || props.maskAux1.swir1NormPath;
    props.maskAux1.blueNormPath = userProps.maskAux1.blueNormPath || props.maskAux1.blueNormPath;
    props.maskAux1.swir1StdevPath = userProps.maskAux1.swir1StdevPath || props.maskAux1.swir1StdevPath;
    props.maskAux1.blueStdevPath = userProps.maskAux1.blueStdevPath || props.maskAux1.blueStdevPath;
    props.maskAux1.swir1DifLimit = userProps.maskAux1.swir1DifLimit || props.maskAux1.swir1DifLimit;
    props.maskAux1.blueDifLimit = userProps.maskAux1.blueDifLimit || props.maskAux1.blueDifLimit;
    props.maskAux1.swir1ReflLimit = userProps.maskAux1.swir1ReflLimit || props.maskAux1.swir1ReflLimit;
    props.maskAux1.blueReflLimit =userProps.maskAux1.blueReflLimit || props.maskAux1.blueReflLimit;
  }
  print('Collection Properties:');
  print(props);
}

var props = {
  startYear: 1986,
  endYear: 2018,
  startDate: '06-15',
  endDate: '09-15',
  cfmask: ['cloud', 'shadow', 'snow', 'water'],
  sensors: ['LT05', 'LE07', 'LC08'],
  harmonizeTo: 'LC08', //'LE07'
    exclude: [],
    compositeDate: '08-01',
    doyTarget: 200,  // TODO: could this be a converted compositeDate - is there a case where you'd want them to be different?  
    aoi: ee.Geometry.Point([-110.438,44.609]),
    resample: 'nearest-neighbor',
    startDateInt: getNumericMonthDay('06-15'),
    endDateInt: getNumericMonthDay('09-15'),
    interYear: false,
    compDateInt: getNumericMonthDay('08-01'),
    demMinnaert: 'USGS/GMTED2010',
    maskBuffer: 150,
    maskAux1:{
      swir1NormPath: '',
      blueNormPath: '',
      swir1StdevPath: '',
      blueStdevPath: '',
      swir1DifLimit: -3.5,
      blueDifLimit: 5,
      swir1ReflLimit: 700,
      blueReflLimit: 800
    }
  };
  
// #######################################################################################
// ###### EXPORTS ########################################################################
// #######################################################################################

exports.sr = {
  'gather':           sr_gather,
  'resample':         sr_resample,
  'harmonize':        harmonize,
  'maskCFmask':       maskCFmask,
  'maskAux1':         maskAux1,        // TODO: add this to the docs
  'maskBuffer':       maskBuffer,
  'getLT05img':       sr_getLT05img,
  'getLE07img':       sr_getLE07img,
  'getLC08img':       sr_getLC08img,
  'getLT05col':       sr_getLT05col,
  'getLE07col':       sr_getLE07col,
  'getLC08col':       sr_getLC08col,
  'getL578col':       sr_getL578col,
  'addBandTC':        tcTransform,
  'addBandNBR':       nbrTransform,
  'addBandNDVI':      ndviTransform,
  'addBandNDSI':      ndsiTransform,
  'addBandNDMI':      ndmiTransform,
  'addBandNDGR':      ndgrTransform,
  'visualize764':     sr_visualize764, // TODO: add this to the docs
  'visualize754':     sr_visualize754,
  'visualize654':     sr_visualize654,
  'visualize543':     sr_visualize543,
  'visualize432':     sr_visualize432,
  'visualize564':     sr_visualize564, // TODO: add this to the docs
  'visualizeTC':      sr_visualizeTC,
  'mosaicMean':       sr_mosaicMean,
  'mosaicMedian':     sr_mosaicMedian,
  'mosaicMin':        sr_mosaicMin,
  'mosaicMax':        sr_mosaicMax,
  'mosaicMedoid':     sr_mosaicMedoid,
  'mosaicDOY':        sr_mosaicDOY,
  'removeBandCFmask': sr_removeBandCFmask,
  'removeSLCoff':     removeSLCoff,
  'removeImageList':  removeImageList,
  'removeImageFiller':removeImageFiller,
  'standardizeBands': sr_standardizeBands,
  'countValid':       countValid,
  'getFilmstrip':     getFilmstrip,
  'visParams':        sr_visParams,
  'maskOutliers':     maskOutliers,
  'topoCorrMinnaert': topoCorrMinnaert
};

exports.ls = {
  'mosaicPath':         ls_mosaicPath
};

exports.props = props;
exports.setProps = setProps;

"},"path":"users/emaprlab/public:UI Applications/LandTrendr/UI LandTrendr Time Series Animator"}
