const fs = require('fs');
const readline = require('readline');
const request = require('request');

const array = fs.readFileSync('payload.txt').toString().split("\n");

const scanning = async(req, res) => {

    const url = req.body.href;

    try{

        for (let i in array) {
            let victim_url = url + "?" + "firstname=" + array[i] + "&" + "lastname=random";
            console.log(victim_url);
            const options = {
                url: victim_url,
                headers: {
                    'Cookie': "b4126d5f746bd84bc67f590706290dee",
                    'security_level': "0"
                },
            };
            request.post(options, function(error, response, body) {
                if (error) {
                    console.error('에러:', error);
                  } else if (response.statusCode !== 200) {
                    console.error('HTTP 요청 에러:', response.statusCode, body);
                  } else {
                    console.log('요청 성공:', body);
                    console.log(victim_url);
                    console.log('----------------------------------------------');
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