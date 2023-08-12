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
  
  //if(typeof(prevOneYrRec) !== "boolean"){
  //  prevOneYrRec = prevOneYrRec.toLowerCase() != 'false';
  //}
  
  return { 
    maxSegments:              parseInt(paramPanel.widgets().get(1).widgets().get(1).getValue()),
    spikeThreshold:         parseFloat(paramPanel.widgets().get(2).widgets().get(1).getValue()),
    vertexCountOvershoot:     parseInt(paramPanel.widgets().get(3).widgets().get(1).getValue()),
    preventOneYearRecovery:                                                        prevOneYrRec,
    recoveryThreshold:      parseFloat(paramPanel.widgets().get(5).widgets().get(1).getValue()),
    pvalThreshold:          parseFloat(paramPanel.widgets().get(6).widgets().get(1).getValue()),
    bestModelProportion:    parseFloat(paramPanel.widgets().get(7).widgets().get(1).getValue()),
    minObservationsNeeded:    parseInt(paramPanel.widgets().get(8).widgets().get(1).getValue())
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
  var startDayLabel = ui.Label('Start Date:');
  var startDayBox = ui.Textbox({value:'06-10'});
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
  };
};



// RGB YEAR PANEL
exports.rgbYearsPanel = function(){
  var d = new Date();
  var y = d.getFullYear();

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
      ui.Panel([lonLabel, lonBox, latLabel, latBox],ui.Panel.Layout.Flow('horizontal'))
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
  if(typeof(value) !== "boolean"){
    value = value.toLowerCase() != 'false';
  }
  return value;
};
