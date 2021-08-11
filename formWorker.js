class formWorker {
  forms = {}
  lastEventType = ''
  constructor(options = {}) {
    this.fields = null
    this.#setOptions(options)
    const forms = this.#readSelector(this.options.selector)
    this.#initForm(forms)
    if (options.created !== undefined) options.created.call(this)
    if (options.initEvent !== undefined) options.initEvent.call(this)
  }
  #setOptions(options) {
    this.options = Object.assign(
      {
        indentifyPrefix: 'form-default',
        selectFields: ['input', 'select', 'textarea'],
        listenEvents: {
          text: ['input', 'blur'],
          checkbox: ['change', 'input'],
          radio: ['change'],
          textarea: ['input'],
          file: ['change']
        },
        connection: false,
        controls: {} // questionable field
      },
      options
    )
    if (formWorker.isArray(this.options.selectFields)) {
      this.options.selectFields = this.options.selectFields.join(', ')
    }
  }
  #readSelector(selector) {
    if (!selector) throw 'select type is empty'
    let forms = null
    this.forms = {}
    switch (formWorker.whatType(selector)) {
      case 'text':
      case 'string':
        forms = Array.from(document.querySelectorAll(selector))
        break
      case 'dom':
        forms = [selector]
        break
      case 'array':
      case 'nodelist':
        forms = Array.from(selector)
        break
      case 'jquery':
        forms = selector.toArray()
        break
    }
    if (!forms) throw 'selecter is invalide'
    return forms
  }
  #initForm(forms) {
    this.#setFormName(forms)
    for (const index in forms) {
      const form = forms[index]
      this.forms[form.dataset.formName] = { form, key: form.dataset.formName }
    }
    this.#initFields()
    this.#initLinkFieldsAndInput()
  }
  #setFormName(forms) {
    for (const index in forms) {
      const form = forms[index]
      if (!form.dataset.formName) {
        form.dataset.formName = this.options.indentifyPrefix + (+index + 1)
      }
    }
  }
  #setdarkValue(fieldKey, value, formList = null) {
    const formsContainer = Object.values(this.forms).filter((i) => {
      return formList ? formList.includes(i.key) : true
    })
    for (const form of formsContainer) {
      if (form.fields[fieldKey]) {
        const field = form.fields[fieldKey]
        if (field.beforeUpdate !== undefined) {
          value = field.beforeUpdate.call(field, value, form)
        }
        field.darkValue = value
        if (field.afterUpdate !== undefined) {
          field.afterUpdate.call(field, value, form)
        }
      }
    }
  }
  #setLink(value, field, form) {
    let selector = `[data-form-name="${form.key}"] [name=${field.name}]`
    if (field.beforeUpdate !== undefined) {
      value = field.beforeUpdate.call(field, value, form)
    }
    field.darkValue = value
    if (field.afterUpdate !== undefined) {
      field.afterUpdate.call(field, value, form)
    }
    if (this.options.connection) {
      if (formWorker.isBoolean(this.options.connection)) {
        selector = `[name=${field.name}]`
        this.#setdarkValue(field.name, value)
      } else if (formWorker.isObject(this.options.connection)) {
        if (this.options.connection[form.key] !== undefined) {
          const connection = this.options.connection[form.key]
          if (formWorker.isArray(connection)) {
            this.#setdarkValue(field.name, value, connection)
            for (const formName of connection) {
              selector += `, [data-form-name="${formName}"] [name=${field.name}]`
            }
          } else if (formWorker.isObject(connection)) {
            for (const formName in connection) {
              const fields = connection[formName]
              if (fields.includes(field.name)) {
                this.#setdarkValue(field.name, value, formName)
                selector += `, [data-form-name="${formName}"] [name=${field.name}]`
              }
            }
          }
        }
      }
    }
    const checkbox = []
    for (const input of document.querySelectorAll(selector)) {
      switch (input.type) {
        case 'file':
          break
        case 'checkbox':
          checkbox.push(input)
          break
        case 'radio':
          input.dataset.value = value
          input.checked = input.value == value
          break
        default:
          input.value = value
          break
      }
    }
    console.log(this.lastEventType)
    if (checkbox.length) {
      const checkedValue = []
      for (const input of checkbox) {
        if (input.value === value) {
          input.checked = !input.checked
        }
        if (input.checked) {
          checkedValue.push(input.value)
        }
      }
      field.darkValue = checkedValue.join(', ')
      this.#setdarkValue(field.name, field.darkValue)
    }
  }
  #initLinkFieldsAndInput() {
    Object.values(this.forms).forEach((form) => {
      for (const field of Object.values(form.fields)) {
        Object.defineProperty(field, 'value', {
          get: () => field.darkValue,
          set: (value) => this.#setLink(value, field, form)
        })
        field.value = 'war'
      }
    })
  }
  #initFields() {
    const _this = this
    Object.values(this.forms).forEach((form) => {
      form.fields = []
      for (const input of form.form.querySelectorAll(this.options.selectFields)) {
        if (!input.name || input.hasAttribute('data-dont-include')) continue
        if (!form.fields[input.name]) {
          form.fields[input.name] = {
            name: input.name,
            darkValue: null
          }
        }
        if (input.hasAttribute('required')) {
          form.fields[input.name].required = true
        }
        for (const event of this.options.listenEvents[input.type]) {
          input.addEventListener(event, function () {
            _this.lastEventType = input.type
            form.fields[input.name].value = this.value
          })
        }
      }
    })
  }
  send(url = '', data) {
    data = this.createdFormDataByData(data)
    fetch(url, {
      method: 'POST',
      cache: 'no-cache',
      body: data //formData,
    })
      .then((request) => {
        return request.json()
      })
      .then((request) => {
        if (request.isSuccess) {
        }
      })
  }
}
;(() => {
  const helper = {
    whatType(item) {
      if (formWorker.isDom(item)) return 'dom'
      let type = toString.call(item).split(' ').pop().slice(0, -1).toLowerCase()
      if (type === 'object' && item.jquery) type = 'jquery'
      return type
    },
    isDom(e) {
      return e.nodeType ? [Node.ELEMENT_NODE].indexOf(e.nodeType) !== -1 : false
    },
    isArray(i) {
      return formWorker.whatType(i) === 'array'
    },
    isObject(i) {
      return formWorker.whatType(i) === 'object'
    },
    isBoolean(i) {
      return formWorker.whatType(i) === 'boolean'
    },
    documentReady(callback) {
      if (document.readyState !== 'loading') {
        callback.call()
      } else if (document.addEventListener) {
        document.addEventListener('DOMContentLoaded', () => callback.call())
      } else {
        document.attachEvent('onreadystatechange', () => {
          if (document.readyState === 'complete') callback.call()
        })
      }
    },
    createdPathValueObject(obj, str = '', result = []) {
      if (this.isObject(obj)) {
        for (const key in obj) {
          let inStr = str
          const item = obj[key]
          inStr += inStr ? '['.concat(key, ']') : key
          formWorker.createdPathValueObject(item, inStr, result)
        }
      } else if (this.isArray(obj)) {
        for (const itemKey in obj) {
          const item = obj[itemKey]
          if (this.isObject(item) || this.isArray(item)) {
            formWorker.createdPathValueObject(item, str, result)
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
    },
    createdFormDataByData(data) {
      const j = this.createdPathValueObject(data)
      const fromData = new FormData()
      for (const item of j) {
        fromData.append(item.path, item.value)
      }
      return fromData
    }
  }
  for (const fName of Object.keys(helper)) {
    formWorker[fName] = helper[fName]
  }
})()
formWorker.documentReady(() => {
  console.log('pageReady')
  return new formWorker({
    selector: document.querySelectorAll('form'),
    connection: {
      'form-default1': { 'form-default2': ['m'], 'form-default4': ['j'] },
      'form-default2': ['form-default1']
    },
    // connection: true,
    created() {
      const formDefault1 = this.forms['form-default1']
      formDefault1.fields.m.value = '123123'
      formDefault1.fields.m.afterUpdate = function (value, form) {}
      console.log(this.forms)
    }
  })
})
