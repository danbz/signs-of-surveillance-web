// global variables

var maxSigns = 0 // number of sign-images to load
var myFileNames = []
var myGeoData = []
var mySigns = [] // array of sign-image names
var myExif = [] // array of EXIF data for loaded sign-images
var signsLoaded = 0 // initialise count of loaded sign-images
var b_traversingMarkers = false // boolean to track if we are traversing markers
var currentMarker = 0
var delayMilli = 14000 // delay between flyto marker animation events occurring
var openMarkerDelay = 6000 // delay time on auto popup open and close
var closeMarkerDelay = 13000 // delay time on auto popup open and close
var flyAnimationLength = 8 // time in seconds for flyto marker animation
var flyMaxZoom = 18
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
  zoom: 18, // starting zoom
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
  var exif = myExif[currentMarker]
  var lat = piexif.GPSHelper.dmsRationalToDeg(exif['GPS'][piexif.GPSIFD.GPSLatitude], exif['GPS'][piexif.GPSIFD.GPSLatitudeRef])
  var long = piexif.GPSHelper.dmsRationalToDeg(exif['GPS'][piexif.GPSIFD.GPSLongitude],
    exif['GPS'][piexif.GPSIFD.GPSLongitudeRef])
 // document.getElementById('currentSign').innerHTML = currentMarker

  // calculate distance to new latlong posiiton
  var distance = myMap.getCenter().distanceTo([lat, long]) // distance in meters
  if (distance > 100000) {
  //  myMap.easeTo({ bearing: 90, duration: 5000, pitch: 40 })
    flyAnimationLength = 12
  } else {
    flyAnimationLength = 8
  //  myMap.easeTo({ bearing: 0, duration: 5000, pitch: 0 })
  }
  // console.log("distance to " + distance);
  myMap.flyTo([lat, long], flyMaxZoom, {
    // bearing: 90,
    // pitch: 40,
    duration: flyAnimationLength
  })
  setTimeout(openPopupMarker, openMarkerDelay)
  setTimeout(removePopupMarker, closeMarkerDelay)
}

function openPopupMarker () {
  var m = markersList[currentMarker]
  markers.removeLayer(m)
  m.addTo(myMap)
  m.openPopup()
}

function removePopupMarker () {
  var m = markersList[currentMarker]
  myMap.removeLayer(m)
  markers.addLayer(m)
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

    var newLat = piexif.GPSHelper.dmsRationalToDeg(exif['GPS'][piexif.GPSIFD.GPSLatitude], exif['GPS'][piexif.GPSIFD.GPSLatitudeRef])
    var newLong = piexif.GPSHelper.dmsRationalToDeg(exif['GPS'][piexif.GPSIFD.GPSLongitude], exif['GPS'][piexif.GPSIFD.GPSLongitudeRef])
    var newSign = new mapboxgl.Marker({ draggable: false, color: '#000' })
      .setLngLat([ newLong, newLat ])
      .setPopup(popup) // sets a popup on this marker
      .addTo(myMap)

   console.log(' newsign ')
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

// function getImageFileNames () {
//   // request filenames of images from pre-built JSON file on server
//   var xmlhttp = new XMLHttpRequest()
//   xmlhttp.onreadystatechange = function () {
//     if (this.readyState === 4 && this.status === 200) {
//       console.log('returned server filenames ' + this.responseText)
//       myFileNames = JSON.parse(this.responseText)
//       getImageGeoData()
//     }
//   }
//   // xmlhttp.open('GET', 'getNumofFiles.php', true)
//   xmlhttp.open('GET', 'data/files.json', true)
//   xmlhttp.send()
// }

function getImageGeoData () {
  // request geocode date of images from pre-built JSON file on server
  var xmlhttp = new XMLHttpRequest()
  xmlhttp.onreadystatechange = function () {
    if (this.readyState === 4 && this.status === 200) {
      // console.log('returned server localities ' + this.responseText)
      myGeoData = JSON.parse(this.responseText)
      addSigns()
    }
  }
  xmlhttp.open('GET', 'data/all-signs.geojson', true)
  xmlhttp.send()
}
