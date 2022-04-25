import formWorker from './asset/js/formWorker'

formWorker.documentReady(() => {
  const formController = new formWorker({
    selector: document.querySelectorAll('form'),
    // connection: {
    //   'form-default1': { 'form-default2': ['m'], 'form-default4': ['j'] },
    //   //'form-default4': { 'form-default1': ['j'] },
    //   'form-default2': [ 'form-default1' ]
    // },
    connection: false,
    reinitFormInChange: true,
    created() {
      const formDefault1 = this.forms['form-default1']
      formDefault1.fields.m.value = '123123'
      formDefault1.fields.m.afterUpdate = function (value, form) {}
    }
  })
})
