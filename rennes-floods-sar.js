var imgVV = ee.ImageCollection('COPERNICUS/S1_GRD')
        .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
        .filterBounds(geometry)
        .map(function(image) {
          var edge = image.lt(-30.0);
          var maskedImage = image.mask().and(edge.not());
          return image.updateMask(maskedImage);
        });

var text = require('users/gena/packages:text');
var text_format = text.getLocation(geometry, 'left', '10%', '2%')

var gifParams = {
  'region': geometry,
  'dimensions': 900,
  'crs': 'EPSG:3857',
  'framesPerSecond': 1
};

function addBands(image) {
  return ee.Image.cat(  // combine all images' bands into bands
    image,
    image.expression('b("VV") / b("VH")').rename('div'),
    image.expression('b("VV") + b("VH")').rename('idx')
  );
}

var desc = imgVV.filter(ee.Filter.eq('orbitProperties_pass', 'DESCENDING'));
var desc_addedbands = desc.map(addBands);
var dates = [20, 26]

var composites = ee.ImageCollection.fromImages(
  dates.map(function (date) {
    var startDate = ee.Date.fromYMD(2025, 01, date);
    var endDate = ee.Date.fromYMD(2025, 01, date+5);
    
    var textVis = { fontSize: 32, textColor: '000000', outlineColor: '000000', outlineWidth: 2.5, outlineOpacity: 0.6 }
    var label = text.draw('Jan ' + date, text_format, 40, textVis)
    
    var desc_filt = desc_addedbands.filter(ee.Filter.date(startDate, endDate));
    return desc_filt.median().visualize({'min': -45, 'max': -10, bands: ['idx'], palette: ['blue', 'yellow', 'white']}).blend(label);
    // return desc_filt.median().visualize({'min': [-25, -20, 0], 'max': [5, -8, 1], bands: ['VV', 'VH', 'div'],});
}, true));


print(ui.Thumbnail(composites, gifParams));
print(composites.getVideoThumbURL(gifParams));

Map.setCenter(-1.89, 48, 12);
// Map.addLayer(ascChange, {min: -20, max: 5}, 'Multi-T Mean ASC', true);
// Map.addLayer(descChange, {min: -20, max: 5}, 'Multi-T Mean DESC', true);
