const fs = require('fs');
const readline = require('readline');
const req = require('request');

const href = req.body;

const array = fs.readFileSync('payload.txt').toString().split("\n");

const scanningResult = async(req, res) => {
    try{

        for (let i in array) {
            let victim_url = url + "?" + array[i];
            console.log(victim_url);
            const options = {
                url: href,
                form: {
                    data: i
                }
            };
            request.post(options, function(error, response, body) {
                if (!error && response.statusCode == 200) {
                    console.log(body);
                }
            });
        }

    }catch(error){
        console.log(error);
    }
}

module.exports = {
    scanningResult,
};