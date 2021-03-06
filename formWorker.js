class formWorker
{
    constructor(selector, options = {}) {
        if(typeof selector !== 'string') {
            throw "select type doesn't correct";
				}
        this.forms = document.querySelectorAll(selector);
        this.fields = [];
        this.listenEvents = options.listenEvents ? options.listenEvents : ['input', 'blur', 'change'];
        this.options = Object.assign({
					selector,
					lastChangeElement: null,
					storage: 'fields',
       	}, options);
        this.initFields();
        this.initLink();
        this.initEvent();
   }
   initEvent() {}
   static documentReady(callback) {
       if (document.readyState !== 'loading') {
           callback();
       } else if (document.addEventListener) {
           document.addEventListener('DOMContentLoaded', () => callback());
       } else {
           document.attachEvent('onreadystatechange', () => {
               if (document.readyState === 'complete') callback();
           });
       }
	 }
   changeSendField(parent = null) {
       if(typeof parent === 'string') {
           parent = document.querySelector(parent);
       }
       if(parent) {
           for(const field of Object.values(this.fields)) {
               field.send = field.elements.some(element => parent.contains(element));
           }
       }
       return Object.values(this.fields).some(field => field.send);
   }
   getLink(input) {
       switch (input.type) {
           case "file": return input.elements[0].files; break;
           case "checkbox": return input.elements[0].checked; break;
           case "radio": return input.elements[0].dataset.value; break;
           default: return input.elements[0].value; break;
       }
	}
	setLink(value, input) {
       for(const element of input.elements) {
           switch (element.type) {
               case "file": break;
               case "checkbox":
										element.checked = !!value;
               break;
               case "radio":
                   element.dataset.value = value;
                   element.checked = element.value == value;
               break;
               default: element.value = value; break;
           }
       }
       let save = localStorage.getItem(this.options.storage);
       save = save ? JSON.parse(save) : {};
       save[input.name] = value;
       localStorage.setItem(this.options.storage, JSON.stringify(save));
	}
  initLink() {
        const set = (element, input) => {
           let value = element.value;
           if(!!input.update) {
               let updateValue = input.update(value)
               if(updateValue !== undefined) {
                   value = updateValue;
							 }
           }
           if('checkbox' === element.type) {
               value = element.checked ? true : '';
           }
           input.value = value;
				}
        for(const inputKey in this.fields) {
            const input = this.fields[inputKey];
           Object.defineProperty(input, "value", {
               get: () => this.getLink(input),
               set: (value) => this.setLink(value, input),
           });
           for(const element of input.elements) {
               element.addEventListener('updatevalue', () => set(element, input));
               for(const event of this.listenEvents) {
                   element.addEventListener(event, () => set(element, input));
							 }
					 }
				}
	 }
   initFields() {
       this.fields = [];
       for(const form of this.forms) {
           for(const input of form.querySelectorAll('input, select, textarea')) {
               if(!input.name || input.hasAttribute('data-not-include')) {
                   continue;
							 }
               if(!this.fields[input.name]) {
                   this.fields[input.name] = {
                       required: input.hasAttribute('required'),
                       name: input.name,
											 type: input.type,
                  }
							 }
               if(!this.fields[input.name].elements) {
                   this.fields[input.name].elements = [];
							 }
               this.fields[input.name].elements.push(input);
					}
			}
	}
	/*******************************/
	isArray(arr) {
       return Object.prototype.toString.call(arr) === "[object Array]";
	}
  isObject(obj) {
       return Object.prototype.toString.call(obj) === "[object Object]";
	}
  /*******************************/

  createdPathValueObject(obj, str = '', result = []) {
		if(this.isObject(obj)) {
		    for(const key in obj) {
		        let inStr = str;
		        const item = obj[key];
            inStr += inStr ? '['.concat(key, ']') : key;
            this.createdPathValueObject(item, inStr, result);
				}
		} else if(this.isArray(obj)) {
        for(const itemKey in obj) {
               const item = obj[itemKey];
               if(this.isObject(item) || this.isArray(item)) {
                   this.createdPathValueObject(item, str, result);
							 } else {
                   result.push({path: str ? str.concat('[]') : itemKey, value: item});
							 }
           }
    } else {
       result.push({path: str, value: obj});
    }
		return result;
	}
	
	createdFormDataByData(data) {
			const j = this.createdPathValueObject(data);
			const fromData = new FormData();
			for(const item of j) {
						 fromData.append(item.path, item.value);
			}
			return fromData;
	}
}

class authForm extends formWorker
{
	constructor(selector) {
       super(selector);
       let save = localStorage.getItem(this.options.storage);
       save = save ? JSON.parse(save) : {};
       for(const key in save) {
           const value = save[key];
           this.fields[key].value = value;
       }
   }
   check() {
       const error = {message: [], errorFields: []}
       for(const field of Object.values(this.fields)) {
           if(field.send && field.required && !field.value) {
               error.message.push('Обязательное поле '.concat(field.name, ' не заполнено'));
               error.errorFields.push(field.name);
           }
       }
       return error.errorFields.length ? error : true;
   }
   send(url = '', data) {
       data = this.createdFormDataByData(data);
       fetch(url, {
           method: 'POST',
           cache: 'no-cache',
           body: data,//formData,
       }).then(request => {
           return request.json();
       }).then(request => {
           if(request.isSuccess) {
               
           }
       });
   }
   initEvent() {
	    for(const form of this.forms) {
           form.querySelector('.button').addEventListener('click', (e) => {
               this.changeSendField(form);
               const check = this.check();
               if(check !== true) {
					throw 'error from field';
				}
               let data = {};
               for(const field of Object.values(this.fields)) {
                   if(data.send === undefined || data.send === true) {
                       data[field.name] = field.value;
					}
				}

               this.send('/ajax/?act=User.LoginUser', [1, 2, 3, 4, { f: { c: 2, n: { m: 1 } }, v: 2 }]);
			});
		}
	}
}
formWorker.documentReady(() => new authForm('.login-form'));
