const { response } = require('express');
const request = require('request');

async function fast_scan(){

  const payload = "<script>alert('xss test');</script>";

  const options = {
    uri: "http://127.0.0.1:3000/xss",
    qs: {
      name: payload
    }
  };

  request(options, function(err, response, body) {
    if (err) {
      console.error(err);
      return;
    }

    console.log(body);
    if(body.includes(payload)){
      console.log('xss!!!')
    }
  });

}

fast_scan();
