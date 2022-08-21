import HyperList from 'hyperlist'
import { colour_class_mappings as classClassMappings } from '@params'

let shopList = []

let hyperList = null
let timeout = null // for debouncing

const container = document.createElement('ul')
container.classList.add('relaxed-block-list')

// set up hidden canvas for measuring text width and calculating row height
const canvas = document.createElement('canvas')
canvas.style = 'display: none'
document.body.appendChild(canvas)
const ctx = canvas.getContext('2d')
ctx.font = 'normal 1.1rem -apple-system, BlinkMacSystemFont, "Helvetica Neue", "Segoe UI", "Roboto", sans-serif'

fetch('/shops/index.json')
  .then(resp => resp.json())
  .then(json => {
    shopList = json
    refreshHyperList()
  })
  .then(() => {
    document.getElementById('list-container').classList.add('js')
  })

document.getElementById('search-shop-textbox').addEventListener('input', debounceRefreshHyperList, false)

window.addEventListener('resize', debounceRefreshHyperList, false)

function convertRemToPixels(rem) {
  return rem * parseFloat(getComputedStyle(document.documentElement).fontSize)
}

function generateListOption(list) {
  return {
    itemHeight: convertRemToPixels(2.965), // margin (/2 to simulate collapse) + padding + line height
    total: list.length,
    generate(index) {
      const item = list[index]

      const clonedListItem = document.getElementById('list-item-template').content.firstElementChild.cloneNode(true)
      clonedListItem.classList.add(classClassMappings[item.colour])
      const link = clonedListItem.querySelector('.link')
      link.href = item.link
      link.textContent = item.name
      clonedListItem.querySelector('.district').textContent = item.district
      clonedListItem.querySelector('.category').textContent = item.category
      clonedListItem.querySelector('.colour').textContent = item.colour

      // calculate actual row height for hyperlist
      const nameWidth = ctx.measureText(item.name).width
      const tagWidth = ctx.measureText(item.district + item.category + item.colour).width / 1.375
      const tagMargin = convertRemToPixels(0.5) * 3
      const textWidth = nameWidth + tagWidth + tagMargin

      const containerWidth = document.getElementById('list-container').offsetWidth
      const containerPadding = convertRemToPixels(0.3) * 2
      const availableWidth = containerWidth - containerPadding

      // row height = padding + (vertical margin)/2 + no. of lines * line height
      const verticalMargin = (0.5 * convertRemToPixels(1.1)) * 2
      const lines = Math.ceil(textWidth / availableWidth)
      const lineHeight = convertRemToPixels(1.1) * 1.65
      const rowHeight = containerPadding + verticalMargin / 2 + lines * lineHeight

      return { element: clonedListItem, height: rowHeight }
    }
  }
}

function refreshHyperList() {
  const searchTerm = document.getElementById('search-shop-textbox').value
  const filteredShopList = searchTerm ? shopList.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase())) : shopList

  if (hyperList) {
    hyperList.refresh(container, generateListOption(filteredShopList))
  } else {
    hyperList = new HyperList(container, generateListOption(shopList))
    document.getElementById('list-container').appendChild(container)
  }
  document.getElementById('search-count').textContent = filteredShopList.length
}

function debounceRefreshHyperList() {
  if (hyperList) {
    clearTimeout(timeout)

    timeout = setTimeout(refreshHyperList, 500)
  }
}