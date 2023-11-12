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
const { performance } = require('perf_hooks');

const resultController = require("../controllers/result.ctrl");


const reflected_xss_payload_arr = fs.readFileSync('reflected_xss_payload.txt').toString().split("\n");
const xss_fast_scan_payload = fs.readFileSync('xss_fast_scan_payload.txt').toString().split("\n");
const os_command_injection_payload_arr = fs.readFileSync('os_command_injection_payload.txt').toString().split("\n");
const stored_xss_payload_arr = fs.readFileSync('stored_xss_payload.txt').toString().split("\n");
const sql_injection_payload = fs.readFileSync('sql_injection_payload.txt').toString().split("\n");

scan_cancel_bool = false

const scan_cancel = async(req, res) =>  {
  scan_cancel_bool = true;
  return scan_cancel_bool
}

let scanID = 0;

let xss_scan_success_data = false;

const xss_scan_success = async(req, res) => {

  xss_scan_success_data = true;
  res.json({ success: xss_scan_success_data});
}

let stored_xss_scan_success_data = false;

const stored_xss_scan_success = async(req, res) => {
  stored_xss_scan_success_data = true;
  res.json({ success: stored_xss_scan_success_data });
}

os_command_injection_success_data = false



const getNewScanID = async () => {
  return new Promise(async (resolve, reject) => {
    try {
      const lastScan = await scan.findOne({
        order: [['scanID', 'DESC']],
      });

      const lastScanID = lastScan ? lastScan.scanID : 0;
      resolve(lastScanID + 1);
    } catch (error) {
      reject(error);
    }
  });
};


const findFormTagsForStoredXssFastScan = async (url, href, payload) => {
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
              formData[inputName] = payload;
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


const  submitPostForStoredXssFastScan = async (form) => {
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

const processStoredXssFastScan = async (url, href) => {
  const triggeredPayloads = [];
  const forms = await findFormTagsForStoredXssFastScan(url, href);
  
  for (const form of forms) {
      for (const payload of xss_fast_scan_payload) {
          form.data = Object.fromEntries(
              Object.entries(form.data).map(([key, value]) => [key, payload])
          );
          const redirectUrl = await submitPostForStoredXssFastScan(form); 

          if (redirectUrl) {
              const fullRedirectUrl = urlModule.resolve(href, redirectUrl);
              const response = await axios.get(fullRedirectUrl);

              if(response.data.includes(payload)) {
                  triggeredPayloads.push({url: fullRedirectUrl, payload});
              }
          }
      }
  }

  return triggeredPayloads;
};



const findFormTagsForSqlInjectionScan = async (url, href, payloads) => {
  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    const forms = [];
    $('form').each((index, element) => {
      const action = $(element).attr('action') || '';
      const method = $(element).attr('method') || 'get';

      payloads.forEach((payload) => {
        const formData = {};
        $(element).find('input[name], textarea[name], select[name]').each((i, inputElement) => {
          const inputName = $(inputElement).attr('name');
          formData[inputName] = payload;
        });

        forms.push({
          url: href + action,
          method,
          data: formData
        });
      });
    });

    return forms;
  } catch (error) {
    console.error(`Failed to fetch and parse URL ${url}: ${error.message}`);
    return [];
  }
};

const sendRequest = async (url, method, data) => {
  const startTime = performance.now();

  try {
    const options = {
      method: method,
      url: url,
      data: data,
      timeout: 2000,
    };

    const response = await axios(options);
    const endTime = performance.now();

    return {
      time: endTime - startTime,
      body: response.data,
      statusCode: response.status,
      headers: response.headers
    };

  } catch (error) {
    const endTime = performance.now();

    const isTimeout = error.code === 'ECONNABORTED';
    const timeoutMessage = isTimeout ? 'The request timed out after 2 seconds' : error.message;

    return {
      time: endTime - startTime,
      message: timeoutMessage,

      statusCode: error.response ? error.response.status : null,
      headers: error.response ? error.response.headers : null,
      body: error.response ? error.response.data : null
    };
  }
};






const xss_scan = async(req, res) => {
  const currentScanID = await getNewScanID();
  scan_cancel_bool = false

  const regexp = /=/g;

  const href = req.body.href;
  const type = req.body.type;
  const option = req.body.option;
  const userEmail = req.email;
  await crawl(href);

  const site_tree = fs.readFileSync('site_tree.txt').toString().split("\n");
  const form_site_tree = fs.readFileSync('form_test.txt').toString().split("\n");

  if(type == "reflection"){
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

          if (scan_cancel_bool == true) {
            return;
          }

          if(body.includes(payload)){
            scan.create({
              scanID: currentScanID,
              scanUserEmail: userEmail,
              scanType: "Fast Scan Reflected XSS",
              inputURL: href,
              scanURL: victim_base_url,
              scanPayload: payload
            });
            // res.redirect("http://127.0.0.1")
          }
        });
      }
    }
  } else if (option == "accurate") {
    for (let i in site_tree) {
        const match1 = site_tree[i].indexOf("?");
        const match2 = site_tree[i].indexOf("=");
        const match3 = site_tree[i].match(regexp);
        const match4 = site_tree[i].indexOf("&");

        if (match1 !== -1 && match2 !== -1 && match3 && match3.length < 2 && match4 === -1) {
            for (let payload of reflected_xss_payload_arr) {
                try {
                    let victim_base_url = site_tree[i].substr(0, match2 + 1);
                    let victim_url = victim_base_url + payload;
                    console.log(victim_url);

                    const browser = await puppeteer.launch({ headless: 'new' });
                    const page = await browser.newPage();

                    page.on('request', request => {
                        if (request.url() == "http://127.0.0.1/scan_reflected_injection_success") {
                            xss_scan_success_data = true;
                        }
                    });

                    await page.setDefaultNavigationTimeout(10000);
                    await page.goto(victim_url);
                    await browser.close();

                    if (scan_cancel_bool == true) {
                      return;
                    }

                    if (xss_scan_success_data) {
                        await scan.create({
                            scanID: currentScanID,
                            scanUserEmail: userEmail,
                            scanType: "Reflected XSS",
                            inputURL: href,
                            scanURL: victim_base_url,
                            scanPayload: payload
                        });

                        xss_scan_success_data = false;
                        break;
                    }
                } catch (error) {
                    continue;
                }
            }
        }
    }
}


  }

  else if (type === "stored") {
    
    if (option === "fast") {
        for (const url of form_site_tree) {
            const triggeredPayloads = await processStoredXssFastScan(url, href);
  
            for (const payloadData of triggeredPayloads) {

              if (scan_cancel_bool == true) {
                return;
              }

              await scan.create({
                  scanID: currentScanID,
                  scanUserEmail: userEmail,
                  scanType: "Fast Scan Stored XSS",
                  inputURL: href,
                  scanURL: payloadData.url,
                  scanPayload: payloadData.payload
              });
            }
        }
    }

    else if (option == "accurate") {

      for (const payload of stored_xss_payload_arr) {

      try {
        const axios = require('axios');
        const cheerio = require('cheerio');
        const puppeteer = require('puppeteer');
        for (const url of form_site_tree) {
          const response = await axios.get(url);
        const html = response.data;
    
        if (scan_cancel_bool == true) {
          return;
        }

        const $ = cheerio.load(html);
        const forms = [];
    
        $('form').each((index, element) => {
          const action = $(element).attr('action') || url;
          const method = $(element).attr('method') || 'GET';
          const inputs = {};
    
          $(element).find('input[name]').each((i, inputElem) => {
            const inputName = $(inputElem).attr('name');
            inputs[inputName] = payload;
          });
    
          $(element).find('textarea[name]').each((i, textareaElem) => {
            const textareaName = $(textareaElem).attr('name');
            inputs[textareaName] = payload;
          });
    
          forms.push({ action, method, data: inputs });
        });

        for (const form of forms) {
          for (const payload of stored_xss_payload_arr) {
            const browser = await puppeteer.launch({ 
              headless: 'new',
              args: ['--no-sandbox', '--disable-setuid-sandbox'] 
            });
            const page = await browser.newPage();
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 0 });

            for (const [key, value] of Object.entries(form.data)) {
              const selector = `[name="${key}"]`;
              try {
                const selector = `[name="${key}"]`;
                await page.waitForSelector(selector, { visible: true, timeout: 5000 });
                await page.type(selector, value);
              } catch (error) {
                console.error(`Error typing into ${selector}:`, error);
              }
            }

            await Promise.all([
              page.click(`form[action="${form.action}"] [type="submit"]`),
              page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 0 }),
            ]);

            const redirectUrl = response.url();

            await browser.close();

            const browserRedirectCheck = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
            const pageRedirectCheck = await browserRedirectCheck.newPage();

            await pageRedirectCheck.goto(redirectUrl, { waitUntil: 'networkidle2', timeout: 0 });

            const finalUrl = pageRedirectCheck.url();
            await browserRedirectCheck.close();

            console.log(pageRedirectCheck.url)
            console.log(stored_xss_scan_success_data)

            if (scan_cancel_bool == true) {
              return;
            }

            console.log(url)

            if (stored_xss_scan_success_data) {
              try {
                await scan.create({
                    scanID: currentScanID,
                    scanType: "Stored XSS",
                    inputURL: href,
                    scanURL: redirectUrl,
                    scanPayload: payload
                });
                stored_xss_scan_success_data = false;
            } catch (error) {
                console.error("Error while saving to database:", error);
            }
              stored_xss_scan_success_data = false;
              break;
            }
          }
          }
          } 
          

      } catch (error) {
        console.error("Error in accurate scanning:", error);
      }
    }
  }
  }
}

const pathtraversal_scan = async(req, res) => {
  const currentScanID = await getNewScanID();
  scan_cancel_bool = false

  const url = req.body.href;
  const path_traversal_payload_arr_linux = "../";
  const path_traversal_payload_arr_windows = "..\\";
  const regexp = /=/g;

  const href = req.body.href;
  const type = req.body.type;
  const option = req.body.option;
  const userEmail = req.email;

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

          if (scan_cancel_bool == true) {
            return;
          }

          if (status_linux === 200) {   
              scan.create({
              scanID: currentScanID,
              scanUserEmail: userEmail,
              scanType: "Path Traversal",
              inputURL: url,
              scanURL: site_tree[i],
              osInfo: "Linux Server",
              scanPayload: path_traversal_scan_payload_linux
              });
              break;
          }

          if (scan_cancel_bool == true) {
            return;
          }

          else if (status_windows === 200) {
            scan.create({
              scanID: currentScanID,
              scanUserEmail: userEmail,
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
  scan_cancel_bool = false
  const regexp = /=/g;

  const href = req.body.href;
  const type = req.body.type;
  const option = req.body.option;
  const userEmail = req.email;

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


          if(response.data.includes("root:x:0:0:root:/root:/bin/bash")) {
            os_command_injection_success_data = true;
            os_info_os_command_injection = "Linux Server"
          }

          if (response.data.includes("&lt;DIR&gt;")) {
            os_command_injection_success_data = true;
            os_info_os_command_injection = "Windows Server"
          }

          if (scan_cancel_bool == true) {
            return;
          }
          
          console.log(response.data)
          if(os_command_injection_success_data) {
            try {
              console.log("status is", response.status)
              await scan.create({
                scanID: currentScanID,
                scanUserEmail: userEmail,
                scanType: "OS Command Injection",
                inputURL: href,
                scanURL: victim_base_url,
                osInfo: os_info_os_command_injection,
                scanPayload: os_command_injection_payload,
              });

              os_command_injection_success_data = false;
              break;
            } catch (error) {
              console.error('Error creating scan of os_command_injection');
              continue;
            }
          }
        } catch (error) {
          console.error('Error in payload loop of os_command_injection:', error.message);
          continue;
        }
      }
    }
  }
};


const sql_injection_scan = async (req, res) => {
  const currentScanID = await getNewScanID();
  const href = req.body.href;
  const userEmail = req.email;

  await crawl(href);

  const formUrls = fs.readFileSync('form.txt').toString().split("\n");

  for (const url of formUrls) {
    const forms = await findFormTagsForSqlInjectionScan(url, href, sql_injection_payload);

    for (const form of forms) {

      // Test scan without payload
      const startTestTime = performance.now();
      const response_test = await sendRequest(form.url, form.method, {});
      const endTestTime = performance.now();
      const testScanDuration = endTestTime - startTestTime;

      if (scan_cancel_bool == true) {
        return;
      }

      console.log(url)

      if (response_test.statusCode !== 200) {
        console.error("Failed to send request:", response_test.message);
        continue;
      }

      for (const payload of sql_injection_payload) {
        const dataWithPayload = { ...form.data };
        for (const inputName in dataWithPayload) {
          dataWithPayload[inputName] = payload;
        }

        const startAttackTime = performance.now();
        const response_scan = await sendRequest(form.url, form.method, dataWithPayload);
        const endAttackTime = performance.now();
        const attackScanDuration = endAttackTime - startAttackTime;

        const durationDifference = attackScanDuration - testScanDuration;

        if (scan_cancel_bool == true) {
          return;
        }

        if (durationDifference > 1000) {
          await scan.create({
            scanID: currentScanID,
            scanUserEmail: userEmail,
            scanType: "SQL Injection",
            inputURL: href,
            scanURL: form.url,
            scanPayload: payload,
            durationDifference: durationDifference
          });
          return;
        }
      }
    }
  }

  return res.status(200).send('SQL Injection scan completed.');
};







module.exports = {
    xss_scan,
    xss_scan_success,
    stored_xss_scan_success,
    pathtraversal_scan,
    os_command_injection,
    scan_cancel,
    sql_injection_scan,
}