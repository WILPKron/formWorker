import formWorker from 'formWorker'

formWorker.documentReady(() => {
  const formController = new formWorker({
    selector: document.querySelectorAll('.form'),
    // connection: {
    //   'form-default1': { 'form-default2': ['m'], 'form-default4': ['j'] },
    //   //'form-default4': { 'form-default1': ['j'] },
    //   'form-default2': [ 'form-default1' ]
    // },
    connection: true,
    reinitFormInChange: true,
    created() {
      const formDefault1 = this.forms['form-default1']
      formDefault1.fields.m.value = '123123'
      formDefault1.fields.m.afterUpdate = function (value, form) {}

      const rebase = document.querySelector('.rebase')
      if(rebase) {
        rebase.addEventListener('click', () => {
          fetch('/').then(response => response.text()).then(result => {
            const div = document.createElement('div')
            div.innerHTML = result
            document.querySelector('.form').innerHTML = div.querySelector('.form').innerHTML
          })
        })
      }
    }
  })

  const formController2 = new formWorker({
    selector: document.querySelectorAll('.form2'),
    indentifyPrefix: 'dsdasdasdsad',
    connection: {
      'dsdasdasdsad1': { 'dsdasdasdsad2': ['m'] },
    },
    //connection: false,
    reinitFormInChange: true,
    created() {
      const formDefault1 = this.forms['dsdasdasdsad1']
      const formDefault2 = this.forms['dsdasdasdsad2']
      formDefault1.fields.m.value = '123123'
      formDefault2.fields.m.value = '123'
      formDefault1.fields.m.afterUpdate = function (value, form) {
        console.log('dsdasdasdsad', value, form);
      }
    }
  })

})
