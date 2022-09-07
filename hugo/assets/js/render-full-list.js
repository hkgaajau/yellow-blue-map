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

const listContainer = document.getElementById('list-container')
listContainer.classList.add('loading')

fetch('/shops/index.json')
  .then(resp => resp.json())
  .then(json => updateTextWidths(json))
  .then(json => updateRowHeights(json))
  .then(json => {
    shopList = json
    refreshHyperList()
  })
  .then(() => {
    listContainer.classList.add('js')
    listContainer.classList.remove('loading')
  })

document.getElementById('search-shop-textbox').addEventListener('input', debounceRefreshHyperList, false)

window.addEventListener('resize', debounceRefreshHyperList, false)

function convertRemToPixels(rem) {
  return rem * parseFloat(getComputedStyle(document.documentElement).fontSize)
}

function generateListOption(list) {
  return {
    itemHeight: list.map(item => item.rowHeight),
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

      return clonedListItem
    }
  }
}

function refreshHyperList(isResize) {
  if (isResize) {
    updateRowHeights(shopList)
  }

  const searchTerm = document.getElementById('search-shop-textbox').value
  const filteredShopList = searchTerm ? shopList.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase())) : shopList

  if (hyperList) {
    hyperList.refresh(container, generateListOption(filteredShopList))
  } else {
    hyperList = new HyperList(container, generateListOption(filteredShopList))
    listContainer.appendChild(container)
  }
  document.getElementById('search-count').textContent = filteredShopList.length
}

function debounceRefreshHyperList(event) {
  if (hyperList) {
    clearTimeout(timeout)

    const isResize = event.type === 'resize'
    timeout = setTimeout(refreshHyperList, 500, isResize)
  }
}

// calc and update text width for each row (initial load)
function updateTextWidths(items) {
  items.forEach(item => {
    const nameWidth = ctx.measureText(item.name).width
    const tagWidth = ctx.measureText(item.district + item.category + item.colour).width / 1.375
    const tagMargin = convertRemToPixels(0.5) * 3

    item.textWidth = nameWidth + tagWidth + tagMargin
  })

  return items
}

// calc and update rowHeight value for each row (initial load and on resize)
function updateRowHeights(items) {
  const containerWidth = listContainer.offsetWidth
  const containerPadding = convertRemToPixels(0.3) * 2
  const availableWidth = containerWidth - containerPadding

  const verticalMargin = (0.5 * convertRemToPixels(1.1)) * 2
  const lineHeight = convertRemToPixels(1.1) * 1.65

  items.forEach(item => {
    // row height = padding + (vertical margin)/2 + no. of lines * line height
    const lines = Math.ceil(item.textWidth / availableWidth)
    item.rowHeight = containerPadding + verticalMargin / 2 + lines * lineHeight
  })

  return items
}