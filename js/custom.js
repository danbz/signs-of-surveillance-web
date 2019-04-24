// global variables

var maxSigns = 0 // number of sign-images to load
// var myFileNames = []
var myGeoData = []
var mySigns = [] // array of sign-image names
var myExif = [] // array of EXIF data for loaded sign-images
var signsLoaded = 0 // initialise count of loaded sign-images
var b_traversingMarkers = false // boolean to track if we are traversing markers
var currentMarker = 0
var delayMilli = 14000 // delay between flyto marker animation events occurring
var openMarkerDelay = 6000 // delay time on auto popup open and close
var closeMarkerDelay = 13000 // delay time on auto popup open and close
var flyAnimationLength = 0.6 // speed for flyto marker animation
var flyMaxZoom = 18
var b_rotate = false
var markersList = [] // array of all markers added to clustering _layer
// myFileNames = getImageFileNames();

window.onload = function () {
  getImageGeoData()

  //  addSigns() // add all the signs to the map
}

mapboxgl.accessToken = 'pk.eyJ1IjoiZGFuYnoiLCJhIjoiY2p0cnN1bXcxMDQ5aTN5bXZ1YmNja2QxNCJ9.Uy4SmkElJKCMLsxy-P8CJQ'
var myMap = new mapboxgl.Map({
  container: 'mapid', // container id
  // style: 'mapbox://styles/mapbox/streets-v11', // stylesheet location
  // style: 'mapbox://styles/danbz/cjulwmvjm0iyd1fpcvgby6wif', // hybrid satellite
  // style: 'mapbox://styles/danbz/cjttqd4zu179f1fqse7u8eudw', // old red and blue with 3d buildings
  style: 'mapbox://styles/danbz/cjulyma2a25c81foaf969uixn', // simple b&w
  // style: 'mapbox://styles/mapbox/satellite-v9',
  // style: 'mapbox://styles/mapbox/dark-v10', //hosted style id
  // style: 'mapbox://styles/mapbox/light-v10',
  center: [ -0.09, 51.505 ], // starting position [lng, lat]
  zoom: 15, // starting zoom
  maxZoom: 20,
  minZoom: 3,
  pitch: 60
})

// L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
//   attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Map Imagery © <a href="https://www.mapbox.com/">Mapbox</a>, all other materials  © <a href="https://www.buzzo.com/">Daniel Buzzo</a>',
//   maxZoom: 20,
//   minZoom: 3,
//   // mapbox styling
//   // id: 'mapbox.streets',
//   id: 'mapbox.dark',
//   style: 'mapbox://styles/danbz/cjulyma2a25c81foaf969uixn', // simple b&w

//   // id: 'mapbox.light',
//   // id: 'mapbox.outdoors',
//   // id: 'mapbox.satellite',
//   accessToken: 'pk.eyJ1IjoiZGFuYnoiLCJhIjoiY2p0cnN1bXcxMDQ5aTN5bXZ1YmNja2QxNCJ9.Uy4SmkElJKCMLsxy-P8CJQ'
// }).addTo(myMap)

// add info to the map
// var info = L.control() // new leaflet map control layer
// info.onAdd = function (myMap) {
//   this._div = L.DomUtil.create('div', 'info') // create a div with a class "info"
//   this.update()
//   return this._div
// }

// info.update = function (props) { // populate info map control layer
//   // method that we will use to update the control based on feature properties passed
//   this._div.innerHTML =
//       "<h1 id='hero-title'>Signs of Surveillance</h1><h2 id='sub-title'>A photography project by <a href='http://www.buzzo.com'>Daniel Buzzo</a></h2><p id='loading-notice'><span id='signTotal'>0</span> signs loaded of <span id='signMax'>0</span>. Viewing sign <span id='currentSign'>0</span><form><div class='toggles'><input type='checkbox' name='styled' id='styled' onclick='traverseMarkers()'><label for='styled'>Traverse Markers</label></div></form></p>"
// }

// info.addTo(myMap) // add info layer to map

// var markers = L.markerClusterGroup({
//   // make clustering group for markers
//   maxClusterRadius: 25,
//   spiderfyOnMaxZoom: false,
//   disableClusteringAtZoom: 16
// })

// to setup signs as custom icons in an array of markers
function addSigns () {
  // maxSigns = myFileNames.length
  maxSigns = myGeoData.features.length
  console.log('maxsigns = ' + maxSigns)
  // document.getElementById('signMax').innerHTML = maxSigns
  for (i = 0; i < maxSigns; i++) {
    var imagePath = 'signs/' + myGeoData.features[i].properties.url
    convertFileToBase64viaFileReader(imagePath) // previous routine to load via piexif.js
  }
  // myMap.addLayer(markers) // add marker layer
}

function traverseMarkers () {
  // traverse map from marker to marker in array
  b_traversingMarkers = !b_traversingMarkers
  //  currentMarker = 0;
  //  document.getElementById("traverseMarkers").innerHTML = b_traversingMarkers;
  // document.getElementById('currentSign').innerHTML = currentMarker
  if (b_traversingMarkers) {
    interval = setInterval(incrementTraverse, delayMilli)
    incrementTraverse()
  } else {
    clearInterval(interval)
  }
}

function incrementTraverse () {
  // fly from marker to marker on the map
  if (currentMarker >= maxSigns) {
    currentMarker = 0
  } else {
    currentMarker += 1
  }
  // var exif = myExif[currentMarker]
  // var lat = piexif.GPSHelper.dmsRationalToDeg(exif['GPS'][piexif.GPSIFD.GPSLatitude], exif['GPS'][piexif.GPSIFD.GPSLatitudeRef])
  // var long = piexif.GPSHelper.dmsRationalToDeg(exif['GPS'][piexif.GPSIFD.GPSLongitude],
  //   exif['GPS'][piexif.GPSIFD.GPSLongitudeRef])
  // document.getElementById('currentSign').innerHTML = currentMarker

  var lat = myGeoData.features[currentMarker].geometry.coordinates[0];
  var long = myGeoData.features[currentMarker].geometry.coordinates[1];
  // calculate distance to new latlong posiiton
  // var distance = myMap.getCenter().distanceTo([lat, long]) // distance in meters
  // if (distance > 100000) {
  // //  myMap.easeTo({ bearing: 90, duration: 5000, pitch: 40 })
  //   flyAnimationLength = 12
  // } else {
  //   flyAnimationLength = 8
  // //  myMap.easeTo({ bearing: 0, duration: 5000, pitch: 0 })
  // }
  console.log(' flying to ' + lat + ', ' + long);
  myMap.flyTo({
    center: [lat, long], 
    zoom: flyMaxZoom, 
    // bearing: 90,
    // pitch: 60,
    speed: flyAnimationLength,
    curve: 1
  })
  setTimeout(openPopupMarker, openMarkerDelay)
  setTimeout(removePopupMarker, closeMarkerDelay)
}

// Create a popup, but don't add it to the map yet.
var popup = new mapboxgl.Popup({
  closeButton: false,
  closeOnClick: false
});

function openPopupMarker () {
  var coordinates = myGeoData.features[currentMarker].geometry.coordinates.slice();
  var locality = myGeoData.features[currentMarker].properties.locality;
  var url = 'signs/' + myGeoData.features[currentMarker].properties.url;
  var make = myGeoData.features[currentMarker].properties.make;
  var model = myGeoData.features[currentMarker].properties.model;
  var orientation = myGeoData.features[currentMarker].properties.orientation;

  var dateStamp = myGeoData.features[currentMarker].properties.date;
  var prettyDate = dateStamp.substr(0, 10)
  var prettyTime = dateStamp.substr(11, 8)
  var prettyDate = prettyDate.replace(/:/g, '/')
  var newPrettyDate = Date.parse(prettyDate).toString('MMMM dS, yyyy')
  var newPrettyTime = Date.parse(prettyTime).toString('HH:mm tt')

  popup
    .setLngLat(coordinates)
    .setHTML("<div class ='sign_popup' ><h1>" + newPrettyDate + ', ' + newPrettyTime + "</h1><div class ='sign_popup_inner'><img class = 'orientation_" + orientation + "' src ='" + url + "'></div> <p>Recorded with " + make + ' ' + model + '.<p><p>' + locality + '</p></div>')
    .addTo(myMap);
}

function removePopupMarker () {
  popup.remove();
}

function loadExif (dataURL, url) {
  // load and extract EXIF data from supplied image url string and URLdatablob
  var originalImg = new Image()
  originalImg.src = dataURL
  var exif = piexif.load(dataURL)
  originalImg.onload = function () {
    /// //////// requested image now loaded ///////////
    mySigns.push(url) // push image name into array
    myExif.push(exif) // push exif data into array of exif data
    // var strLength = url.length // extract sign-image name
    // var signName = url.substr(8, strLength - 8);
    console.log('loaded ' + url)
    // extract EXIF data in preparation for building sign-image popup marker
    var dateStamp = exif['0th'][piexif.ImageIFD.DateTime]
    var prettyDate = dateStamp.substr(0, 10)
    var prettyTime = dateStamp.substr(11, 8)
    var prettyDate = prettyDate.replace(/:/g, '/')
    var newPrettyDate = Date.parse(prettyDate).toString('MMMM dS, yyyy')
    var newPrettyTime = Date.parse(prettyTime).toString('HH:mm tt')
    var make = exif['0th'][piexif.ImageIFD.Make]
    var model = exif['0th'][piexif.ImageIFD.Model]
    var orientation = exif['0th'][piexif.ImageIFD.Orientation]
    var lat = piexif.GPSHelper.dmsRationalToDeg(exif['GPS'][piexif.GPSIFD.GPSLatitude], exif['GPS'][piexif.GPSIFD.GPSLatitudeRef])
    var long = piexif.GPSHelper.dmsRationalToDeg(exif['GPS'][piexif.GPSIFD.GPSLongitude],
      exif['GPS'][piexif.GPSIFD.GPSLongitudeRef])
    var locality = 'unknown place'
    // get reverse geocode lookup
    // var geocodeDataUrl = 'https://api.mapbox.com/geocoding/v5/mapbox.places/%20' + long + '%2C' + lat + '.json?access_token=pk.eyJ1IjoiZGFuYnoiLCJhIjoiY2p0cnN1bXcxMDQ5aTN5bXZ1YmNja2QxNCJ9.Uy4SmkElJKCMLsxy-P8CJQ&cachebuster=1554397643233&autocomplete=true'
    // var geocodeDataUrl = 'https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=' + lat +'&lon='+ long

    // find locality data from geojson file for current sign
    for (s = 0; s < maxSigns; s++) {
      var myGeoUrl = 'signs/' + myGeoData.features[s].properties.url
      if (myGeoUrl === url) {
        locality = myGeoData.features[s].properties.locality // osm reversegeo structure
        console.log('s = ' + s + ' myGeoUrl = ' + myGeoUrl + ' my sign url = ' + url + ' my locality info = ' + locality)
        s = maxSigns
      }
    }

    var popup = new mapboxgl.Popup({ offset: 25 })
      .setHTML("<h1>24th January 2019</h1><img src='signs/sign0.jpg' /><p>location</p>");

    // var newLat = piexif.GPSHelper.dmsRationalToDeg(exif['GPS'][piexif.GPSIFD.GPSLatitude], exif['GPS'][piexif.GPSIFD.GPSLatitudeRef])
    // var newLong = piexif.GPSHelper.dmsRationalToDeg(exif['GPS'][piexif.GPSIFD.GPSLongitude], exif['GPS'][piexif.GPSIFD.GPSLongitudeRef])
    var newSign = new mapboxgl.Marker({ draggable: false, color: '#000' })
      .setLngLat([ long, lat ])
      .setPopup(popup) // sets a popup on this marker
      .addTo(myMap)

    popup.setHTML("<div class ='sign_popup' ><h1>" + newPrettyDate + ', ' + newPrettyTime + "</h1><div class ='sign_popup_inner'><img class = 'orientation_" + orientation + "' src ='" + url + "'></div> <p>Recorded with " + make + ' ' + model + '.<p><p>' + locality + '</p></div>')
    // create new image-sign marker for map
    // var newSign = L.marker([piexif.GPSHelper.dmsRationalToDeg(exif['GPS'][piexif.GPSIFD.GPSLatitude], exif['GPS'][piexif.GPSIFD.GPSLatitudeRef]), piexif.GPSHelper.dmsRationalToDeg(exif['GPS'][piexif.GPSIFD.GPSLongitude],
    // exif['GPS'][piexif.GPSIFD.GPSLongitudeRef])], riseOnHover = true, autoclose = true)
    // bind popup information to sign-image marker

    // newSign.bindPopup("<div class ='sign_popup' ><h1>" + newPrettyDate + ', ' + newPrettyTime + "</h1><div class ='sign_popup_inner'><img class = 'orientation_" + orientation + "' src ='" + url +
    //     "'></div> <p>Recorded with " + make + ' ' + model + '.<p><p>' + locality + '</p></div>')

    // newSign.on('mouseover', function (e) {
    //   this.openPopup()
    // })

    // newSign.on('mouseout', function (e) {
    //   // this.closePopup()
    // })

    markersList.push(newSign)
    // markers.addLayer(newSign)
    // var locality = httpGetAsync(geocodeDataUrl, newSign) // stop doing geocoding for the time being while moving to JSON file based
    signsLoaded += 1 // update number of signs loaded to map
  //  document.getElementById('signTotal').innerHTML = signsLoaded
  }
}

// // get geocode data
// function httpGetAsync (theUrl, sign) {
//   var xmlHttp = new XMLHttpRequest()
//   xmlHttp.onreadystatechange = function () {
//     if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
//     // console.log(xmlHttp.responseText);
//       var jsonText = xmlHttp.responseText
//       myLocality = JSON.parse(jsonText)
//       // console.log("parsed JSON " + myLocality.features[2].place_name);
//       // locality = myLocality.features[2].place_name // mapbox reversegeo structure
//       locality = myLocality.display_name // osm reversegeo structure
//       var content = sign._popup._content
//       sign._popup._content = content + locality + '</p></div>'
//     }
//   }
//   xmlHttp.open('GET', theUrl, true) // true for asynchronous
//   xmlHttp.send(null)
// }

function convertFileToBase64viaFileReader (url) {
  // convert filename to base64 dataURL Blob
  var xhr = new XMLHttpRequest()
  xhr.responseType = 'blob'
  xhr.onload = function () {
    var reader = new FileReader()
    reader.onloadend = function () {
      loadExif(reader.result, url)
    }
    reader.readAsDataURL(xhr.response)
  }
  xhr.open('GET', url)
  xhr.send()
}

function getImageGeoData () {
  // request geocode date of images from pre-built JSON file on server
  var xmlhttp = new XMLHttpRequest()
  xmlhttp.onreadystatechange = function () {
    if (this.readyState === 4 && this.status === 200) {
      // console.log('returned server localities ' + this.responseText)
      myGeoData = JSON.parse(this.responseText)
      // addSigns()
      maxSigns = myGeoData.features.length
      console.log('maxsigns = ' + maxSigns)
    }
  }
  xmlhttp.open('GET', 'data/all-signs.geojson', true)
  xmlhttp.send()
}

myMap.on('load', function () {
  // Add a new source from our GeoJSON data and set the
  // 'cluster' option to true. GL-JS will add the point_count property to your source data.
  myMap.addSource('signs', {
    type: 'geojson',
    data: 'data/all-signs.geojson',
    cluster: true,
    clusterMaxZoom: 14, // Max zoom to cluster points on
    clusterRadius: 50 // Radius of each cluster when clustering points (defaults to 50)
  });

  myMap.addLayer({
    id: 'clusters',
    type: 'circle',
    source: 'signs',
    filter: ['has', 'point_count'],
    paint: {
    // Use step expressions (https://docs.mapbox.com/mapbox-gl-js/style-spec/#expressions-step)
    // with three steps to implement three types of circles:
    //   * Blue, 20px circles when point count is less than 100
    //   * Yellow, 30px circles when point count is between 100 and 750
    //   * Pink, 40px circles when point count is greater than or equal to 750
      'circle-color': [
        'step',
        ['get', 'point_count'],
        '#51bbd6',
        100,
        '#f1f075',
        750,
        '#f28cb1'
      ],
      'circle-radius': [
        'step',
        ['get', 'point_count'],
        20,
        100,
        30,
        750,
        40
      ]
    }
  });

  myMap.addLayer({
    id: "cluster-count",
    type: "symbol",
    source: "signs",
    filter: ["has", "point_count"],
    layout: {
      "text-field": "{point_count_abbreviated}",
      "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
      "text-size": 12
    }
  });

  myMap.addLayer({
    id: "unclustered-point",
    type: "circle",
    source: "signs",
    filter: ["!", ["has", "point_count"]],
    paint: {
      "circle-color": "#11b4da",
      "circle-radius": 8,
      "circle-stroke-width": 1,
      "circle-stroke-color": "#fff"
    }
  });



  myMap.on('click', 'unclustered-point', function (e) {   
    // create and populate a popup on click
    var coordinates = e.features[0].geometry.coordinates.slice();
    var locality = e.features[0].properties.locality;
    var url = 'signs/' + e.features[0].properties.url;
    var make = e.features[0].properties.make;
    var model = e.features[0].properties.model;
    var orientation = e.features[0].properties.orientation;

    var dateStamp = e.features[0].properties.date;
    var prettyDate = dateStamp.substr(0, 10)
    var prettyTime = dateStamp.substr(11, 8)
    var prettyDate = prettyDate.replace(/:/g, '/')
    var newPrettyDate = Date.parse(prettyDate).toString('MMMM dS, yyyy')
    var newPrettyTime = Date.parse(prettyTime).toString('HH:mm tt')

    popup
      .setLngLat(coordinates)
      //.setHTML(description)
      .setHTML("<div class ='sign_popup' ><h1>" + newPrettyDate + ', ' + newPrettyTime + "</h1><div class ='sign_popup_inner'><img class = 'orientation_" + orientation + "' src ='" + url + "'></div> <p>Recorded with " + make + ' ' + model + '.<p><p>' + locality + '</p></div>')
      .addTo(myMap);

  });

  myMap.on('mouseenter', 'unclustered-point', function(e) {
    // Change the cursor style as a UI indicator.
    myMap.getCanvas().style.cursor = 'pointer';

    // create and populate a popup on hover
    var coordinates = e.features[0].geometry.coordinates.slice();
    var locality = e.features[0].properties.locality;
    var url = 'signs/' + e.features[0].properties.url;
    var make = e.features[0].properties.make;
    var model = e.features[0].properties.model;
    var orientation = e.features[0].properties.orientation;

    var dateStamp = e.features[0].properties.date;
    var prettyDate = dateStamp.substr(0, 10)
    var prettyTime = dateStamp.substr(11, 8)
    var prettyDate = prettyDate.replace(/:/g, '/')
    var newPrettyDate = Date.parse(prettyDate).toString('MMMM dS, yyyy')
    var newPrettyTime = Date.parse(prettyTime).toString('HH:mm tt')

    popup
      .setLngLat(coordinates)
      .setHTML("<div class ='sign_popup' ><h1>" + newPrettyDate + ', ' + newPrettyTime + "</h1><div class ='sign_popup_inner'><img class = 'orientation_" + orientation + "' src ='" + url + "'></div> <p>Recorded with " + make + ' ' + model + '.<p><p>' + locality + '</p></div>')
      .addTo(myMap);
  });

  myMap.on('mouseleave', 'unclustered-point', function() {
    myMap.getCanvas().style.cursor = '';
    popup.remove();
  });

  // inspect a cluster on click
  myMap.on('click', 'clusters', function (e) {
    var features = myMap.queryRenderedFeatures(e.point, { layers: ['clusters'] });
    var clusterId = features[0].properties.cluster_id;
    myMap.getSource('signs').getClusterExpansionZoom(clusterId, function (err, zoom) {
      if (err)
        return;

      myMap.easeTo({
        center: features[0].geometry.coordinates,
        zoom: zoom
      });
    });
  });

  myMap.on('mouseenter', 'clusters', function () {
    myMap.getCanvas().style.cursor = 'pointer';
  });

  myMap.on('mouseleave', 'clusters', function () {
    myMap.getCanvas().style.cursor = '';
  });
});

document.getElementById('fly').addEventListener('click', function () {
  // Fly to a random location by offsetting the point -74.50, 40
  // by up to 5 degrees.
  b_rotate = false
  // myMap.flyTo({
  //   center: [
  //     -0.09 + (Math.random() - 0.5) * 10,
  //     51.505 + (Math.random() - 0.5) * 10]
  // })
  traverseMarkers()
})

document.getElementById('rotate').addEventListener('click', function () {
  // toggle whether we are rotating the camera view or not
  b_rotate = !b_rotate
  rotateCamera(0)
})

function rotateCamera (timestamp) {
  // clamp the rotation between 0 -360 degrees
  // Divide timestamp by 100 to slow rotation to ~10 degrees / sec
  if (b_rotate) {
    myMap.rotateTo((timestamp / 100) % 360, { duration: 0 })
  }
  // Request the next frame of the animation.
  requestAnimationFrame(rotateCamera)
}
