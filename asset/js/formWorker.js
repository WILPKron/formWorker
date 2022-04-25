import Helper from "@jsRoot/formWorker/Helper";
class formWorker {
    forms = {}
    lastEventType = ''
    constructor(options = {}) {
      this.fields = null
      this.forms = null
  
      this.#setOptions(options)
      const forms = this.#readSelector(this.options.selector)
      this.#initForm(forms)
  
      if ('created' in options && formWorker.isFunction(options.created)) options.created.call(this)
      if ('initEvent' in options && formWorker.isFunction(options.initEvent)) options.initEvent.call(this)
      if ('reinitFormInChange' in options && options.reinitFormInChange) {
        this.#reinitFormInChange()
      }
    }
    /*
     * Создает событие прослушивающее изменение детей контенера формы
     */
    #reinitFormInChange() {
      const mutationObserverForm = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          const form = this.forms[mutation.target.dataset.formName]
          if (form !== undefined) {
            let reinitLink = form.fields === undefined
            this.#initFields(form)
            if (reinitLink) {
              this.#initLinkFieldsAndInput(form)
            }
            for (const field in form.fields) {
              form.fields[field].value = form.fields[field].value
            }
          } else {
            console.info('Форма не найдена')
          }
        })
      })
      for (const formContainer of Object.values(this.forms)) {
        const form = formContainer.form
        mutationObserverForm.observe(form, {
          attributes: false,
          characterData: true,
          childList: true,
          subtree: true,
          attributeOldValue: false,
          characterDataOldValue: true
        })
      }
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
          skipFildSelector: {
            selector: 'data-dont-include',
            type: 'data'
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
    /*
     * Создает в контенере яцейку переденного блока/селектора для дольнейшей работы с ней
     */
    #initForm(forms) {
      this.forms = {}
      this.#setFormName(forms)
      for (const index in forms) {
        const form = forms[index]
        this.forms[form.dataset.formName] = { form, key: form.dataset.formName }
      }
      this.#initFields()
      this.#initLinkFieldsAndInput()
    }
    /*
     * Задает data аттрибут для блока, для его идентификации в последующем
     */
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
    #setValueOrGetSelectorConnectionForm(fieldName, formKey, value = null) {
      let selector = `[data-form-name="${formKey}"] [name=${fieldName}]`
      if (this.options.connection) {
        if (formWorker.isBoolean(this.options.connection)) {
          selector = `[name=${fieldName}]`
          selector = Object.values(this.forms).reduce((accum, item) => {
            console.log(item);
            const s = `[data-form-name="${item.key}"] ${selector}`
            return accum ? `${accum}, ${s}` : `${s}`
          }, '')
          console.log(selector);
          if (value) {
            this.#setdarkValue(fieldName, value)
          }
        } else if (formWorker.isObject(this.options.connection)) {
          if (this.options.connection[formKey] !== undefined) {
            const connection = this.options.connection[formKey]
            if (formWorker.isArray(connection)) {
              if (value) {
                this.#setdarkValue(fieldName, value, connection)
              }
              for (const formName of connection) {
                selector += `, [data-form-name="${formName}"] [name=${fieldName}]`
              }
            } else if (formWorker.isObject(connection)) {
              for (const formName in connection) {
                const fields = connection[formName]
                if (fields.includes(fieldName)) {
                  if (value) {
                    this.#setdarkValue(fieldName, value, formName)
                  }
                  selector += `, [data-form-name="${formName}"] [name=${fieldName}]`
                }
              }
            }
          }
        }
      }
      return selector
    }
    #setLink(value, field, form) {
      const selector = this.#setValueOrGetSelectorConnectionForm(field.name, form.key)
      const checkbox = []
      for (const input of document.querySelectorAll(selector)) {
        switch (input.type) {
          case 'checkbox':
            checkbox.push(input)
            break
        }
      }
  
      if (checkbox.length) {
        const checkedValue = []
        for (const input of checkbox) {
          if (this.lastEventType === 'checkbox' && input.value === value) {
            input.checked = !input.checked
          } else if (this.lastEventType !== 'checkbox') {
            input.checked =
              value
                .split(',')
                .map((i) => i.trim())
                .indexOf(input.value) !== -1
          }
          if (input.checked) {
            checkedValue.push(input.value)
          }
        }
        if (this.lastEventType === 'checkbox') {
          value = checkedValue.join(',')
        }
      }
  
      for (const input of document.querySelectorAll(selector)) {
        switch (input.type) {
          case 'checkbox':
          case 'file':
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
  
      if (field.beforeUpdate !== undefined) {
        value = field.beforeUpdate.call(field, value, form)
      }
  
      this.#setValueOrGetSelectorConnectionForm(field.name, form.key, value)
      field.darkValue = value
  
      if (field.afterUpdate !== undefined) {
        field.afterUpdate.call(field, value, form)
      }
    }
    #initLinkFieldsAndInput(container = null) {
      (container !== null ? [container] : Object.values(this.forms)).forEach((form) => {
        for (const field of Object.values(form.fields)) {
          Object.defineProperty(field, 'value', {
            get: () => field.darkValue,
            set: (value) => this.#setLink(value, field, form)
          })
        }
      })
    }
    #initFields(container = null) {
      const _this = this
      ;(container !== null ? [container] : Object.values(this.forms)).forEach((form) => {
        if (container === null || form.fields === undefined) {
          form.fields = []
        }
        for (const input of form.form.querySelectorAll(this.options.selectFields)) {
          let skip = false
  
          switch (this.options.skipFildSelector.type) {
            case 'data':
              skip = input.hasAttribute(this.options.skipFildSelector.selector)
              break
            case 'class':
              skip = input.classList.contains(this.options.skipFildSelector.selector)
              break
          }
  
          if (!input.name || skip) continue
  
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
  }


  for (const fName of Object.keys(Helper)) {
    formWorker[fName] = Helper[fName]
  }

  export default formWorker