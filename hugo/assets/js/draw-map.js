var mapElement = document.getElementById('map')
mapElement.classList.add('js')

var xhr = new XMLHttpRequest()
xhr.onload = function () {
  var data = JSON.parse(xhr.responseText)

  if (!data || !data.length || data.length === 0) {
    return
  }

  var data_i = 0
  var latSum = 0
  var lngSum = 0
  for (data_i = 0; data_i < data.length; ++data_i) {
    latSum += data[data_i].lat
    lngSum += data[data_i].lng
  }
  var latAvg = latSum / data.length
  var lngAvg = lngSum / data.length

  var tileLayer = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
    subdomains: ['a', 'b', 'c']
  })

  var item
  var shopMap = {
    '黃店': [],
    '藍店': [],
    '綠店': []
  }

  var generateMarkerIcon = function (colour) {
    markerHtmlStyles = 'background-color: ' + colour + ';' +
      'width: 1rem;' +
      'height: 1rem;' +
      'display: block;' +
      'left: -0.5rem;' +
      'top: -0.5rem;' +
      'position: relative;' +
      'border-radius: 1rem 1rem 0;' +
      'transform: rotate(45deg);' +
      'border: 1px solid #FFFFFF'

    return L.divIcon({
      className: '',
      iconAnchor: [0, 24],
      labelAnchor: [-6, 0],
      popupAnchor: [0, -36],
      html: '<span style="' + markerHtmlStyles + '"></span>'
    })
  }

  var markerMap = {
    '黃店': generateMarkerIcon('rgb(250, 216, 33)'),
    '藍店': generateMarkerIcon('rgb(41, 170, 225)'),
    '綠店': generateMarkerIcon('rgb(58, 179, 74)')
  }

  for (data_i = 0; data_i < data.length; ++data_i) {
    item = data[data_i]

    shopMap[item.colour].push(L.marker([item.lat, item.lng], { icon: markerMap[item.colour] })
      .bindPopup(item.colour + ' ' + item.district + ' ' + item.category + '<br><a href="' + item.link + '" target="_blank">' + item.name + '</a>'))
  }
  var yellowGroup = L.layerGroup(shopMap['黃店'])
  var blueGroup = L.layerGroup(shopMap['藍店'])
  var greenGroup = L.layerGroup(shopMap['綠店'])

  var map = L.map(mapElement, {
    center: [latAvg, lngAvg],
    zoom: 16,
    layers: [tileLayer, yellowGroup, blueGroup, greenGroup],
    zoomControl: false
  })

  map.addControl(new L.Control.Gps({ autoCenter: true }))
  map.addControl(new L.Control.ZoomFS())

  var overlayMaps = {
    '黃店': yellowGroup,
    '藍店': blueGroup,
    '綠店': greenGroup
  }
  L.control.layers(null, overlayMaps).addTo(map)
}
xhr.open('GET', 'index.json')
xhr.send()