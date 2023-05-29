const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');
const readline = require('readline');
const open = require('open');
const puppeteer = require('puppeteer');
const request = require('request');
const http = require('http');
const { response } = require('express');
const scan = require("../models/scan");
const express = require("express");
const crawl = require('../crawl_depth');
const path_scan = require('../pathtraversal_scan');
const AsyncLock = require('async-lock');
const lock = new AsyncLock();
const router = express.Router();


const xss_payload_arr = fs.readFileSync('xss_payload.txt').toString().split("\n");
const os_command_injection_payload_arr = fs.readFileSync('os_command_injection_payload.txt').toString().split("\n");

let scanID = 0;

const getNewScanID = () => {
  return new Promise((resolve, reject) => {
    lock.acquire('scanID', () => {
      scanID++;
      resolve(scanID);
    });
  });
};

let xss_scan_success_data = false;

const xss_scan_success = async(req, res) => {

  xss_scan_success_data = true

  return xss_scan_success_data;
}

let os_command_injection_success_data = false;

const os_command_injection_success = async(req, res) => {

  os_command_injection_success_data = true

  return os_command_injection_success_data;
}

//input 태그 찾는 로직 추가해야됨, front: 데이터 넘어가면 result 페이지로 redirect 시켜야됨
const xss_scan = async (req, res) => {
  const currentScanID = await getNewScanID();

  const {href, option} = req.body;

  console.log("url : " + href)
  console.log("option : " + option)
  

    const regexp = /=/g;

    if(option == "fast"){

      const result = await crawl(href);
      const payload = "<script>alert('xss test');</script>";
        
      for(const url in result){
        const match1 = url.indexOf("?");
        const match2 = url.indexOf("=");
        const match3 = url.match(regexp);
        const match4 = url.indexOf("&");

        if (match1 !== -1 && match2 !== -1 && match3 && match3.length < 2 && match4 === -1) {

          let victim_base_url = url.substr(0, match2 + 1);
          let victim_url = victim_base_url + payload;
          console.log(victim_url);

          const options = {
            uri: victim_url,
          };
    
          request(options, function(err, response, body) {
            if (err) {
              console.error(err);
              return;
            }

          if(body.includes(payload)){
            scan.create({
              scanID: currentScanID,
              scanType: "Fast Scan Reflected XSS",
              inputURL: url,
              scanURL: victim_base_url,
              scanPayload: payload
          });
          }
        });
      }

      }

    }else{

      try {
        const result = await crawl(href);
        for (const url in result) {
        console.log(href);
        const match1 = url.indexOf("?");
        const match2 = url.indexOf("=");
        const match3 = url.match(regexp);
        const match4 = url.indexOf("&");

        if (match1 !== -1 && match2 !== -1 && match3 && match3.length < 2 && match4 === -1) {
            for (let j in xss_payload_arr) {
            const xss_payload = xss_payload_arr[j];

            try {
                let victim_base_url = url.substr(0, match2 + 1)
                let victim_url = victim_base_url + xss_payload;
                console.log(victim_url);

                const browser = await puppeteer.launch({ headless: 'new' });
                const page = await browser.newPage();

                if (xss_scan_success_data) {
                    scan.create({
                        scanID: currentScanID,
                        scanType: "Accurate Reflected XSS",
                        inputURL: url,
                        scanURL: victim_base_url,
                        scanPayload: xss_payload
                    });
                    xss_scan_success_data = false;
                }

                await page.setDefaultNavigationTimeout(1);
                await page.goto(victim_url);
                await browser.close();

            } catch (error) {
                continue;
            }
            }
        }
        }
    } catch (error) {
        console.error(error);
    }
      
    }
    
};


//path traversal 취약점 스캔로직
const pathtraversal_scan = async(req, res) => {
  const currentScanID = await getNewScanID();

  const href = req.body.href;
  const path_traversal_payload_arr = "../";
  const regexp = /=/g;

  const result = await crawl(href);


  for(const url in result){
    const match1 = url.indexOf("?");
    const match2 = url.indexOf("=");
    const match3 = url.match(regexp);
    const match4 = url.indexOf("&");

    console.log(url);

    if(match1 !== -1 && match2 !== -1 && match3 && match3.length < 2 && match4 === -1){
      for (let j = 0; j < 10; j++) {
        try {
          let path_traversal_scan_payload = path_traversal_payload_arr.repeat(j + 1) + "etc/passwd"
          let victim_url = url.substr(0, match2 + 1) + path_traversal_scan_payload;

          const response = await new Promise(resolve => {
              http.request(victim_url, resolve).end();
          });
          const status = response.statusCode;

          if (status === 200) {
          
              scan.create({
              scanID: currentScanID,
              scanType: "Path Traversal",
              inputURL: href,
              scanURL: url,
              scanPayload: path_traversal_scan_payload
              });
          }
        } 
        catch(error) {
          continue;
        }
      }
    }
    else{
        console.log('query가 발견되지 않았습니다.');
    }
  }       
}

const os_command_injection = async (req, res) => {
  const currentScanID = await getNewScanID();
  const href = req.body.href;
  const result = await crawl(href);

  for (const url in result) {
    for (let i in os_command_injection_payload_arr) {
      const os_command_injection_payload = os_command_injection_payload_arr[i];
  
      try {
        let victim_url = url + os_command_injection_payload;
        
        await axios.get(victim_url);
  
        console.log(victim_url)

        if(os_command_injection_success_data){
          await scan.create({
            scanID: currentScanID,
            scanType: "OS Command Injection",
            inputURL: href,
            scanURL: url,
            scanPayload: os_command_injection_payload,

          });
          os_command_injection_success_data = false;
        }
        
      } catch (error) {
        continue;
      }
    }
  }
};


module.exports = {
    xss_scan,
    pathtraversal_scan,
    os_command_injection,
    xss_scan_success,
    os_command_injection_success,
}