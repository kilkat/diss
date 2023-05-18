const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');
const readline = require('readline');
const open = require('open');
const puppeteer = require('puppeteer');
const http = require('http');
const { response } = require('express');
const scan = require("../models/scan");
const site_depth = require("../site_depth");
const express = require("express");
const router = express.Router();


const payload = fs.readFileSync('payload.txt').toString().split("\n");


let xss_scan_success_data = false

const xss_scan_success = async(req, res) => {

  xss_scan_success_data = true

  return xss_scan_success_data
}

//input 태그 찾는 로직 추가해야됨, front: 데이터 넘어가면 result 페이지로 redirect 시켜야됨
const xss_scan = async(req, res) => {
    // const url = req.body.href;

    for (let i in payload) {

        payload = payload[i]

        try {
          let victim_url = url + payload;
          console.log(victim_url);
      
          const browser = await puppeteer.launch({headless:'new'});
          const page = await browser.newPage();

          if (xss_scan_success_data) {
            scan.create({
              scanType: "Reflected XSS",
              scanURL: url,
              scanPayload: payload
            });

            xss_scan_success_data = false

          }

          await page.setDefaultNavigationTimeout(1);
          await page.goto(victim_url);
          await browser.close();

        } catch (error) {
          continue;
        }
      }
};

//path traversal 취약점 스캔로직
const pathtraversal_scan = async(req, res) => {
  const url = req.body.href;
  const payload = "../";
  let success_url = [];
  let position;
  let match;
  const regexp = /=/g;
  const outputFileName = 'site_tree.txt';

    // for (let i =0; i < 10; i++) {
        try {

          startCrawling(url)
            .then(() => {
              console.log('Crawling completed successfully.');
            })
            .catch(error => {
              console.error('An error occurred while crawling:', error);
            });

          const site_tree = fs.readFileSync('site_tree.txt').toString().split("\n");

          console.log('1');

          for(let i in site_tree){
            const match1 = site_tree[i].indexOf("?");
            const match2 = site_tree[i].indexOf("=");
            const match3 = site_tree[i].match(regexp);
            const match4 = site_tree[i].indexOf("&");

            // console.log(match3);

            if(match1 !== -1 && match2.length !== -1 && match3.length < 2 && match4 == -1){
              scan_payload = payload.repeat(10) + "etc/passwd"
              // console.log(scan_payload);
              // console.log('2')
              let victim_url = site_tree[i].substr(0, match2 + 1) + scan_payload;

              console.log(victim_url);

              const response = await new Promise(resolve => {
                  http.request(victim_url, resolve).end();
              });
              const status = response.statusCode;

              if (status === 200) {
                
                  scan.create({
                    scanType: "Path traversal",
                    scanURL: url,
                    scanPayload: scan_payload
                  });

                  console.log(victim_url);
                  console.log("-------------------------------------------------------------------------------");
                  break;
              }
              console.log(victim_url);
              console.log("-------------------------------------------------------------------------------");
            }
            // else if(match1 !== -1 && match2.length !== -1 && match3.length > 1 && match4 !== -1){

            //   scan_payload = payload.repeat(10) + "etc/passwd"

            //   while ((match = regexp.exec(site_tree[i])) !== null) {
            //     position = match.index;
            //   }
            //   console.log(position);

            //   //위치 계산해서 payload 합치면됨

            //   // console.log(victim_url);

            // }
            else{
              console.log('query가 발견되지 않았습니다.');
            }
          }

        }   
        catch(error) {
        //     continue;
        }
        // finally {
        //   const scanResult = await scan.findAll({ where: { scanType: "Path traversal" } });
        //   return res.send(JSON.stringify(scanResult));

        // }
        // }
}

module.exports = {
    xss_scan,
    xss_scan_success,
    pathtraversal_scan,
}