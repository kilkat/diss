const fs = require('fs');

const url = 'http://cuha.cju.ac.kr';

const array = fs.readFileSync('payload.txt').toString().split("\n");

for(i in array) {
    console.log( i + '번째 payload 입니다 : ' + array[i]);
}