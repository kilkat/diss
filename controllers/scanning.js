const fs = require('fs');
const readline = require('readline');
const open = require('open');
const puppeteer = require('puppeteer');

const array = fs.readFileSync('payload.txt').toString().split("\n");

//input 태그 찾는 로직 추가해야됨, front: 데이터 넘어가면 result 페이지로 redirect 시켜야됨
const scanning = async(req, res) => {
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
    scanning,
    result,
}