const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const { response } = require('express');

const url = 'http://cuha.cju.ac.kr'

const site_scan = async(req, res) => {
  try{

    const max_depth = 10;
    let list = [];
    let sub_list = [];
    const merged = list.concat(sub_list);
    let unique_list = merged.filter((item, pos) => merged.indexOf(item) === pos);
  
    const browser = await puppeteer.launch({headless:'new'});
    const page = await browser.newPage();
  
    await page.goto(url);
  
    const html = await page.content();
    const $ = cheerio.load(html);

    $('a').each((index, element) => {
      const href = $(element).attr('href');
      if (href) {
        list.push(href);
      }else{
        console.log("href가 존재하지 않습니다.");
      }
    });

    list.each(list, function(index, element){
      for(const i = 0; i < max_depth; i++){

        const browser = puppeteer.launch({headless:'new'});
        const page = browser.newPage();

        const sub_url = url + element + sub_list[i];

        if(!(sub_url.includes(sub_url))){
          const request = page.goto(sub_url);
          const status = request.status();
      
          if(status == 200){

            const html = page.content();
            const $ = cheerio.load(html);

            $('a').each((index, element) => {
              const href = $(element).attr('href');
              if (href) {
                sub_list.push(href);
              }else{
                console.log("href가 존재하지 않습니다.");
              }
            });

          }else{
            console.log('404 PAGE NOT FOUND');
          }

        }

      }
    });

    console.log("list = " + list);
    console.log("sub_list = " + sub_list);
    console.log("unique_list = " + unique_list);


  }catch(error){
    console.log(error);
  }
}