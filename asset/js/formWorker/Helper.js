const isDom = (e) => e.nodeType ? [Node.ELEMENT_NODE].indexOf(e.nodeType) !== -1 : false

const whatType = (item) => {
  if (isDom(item)) return 'dom'
  let type = toString.call(item).split(' ').pop().slice(0, -1).toLowerCase()
  if (type === 'object' && item.jquery) type = 'jquery'
  return type
}

const isFunction = (i) => whatType(i) === 'function'
const isArray = (i) => whatType(i) === 'array'
const isObject = (i) => whatType(i) === 'object'
const isBoolean = (i) => whatType(i) === 'boolean'

const documentReady = (callback) => {
    if (document.readyState !== 'loading') {
      callback.call()
    } else if (document.addEventListener) {
      document.addEventListener('DOMContentLoaded', () => callback.call())
    } else {
      document.attachEvent('onreadystatechange', () => {
        if (document.readyState === 'complete') callback.call()
      })
    }
}
const createdPathValueObject = (obj, str = '', result = [], left = '[', rigth = ']') => {
    if (this.isObject(obj)) {
        for (const key in obj) {
          let inStr = str
          const item = obj[key]
          inStr += inStr ? left.concat(key, rigth) : key
          createdPathValueObject(item, inStr, result)
        }
      } else if (this.isArray(obj)) {
        for (const itemKey in obj) {
          const item = obj[itemKey]
          if (this.isObject(item) || this.isArray(item)) {
            createdPathValueObject(item, str, result)
          } else {
            result.push({
              path: str ? str.concat('[]') : itemKey,
              value: item
            })
          }
        }
      } else {
        result.push({ path: str, value: obj })
      }
      return result
}
const createdFormDataByData = (data) => {
    const j = this.createdPathValueObject(data)
    const fromData = new FormData()
    for (const item of j) {
      fromData.append(item.path, item.value)
    }
    return fromData
}

export default { 
    whatType,
    isDom,
    isFunction,
    isArray,
    isObject,
    isBoolean,
    documentReady,
    createdPathValueObject,
    createdFormDataByData
}