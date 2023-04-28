const fs = require('fs');
const readline = require('readline');
const open = require('open');

const array = fs.readFileSync('payload.txt').toString().split("\n");

const scanning = async(req, res) => {

    const url = req.body.href;

    try{

        for (let i in array) {
            let victim_url = url + array[i];
            console.log(victim_url);
            const browser = await open(victim_url)
                .then(browser => {
                    // 5초 후 브라우저 종료
                    setTimeout(() => {
                    browser.kill();
                    console.log(`Closed ${url} in ${browser.pid}`);
                    }, 3000);
                })
                .catch(error => {
                    console.error(error);
                });
            console.log(i);
        }
    }catch(error){
        console.log(error);
    }
}

const count = async(req, res) => {
    let cnt = 0;
    console.log(cnt);
    cnt += 1;
    console.log(cnt);
}

module.exports = {
    scanning,
    count,
}