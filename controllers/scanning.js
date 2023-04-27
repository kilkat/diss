const fs = require('fs');
const readline = require('readline');
const req = require('request');

const array = fs.readFileSync('payload.txt').toString().split("\n");

const scanning = async(req, res) => {
    try{

        for (let i in array) {
            let victim_url = req.body + "?" + array[i];
            console.log(victim_url);
            const options = {
                url: victim_url,
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
    scanning,

}