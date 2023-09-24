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
const SocketIO = require('socket.io');
const { Socket } = require('dgram');
const urlModule = require('url');



const xss_payload_arr = fs.readFileSync('xss_payload.txt').toString().split("\n");
const os_command_injection_payload_arr = fs.readFileSync('os_command_injection_payload.txt').toString().split("\n");


let xss_scan_success_data = false

const xss_scan_success = async(req, res) => {

  xss_scan_success_data = true

  return xss_scan_success_data
}

os_command_injection_success_data = false

let scanID = 0;

const getNewScanID = () => {
  return new Promise((resolve, reject) => {
    lock.acquire('scanID', () => {
      scanID++;
      resolve(scanID);
    });
  });
};

// Stored XSS - URL 목록에서 write로 끝나는 URL을 추출하는 함수
const getExactWriteEndingUrls = (urlList) => {
  return urlList.filter(url => {
    try {
      const path = new URL(url).pathname; 
      const segments = path.split('/');
      const lastSegment = segments[segments.length - 1];
      return lastSegment === 'write';
    } catch (e) {
      return false; 
    }
  });
}

const stored_xss_fast_scan_payload = "<script>alert('xss test');</script>";

// Stored XSS - URL의 Form 태그에서 name 속성값 찾기
const findFormTagsForStoredXssFastScan = async (url,href) => {
  try {
      const response = await axios.get(url);
      const $ = cheerio.load(response.data);
      
      const forms = [];
      $('form').each((index, element) => {
          const action = $(element).attr('action');
          const method = $(element).attr('method') || 'get';
          
          const formData = {};
          $(element).find('input[name], textarea[name]').each((i, inputElement) => {
              const inputName = $(inputElement).attr('name');
              formData[inputName] = stored_xss_fast_scan_payload;
          });

          forms.push({
              url: `${href}${action}`,
              method,
              data: formData
          });
      });

      return forms;
  } catch (error) {
      console.error(`Failed to fetch and parse URL ${url}: ${error.message}`);
      return [];
  }
};

const submitPostForStoredXssFastScan = async (form) => {
  try {
    let redirectUrl = null;
    if (form.method.toLowerCase() === 'post') {
        const response = await axios.post(form.url, form.data);

        redirectUrl = response.request.res.responseUrl;
    }

    console.log(redirectUrl)

    return redirectUrl;

} catch (error) {
    console.error(`Failed to submit to URL ${form.url}: ${error.message}`);
    return null;
}
};

const checkAlertTriggeredInBrowser = async (url, expectedAlertMessage) => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // 'alert' 이벤트 리스너를 추가합니다.
  let isAlertTriggered = false;
  page.on('dialog', async (dialog) => {
      if (dialog.message() === expectedAlertMessage) {
          isAlertTriggered = true;
      }
      await dialog.dismiss();
  });

  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await browser.close();

  return isAlertTriggered;
};

const processStoredXssFastScan = async (url, href) => {
  let redirectUrl = null;
  let triggeredUrl = null;  // XSS가 트리거된 URL

  const forms = await findFormTagsForStoredXssFastScan(url, href);
  for (const form of forms) {
      redirectUrl = await submitPostForStoredXssFastScan(form); 
      
      if (redirectUrl) {
          const fullRedirectUrl = urlModule.resolve(href, redirectUrl);
          const isXssTriggered = await checkAlertTriggeredInBrowser(fullRedirectUrl, "xss test");

          if (isXssTriggered) {
              triggeredUrl = fullRedirectUrl;  // URL 저장
              break;  // URL을 찾았으므로 반복 종료
          }
      }
  }

  return triggeredUrl;  // XSS가 트리거된 URL 반환
};





//input 태그 찾는 로직 추가해야됨, front: 데이터 넘어가면 result 페이지로 redirect 시켜야됨
const xss_scan = async(req, res) => {
  const currentScanID = await getNewScanID();

  const regexp = /=/g;

  const href = req.body.href;
  const type = req.body.type;
  const option = req.body.option;
  await crawl(href);

  const site_tree = fs.readFileSync('site_tree.txt').toString().split("\n");

  if(type == "reflected"){
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

            headers = response.headers

            for (const field in headers) {
              console.log(`${field}: ${headers[field]}`);
            }

            // console.log(response_header[0].indexOf(':'))


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
    } else if(option == "accurate"){

    for(let i in site_tree){
      const match1 = site_tree[i].indexOf("?");
      const match2 = site_tree[i].indexOf("=");
      const match3 = site_tree[i].match(regexp);
      const match4 = site_tree[i].indexOf("&");

      if(match1 !== -1 && match2 !== -1 && match3 && match3.length < 2 && match4 === -1){
        for (let j in xss_payload_arr) {
          payload = xss_payload_arr[j];

          try {
            let victim_base_url = site_tree[i].substr(0, match2 + 1)
            let victim_url = victim_base_url + payload;
            console.log(victim_url);

            const browser = await puppeteer.launch({headless:'new'});
            const page = await browser.newPage();
    
            if (xss_scan_success_data) {
              scan.create({
                scanID: currentScanID,
                scanType: "Reflected XSS",
                inputURL: href,
                scanURL: victim_base_url,
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
      }
    }
  } 

  }

else if(type === "stored") {
    if(option === "fast") {
        const payload = {
            data: "<script>alert('xss test');</script>"
        };

        const writeUrls = getExactWriteEndingUrls(site_tree);
        
        for (const url of writeUrls) {
            const triggeredUrl = await processStoredXssFastScan(url, href);  // XSS가 트리거된 URL 얻기

            if (triggeredUrl) {
                // 여기서 데이터베이스에 결과를 저장합니다.
                scan.create({
                    scanID: currentScanID,   // 이 변수의 할당 방식을 확인하세요
                    scanType: "Stored XSS",
                    inputURL: href,
                    scanURL: triggeredUrl,
                    scanPayload: payload.data
                });
            }
        }
    }
}
};


//path traversal 취약점 스캔로직
const pathtraversal_scan = async(req, res) => {
  const currentScanID = await getNewScanID();

  const url = req.body.href;
  const path_traversal_payload_arr_linux = "../";
  const path_traversal_payload_arr_windows = "..\\";
  const regexp = /=/g;

  const href = req.body.href;
  const type = req.body.type;
  const option = req.body.option;

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
          let path_traversal_scan_payload_linux = path_traversal_payload_arr_linux.repeat(j + 1) + "etc/passwd"
          let path_traversal_scan_payload_windows = path_traversal_payload_arr_windows.repeat(j + 1) + "Windows\\System32\\drivers\\etc\\hosts"
          let victim_url_linux = site_tree[i].substr(0, match2 + 1) + path_traversal_scan_payload_linux;
          let victim_url_windows = site_tree[i].substr(0, match2 + 1) + path_traversal_scan_payload_windows;

          const response_linux = await new Promise(resolve => {
              http.request(victim_url_linux, resolve).end();
          });
          const status_linux = response_linux.statusCode;

          const response_windows = await new Promise(resolve => {
            http.request(victim_url_windows, resolve).end();
        });
          const status_windows = response_windows.statusCode;
          console.log(victim_url_windows)
          console.log(path_traversal_scan_payload_windows)
          if (status_linux === 200) {   
              scan.create({
              scanID: currentScanID,
              scanType: "Path Traversal",
              inputURL: url,
              scanURL: site_tree[i],
              osInfo: "Linux Server",
              scanPayload: path_traversal_scan_payload_linux
              });
              break;
          }
          else if (status_windows === 200) {
            scan.create({
              scanID: currentScanID,
              scanType: "Path Traversal",
              inputURL: url,
              scanURL: site_tree[i],
              osInfo: "Windows Server",
              scanPayload: path_traversal_scan_payload_windows
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
  const regexp = /=/g;

  const href = req.body.href;
  const type = req.body.type;
  const option = req.body.option;

  await crawl(href);

  const site_tree = fs.readFileSync('site_tree.txt').toString().split("\n");

  for(let i in site_tree){
    const match1 = site_tree[i].indexOf("?");
    const match2 = site_tree[i].indexOf("=");
    const match3 = site_tree[i].match(regexp);
    const match4 = site_tree[i].indexOf("&");
    if(match1 !== -1 && match2 !== -1 && match3 && match3.length < 2 && match4 === -1){
      for (let j in os_command_injection_payload_arr) { 
        const os_command_injection_payload = os_command_injection_payload_arr[j];

        let victim_base_url = site_tree[i].substr(0, match2 + 1)
        let victim_url = victim_base_url + os_command_injection_payload;

        try {
          const response = await axios.get(victim_url);


          // console.log(response.data.includes("<DIR>"))
          if(response.data.includes("root:x:0:0:root:/root:/bin/bash")) {
            os_command_injection_success_data = true;
            os_info_os_command_injection = "Linux Server"
          }

          if (response.data.includes("&lt;DIR&gt;")) {
            os_command_injection_success_data = true;
            os_info_os_command_injection = "Windows Server"
          }
          
          // console.log(os_command_injection_payload)
          // console.log(os_command_injection_success_data)
          // console.log(victim_base_url)
          console.log(response.data)
          if(os_command_injection_success_data) {
            try {
              console.log("status is", response.status)
              await scan.create({
                scanID: currentScanID,
                scanType: "OS Command Injection",
                inputURL: href,
                scanURL: victim_base_url,
                osInfo: os_info_os_command_injection,
                scanPayload: os_command_injection_payload,
              });

              os_command_injection_success_data = false;
            } catch (error) {
              // console.error('Error creating scan of os_command_injection');
              continue;
            }
          }
        } catch (error) {
          // console.error('Error in payload loop of os_command_injection:', error.message);
          continue;
        }
      }
    }
  }
};







module.exports = {
    xss_scan,
    xss_scan_success,
    pathtraversal_scan,
    os_command_injection,
}