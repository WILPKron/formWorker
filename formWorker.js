class formWorker {
  forms = {};
  constructor(options = {}) {
    this.fields = null;
    this.#setOptions(options);
    const forms = this.#readSelector(this.options.selector);
    this.#initForm(forms);
    if (options.created !== undefined) options.created.call(this);
    if (options.initEvent !== undefined) options.initEvent.call(this);
  }
  #setOptions(options) {
    this.options = Object.assign(
      {
        indentifyPrefix: "form-default",
        selectFields: ["input", "select", "textarea"],
        listenEvents: ["input", "change", "blur"],
        connection: false,
        controls: {}, // questionable field
      },
      options
    );
    if (formWorker.#whatType(this.options.selectFields) === "array") {
      this.options.selectFields = this.options.selectFields.join(", ");
    }
  }
  #readSelector(selector) {
    if (!selector) throw "select type is empty";
    let forms = null;
    this.forms = {};
    switch (formWorker.#whatType(selector)) {
      case "text":
      case "string":
        forms = Array.from(document.querySelectorAll(selector));
        break;
      case "dom":
        forms = [selector];
        break;
      case "array":
      case "nodelist":
        forms = Array.from(selector);
        break;
      case "jquery":
        forms = selector.toArray();
        break;
    }
    if (!forms) throw "selecter is invalide";
    return forms;
  }
  #initForm(forms) {
    this.#setFormName(forms);
    for (const index in forms) {
      const form = forms[index];
      this.forms[form.dataset.formName] = { form, key: form.dataset.formName };
    }
    this.#initFields();
    this.#initLinkFieldsAndInput();
  }
  #setFormName(forms) {
    for (const index in forms) {
      const form = forms[index];
      if (!form.dataset.formName) {
        form.dataset.formName = this.options.indentifyPrefix + (+index + 1);
      }
    }
  }
  #setdarkValue(fieldKey, value, formList = null) {
    const formsContainer = Object.values(this.forms).filter((i) => {
      return formList ? formList.includes(i.key) : true;
    });
    for (const form of formsContainer) {
      if (form.fields[fieldKey]) {
        const field = form.fields[fieldKey];
        if (field.beforeUpdate !== undefined) {
          value = field.beforeUpdate.call(field, value, form);
        }
        field.darkValue = value;
        if (field.afterUpdate !== undefined) {
          field.afterUpdate.call(field, value, form);
        }
      }
    }
  }
  #setLink(value, field, form) {
    let selector = `[data-form-name="${form.key}"] [name=${field.name}]`;
    const connectionType = formWorker.#whatType(this.options.connection);
    if (field.beforeUpdate !== undefined) {
      value = field.beforeUpdate.call(field, value, form);
    }
    field.darkValue = value;
    if (field.afterUpdate !== undefined) {
      field.afterUpdate.call(field, value, form);
    }
    if (this.options.connection) {
      if (connectionType === "boolean") {
        selector = `[name=${field.name}]`;
        this.#setdarkValue(field.name, value);
      } else if (connectionType === "object") {
        if (this.options.connection[form.key] !== undefined) {
          const connection = this.options.connection[form.key];
          if (formWorker.#whatType(connection) === "array") {
            this.#setdarkValue(field.name, value, connection);
            for (const formName of connection) {
              selector += `, [data-form-name="${formName}"] [name=${field.name}]`;
            }
          } else if (formWorker.#whatType(connection) === "object") {
            for (const formName in connection) {
              const fields = connection[formName];
              if (fields.includes(field.name)) {
                this.#setdarkValue(field.name, value, formName);
                selector += `, [data-form-name="${formName}"] [name=${field.name}]`;
              }
            }
          }
        }
      }
    }
    for (const input of document.querySelectorAll(selector)) {
      switch (input.type) {
        case "file":
          break;
        case "checkbox":
          input.checked = !!value;
          break;
        case "radio":
          input.dataset.value = value;
          input.checked = input.value == value;
          break;
        default:
          input.value = value;
          break;
      }
    }
  }
  #initLinkFieldsAndInput() {
    Object.values(this.forms).forEach((form) => {
      for (const field of Object.values(form.fields)) {
        Object.defineProperty(field, "value", {
          get: () => field.darkValue,
          set: (value) => this.#setLink(value, field, form),
        });
        field.value = "war";
      }
    });
  }
  #initFields() {
    Object.values(this.forms).forEach((form) => {
      form.fields = [];
      for (const input of form.form.querySelectorAll(
        this.options.selectFields
      )) {
        if (!input.name || input.hasAttribute("data-dont-include")) continue;
        if (!form.fields[input.name]) {
          form.fields[input.name] = {
            name: input.name,
            darkValue: null,
          };
        }
        if (input.hasAttribute("required")) {
          form.fields[input.name].required = true;
        }
        for (const event of this.options.listenEvents) {
          input.addEventListener(event, function () {
            form.fields[input.name].value = this.value;
          });
        }
      }
    });
  }
  static #whatType(item) {
    if (formWorker.#isDom(item)) return "dom";
    let type = toString.call(item).split(" ").pop().slice(0, -1).toLowerCase();
    if (type === "object" && item.jquery) type = "jquery";
    return type;
  }
  static #isDom(e) {
    return e.nodeType ? [Node.ELEMENT_NODE].indexOf(e.nodeType) !== -1 : false;
  }
}
(() => {
  const helper = {
    ajax() {
      console.log(3123123123);
    },
  };
  for (const fName in Object.keys(helper)) {
    formWorker[fName] = helper[fName];
  }
})();
(() =>
  new formWorker({
    selector: document.querySelectorAll("form"),
    connection: {
      "form-default1": { "form-default2": ["m"], "form-default4": ["j"] },
      "form-default2": ["form-default1"],
    },
    created() {
      formWorker.ajax();
      const formDefault1 = this.forms["form-default1"];
      formDefault1.fields.m.afterUpdate = function (value, form) {};
    },
  }))();
