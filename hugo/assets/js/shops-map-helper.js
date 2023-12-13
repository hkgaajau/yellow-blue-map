import { point, polygon } from '@turf/helpers'
import booleanPointInPolygon from '@turf/boolean-point-in-polygon'

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

    for (const district of districtsIncludingOnline) {
      if (booleanPointInPolygon(point([lng, lat]), district)) {
        newShopForm['district'].value = district['properties']['地區']
        break
      }
    }
  })
}, false)

newShopForm.addEventListener('submit', function (submitEvent) {
  if (!newShopForm.checkValidity()) {
    return
  }

  submitEvent.preventDefault()

  const unescapedTitle = newShopForm['title'].value.trim()
  const title = escapeHtml(unescapedTitle)
  const date = escapeHtml(newShopForm['date'].value.trim())
  const district = escapeHtml(newShopForm['district'].value.trim())
  const colour = escapeHtml(newShopForm['colour'].value.trim())
  const category = escapeHtml(newShopForm['category'].value.trim())
  const address = escapeHtml(newShopForm['address'].value.trim())
  const phone = escapeHtml(newShopForm['phone'].value.trim())
  const whatsapp = escapeHtml(newShopForm['whatsapp'].value.trim())
  const openingHours = escapeHtml(newShopForm['openingHours'].value.trim())
  const url = escapeHtml(newShopForm['url'].value.trim())
  const fb = escapeHtml(newShopForm['fb'].value.trim())
  const ig = escapeHtml(newShopForm['ig'].value.trim())
  const openrice = escapeHtml(newShopForm['openrice'].value.trim())
  const remarks = escapeHtml(newShopForm['remarks'].value.trim())
  const source = escapeHtml(newShopForm['source'].value.trim())
  const sourceUrl = escapeHtml(newShopForm['sourceUrl'].value.trim())
  const coord = escapeHtml(newShopForm['coordinates'].value.trim())
  const coord7Array = get7DigitLatLngAsArray(coord)

  const outputContent = `---
title: '${unescapedTitle}'
date: ${date}
districts: ${district}
colours: ${colour}
categories: ${category}
lat: ${coord7Array[0]}
lng: ${coord7Array[1]}
source: ${source}
---
【商戶資料 / Shop Information】 <br>店名: ${title}<br>地址: ${address}<br>電話: ${convertToPhoneLink(phone)}<br>WhatsApp: ${convertToWhatsappLink(whatsapp)}<br>營業時間: <br>${formatOpenriceOpeningHours(openingHours)}<br>網址: ${convertToHyperlink(url)}<br>Facebook: ${convertToHyperlink(fb)}<br>Instagram: ${convertToHyperlink(ig)}<br>Openrice: ${convertToHyperlink(openrice)}${ remarks && '<br><br>' + remarks.replace(/\n/g, '<br>') }<br><br>相關連結: ${convertToHyperlink(sourceUrl)}\n`
  const blob = new Blob([outputContent], { type: 'text/html;charset=UTF-8' })

  const link = document.createElement('a')
  link.href = window.URL.createObjectURL(blob)
  link.download = getCoordPrefix(coord) + getSafeFilename(unescapedTitle) + '.html'
  link.click()
}, false)

document.getElementById('reset-forms-button').addEventListener('click', function () {
  for (const form of document.forms) {
    form.reset()
  }

  initializeNewShopForm()
}, false)

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

function formatOpenriceOpeningHours(openingHours) {
  const lines = openingHours.split('\n').map(l => l.trim()).filter(l => l)

  const outputLines = []
  let outputLineBuffer = ''
  let isFirstLine = true
  for (const line of lines) {
    if (/^(星|公)/.test(line)) {
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
