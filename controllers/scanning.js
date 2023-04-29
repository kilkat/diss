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

//victim_url을 result page로 보내고 result page에서 몇개의 xss가 성공했는지 count해서 result output 해주는 로직을 짜야함

const count = async(req, res) => {
    console.log("success");
}

module.exports = {
    scanning,
    count,
}