const fs = require('fs');

const url = 'http://cuha.cju.ac.kr';

const array = fs.readFileSync('payload.txt').toString().split("\n");

for(i in array) {
    // console.log( i + '번째 payload 입니다 : ' + array[i]);
    let victim_url = url + array[i];
    console.log(victim_url);

    //url 받고 query 날리는 로직 짜면됨

}