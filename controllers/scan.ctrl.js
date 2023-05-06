const fs = require('fs');
const readline = require('readline');
const open = require('open');
const puppeteer = require('puppeteer');
const http = require('http');
const { response } = require('express');
const scan = require("../models/scan");
const express = require("express");
const router = express.Router();

const array = fs.readFileSync('payload.txt').toString().split("\n");



let xss_scan_success_data = false

const xss_scan_success = async(req, res) => {

  xss_scan_success_data = true

  return xss_scan_success_data
}

//input 태그 찾는 로직 추가해야됨, front: 데이터 넘어가면 result 페이지로 redirect 시켜야됨
const xss_scan = async(req, res) => {
    const url = req.body.href;

    for (let i in array) {

        payload = array[i]

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
  const url =req.body.href;
  const payload = "../";
  let success_url = [];

  const referer = req.headers.referer

  console.log("-------------------------------------------------------------------------------");

    for (let i = 0; i < 10; i++) {
        try {
            scan_payload = payload.repeat(i + 1) + "etc/passwd"
            let victim_url = url + scan_payload;

            const options = {
              method: 'GET',
              headers: {
                'X-Type': 'Path traversal'
              }
            };

            const response = await new Promise(resolve => {
                http.request(victim_url, options, resolve).end();
            });
            const status = response.statusCode;

            console.log(status);

            if (status === 200) {
              
                scan.create({
                  scanType: "Path traversal",
                  scanURL: referer,
                  scanPayload: scan_payload
                });
                success_url.push(victim_url);
                console.log(victim_url);
                console.log("-------------------------------------------------------------------------------");
                break;
            }
            console.log(victim_url);
            console.log("-------------------------------------------------------------------------------");
        }   
        catch(error) {
            continue;
        }
        }
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
    xss_scan_success,
    pathtraversal_scan,
    result,
}