const fs = require('fs');
const readline = require('readline');
const open = require('open');
const puppeteer = require('puppeteer');

const array = fs.readFileSync('payload.txt').toString().split("\n");

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