import HyperList from 'hyperlist'
import { colour_class_mappings as classClassMappings } from '@params'

let shopList = []

let hyperList = null
let timeout = null // for debouncing

const container = document.createElement('ul')
container.classList.add('relaxed-block-list')

fetch('/shops/index.json')
  .then(resp => resp.json())
  .then(json => {
    shopList = json

    hyperList = new HyperList(container, generateListOption(shopList))

    document.getElementById('list-container').appendChild(container)
  })

document.getElementById('search-shop-textbox').addEventListener('input', function () {
  if (hyperList) {
    clearTimeout(timeout)

    timeout = setTimeout(function () {
      const searchTerm = document.getElementById('search-shop-textbox').value
      const filteredShopList = searchTerm ? shopList.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase())) : shopList
      hyperList.refresh(container, generateListOption(filteredShopList))
    }, 500)
  }
}, false)

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

      return clonedListItem
    }
  }
}