import Helper from "@jsRoot/formWorker/Helper";
const send = (url = '', data) => {
  data = Helper.createdFormDataByData(data)
  fetch(url, {
    method: 'POST',
    cache: 'no-cache',
    body: data //formData,
  })
    .then((request) => request.json())
    .then((request) => {
      if (request.isSuccess) {
      }
    })
}

export default { 
    send
}