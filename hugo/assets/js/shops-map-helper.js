import { point, polygon } from '@turf/helpers'
import booleanPointInPolygon from '@turf/boolean-point-in-polygon'
import { parse } from 'csv-parse/browser/esm/sync'
import { configure, BlobWriter, TextReader, ZipWriter } from '@zip.js/zip.js'

configure({
  useWebWorkers: false,
})

import { features } from 'data/hksar_18_district_boundary.json'

// add polygon for online shops
const districtsIncludingOnline = [
  polygon([[
    [114.0566591, 22.3235484],
    [114.1542176, 22.3105200],
    [114.1533560, 22.2981202],
    [114.1337037, 22.2922693],
    [114.1169433, 22.2812754],
    [114.1167716, 22.2423337],
    [114.0575151, 22.2418568],
    [114.0566591, 22.3235484],
  ]], { "地區": "網上商店" }),
  ...features]

const newShopForm = document.forms['new-shop-form']
initializeNewShopForm()

document.forms['google-maps-search-form'].addEventListener('submit', function () {
  newShopForm['address'].value = document.forms['google-maps-search-form']['query'].value
}, false)

document.getElementById('map').addEventListener('mapCreated', function (mapCreatedEvent) {
  const map = mapCreatedEvent.detail.map

  document.forms['go-to-coordinates-form'].addEventListener('submit', function (submitEvent) {
    if (!document.forms['go-to-coordinates-form'].checkValidity()) {
      return
    }

    submitEvent.preventDefault()

    var latLngString = escapeHtml(document.forms['go-to-coordinates-form']['coordinates'].value.trim())
    var match = /(-?\d+\.\d+), (-?\d+\.\d+)/.exec(latLngString)
    if (match) {
      map.setView(new L.LatLng(Number(match[1]), Number(match[2])), 16)
    }
  }, false)

  map.on('click', function (leafletClickEvent) {
    const lat = leafletClickEvent.latlng.lat
    const lng = leafletClickEvent.latlng.lng

    newShopForm['coordinates'].value = lat + ", " + lng
    newShopForm['district'].value = getEnclosingDistrict(lat, lng)
  })
}, false)

function getEnclosingDistrict(lat, lng) {
  for (const district of districtsIncludingOnline) {
    if (booleanPointInPolygon(point([lng, lat]), district)) {
      return district['properties']['地區']
    }
  }

  console.warn(`The point (${lat}, ${lng}) does not belong to any district`)
  return ''
}

newShopForm.addEventListener('submit', function (submitEvent) {
  if (!newShopForm.checkValidity()) {
    return
  }

  submitEvent.preventDefault()

  const shopContent = generateShopContentObject({
    address: newShopForm['address'].value,
    category: newShopForm['category'].value,
    colour: newShopForm['colour'].value,
    coordinates: newShopForm['coordinates'].value,
    date: newShopForm['date'].value,
    fb: newShopForm['fb'].value,
    ig: newShopForm['ig'].value,
    openingHours: newShopForm['openingHours'].value,
    openrice: newShopForm['openrice'].value,
    phone: newShopForm['phone'].value,
    remarks: newShopForm['remarks'].value,
    source: newShopForm['source'].value,
    sourceUrl: newShopForm['sourceUrl'].value,
    title: newShopForm['title'].value,
    url: newShopForm['url'].value,
    whatsapp: newShopForm['whatsapp'].value,
  })

  const blob = new Blob([shopContent.content], { type: 'text/html;charset=UTF-8' })

  const link = document.createElement('a')
  link.href = window.URL.createObjectURL(blob)
  link.download = shopContent.filename
  link.click()
  window.URL.revokeObjectURL(link)
}, false)

function generateShopContentObject({title, date, colour, category, address, phone, whatsapp, openingHours, url, fb, ig, openrice, remarks, source, sourceUrl, coordinates}) {
  const unescapedTitle = title.trim()
  const escapedTitle = escapeHtml(unescapedTitle)
  const frontMatterTitle = unescapedTitle.replace(/'/g, "''") // escape ' for front matter
  const escapedDate = escapeHtml(date.trim())
  const escapedColour = escapeHtml(colour.trim())
  const escapedCategory = escapeHtml(category.trim())
  const escapedAddress = escapeHtml(address.trim())
  const escapedPhone = escapeHtml(phone.trim())
  const escapedWhatsapp = escapeHtml(whatsapp.trim())
  const escapedOpeningHours = escapeHtml(openingHours.trim())
  const escapedUrl = escapeHtml(url.trim())
  const escapedFb = escapeHtml(fb.trim())
  const escapedIg = escapeHtml(ig.trim())
  const escapedOpenrice = escapeHtml(openrice.trim())
  const escapedRemarks = escapeHtml(remarks.trim())
  const escapedSource = escapeHtml(source.trim())
  const escapedSourceUrl = escapeHtml(sourceUrl.trim())
  const escapedCoord = escapeHtml(coordinates.trim())
  const coord7Array = get7DigitLatLngAsArray(escapedCoord)

  const [lat, lng] = escapedCoord.split(', ')
  const district = getEnclosingDistrict(lat, lng)

  const filename = getCoordPrefix(escapedCoord) + getSafeFilename(unescapedTitle) + '.html'
  const content = `---
title: '${frontMatterTitle}'
date: ${escapedDate}
districts: ${district}
colours: ${escapedColour}
categories: ${escapedCategory}
lat: ${coord7Array[0]}
lng: ${coord7Array[1]}
source: ${escapedSource}
---
【商戶資料 / Shop Information】 <br>店名: ${escapedTitle}<br>地址: ${convertFalsyToSlash(escapedAddress)}<br>電話: ${convertToPhoneLink(escapedPhone)}<br>WhatsApp: ${convertToWhatsappLink(escapedWhatsapp)}<br>營業時間: <br>${formatOpenriceOpeningHours(escapedOpeningHours)}<br>網址: ${convertToHyperlink(escapedUrl)}<br>Facebook: ${convertToHyperlink(escapedFb)}<br>Instagram: ${convertToHyperlink(escapedIg)}<br>Openrice: ${convertToHyperlink(escapedOpenrice)}${ escapedRemarks && '<br><br>' + escapedRemarks.replace(/\n/g, '<br>') }<br><br>相關連結: ${convertToHyperlink(escapedSourceUrl)}\n`

  return {filename, content}
}

document.getElementById('clear-branch-fields-button').addEventListener('click', function () {
  document.forms['google-maps-search-form']['query'].value = ''
  document.forms['go-to-coordinates-form']['coordinates'].value = ''
  document.forms['new-shop-form']['coordinates'].value = ''
  document.forms['new-shop-form']['district'].value = ''
  document.forms['new-shop-form']['address'].value = ''
  document.forms['new-shop-form']['phone'].value = ''
  document.forms['new-shop-form']['whatsapp'].value = ''
  document.forms['new-shop-form']['openingHours'].value = ''
  document.forms['new-shop-form']['openrice'].value = ''

  initializeNewShopForm()
}, false)

document.getElementById('reset-forms-button').addEventListener('click', function () {
  for (const form of document.forms) {
    form.reset()
  }

  initializeNewShopForm()
}, false)

document.getElementById('csvImportFilepicker').addEventListener('change', (event) => {
  const file = event.target.files[0]
  if (file) {
    const reader = new FileReader()

    reader.onload = async (e) => {
      const content = e.target.result

      csvRecords = parse(content, {
        bom: true,
        columns: true,
      })

      const zipFileWriter = new BlobWriter()
      const zipWriter = new ZipWriter(zipFileWriter)

      for (const record of csvRecords) {
        const shop = generateShopContentObject({
          date: new Date().toISOString().substring(0, 10),
          ...record
        })

        await zipWriter.add(shop.filename, new TextReader(shop.content))
      }

      await zipWriter.close()
      const zipFileBlob = await zipFileWriter.getData()

      const link = document.createElement('a')
      link.href = window.URL.createObjectURL(zipFileBlob)
      link.download = 'shops.zip'
      link.click()
      window.URL.revokeObjectURL(link)
    }

    reader.readAsText(file)
  }
})

function initializeNewShopForm() {
  newShopForm['date'].value = new Date().toISOString().substring(0, 10)
}

function getCoordPrefix(coord) {
  return coord.split(', ').map(v => parseFloat(v).toFixed(3)).join('-') + '-'
}

function get7DigitLatLngAsArray(coord) {
  return coord.split(', ').map(v => parseFloat(v).toFixed(7))
}

function getSafeFilename(filename) {
  return filename.replace(/<|>|:|"|\/|\\|\||\?|\*|#|\.|\r|\n/g, '').replace(/ /g, '-')
}

function convertToPhoneLink(phone) {
  return phone ? `<a href="tel:+852${phone}">${phone}</a>` : '/'
}

function convertToWhatsappLink(whatsapp) {
  return whatsapp ? `<a href="https://wa.me/852${whatsapp}">${whatsapp}</a>` : '/'
}

function convertToHyperlink(url) {
  return url ? `<a href="${url}">${url}</a>` : '/'
}

function convertFalsyToSlash(text) {
  return text || '/'
}

function formatOpenriceOpeningHours(openingHours) {
  const lines = openingHours.split('\n').map(l => l.trim()).filter(l => l)

  const outputLines = []
  let outputLineBuffer = ''
  let isFirstLine = true
  for (const line of lines) {
    if (/^(星|公|\*)/.test(line)) {
      if (outputLineBuffer) outputLines.push(outputLineBuffer)

      outputLineBuffer = line
      isFirstLine = true
    } else {
      outputLineBuffer += isFirstLine ? ' ' : ', '
      isFirstLine = false

      outputLineBuffer += line
    }
  }
  if (outputLineBuffer) outputLines.push(outputLineBuffer)

  return outputLines.length > 0 ? outputLines.join('<br>') : '/'
}

function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}
