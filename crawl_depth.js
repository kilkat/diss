const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const urlLib = require('url');

let visited = {};

const crawl = async (url) => {
  visited = {};
  fs.writeFileSync('site_tree.txt', '');
  fs.writeFileSync('form_textarea.txt', '');  // form_textarea.txt 파일 초기화

  await crawlUrl(url);
};

const crawlUrl = async (originUrl, currentUrl = originUrl) => {
  if (visited[currentUrl]) {
    return;
  }

  try {
    const response = await axios.get(currentUrl, { maxRedirects: 0 });
    visited[currentUrl] = true;

    const $ = cheerio.load(response.data);
    let links = [];

    $('a').each((index, element) => {
      let href = $(element).attr('href');
      let fullUrl = urlLib.resolve(currentUrl, href);

      if (fullUrl.startsWith(originUrl) || fullUrl === currentUrl) {
        links.push(fullUrl);
      }
    });

    // <form> 태그 내의 <textarea> 태그 검사
    if ($('form textarea').length > 0) {
      saveFormWithTextAreaUrl(currentUrl);
    }

    console.log(`Found ${links.length} links at ${currentUrl}`);
    await Promise.all(links.map(link => crawlUrl(originUrl, link)));
    saveUrl(currentUrl);

  } catch (error) {
    console.log(`Error in accessing ${currentUrl}: `, error.message);
    saveUrl(currentUrl);
  }
};

const saveUrl = (url) => {
  const urlWithNewLine = url + '\n';
  fs.appendFileSync('site_tree.txt', urlWithNewLine, (err) => {
    if (err) {
      console.error('Error in saving site tree:', err);
    }
  });
}

const saveFormWithTextAreaUrl = (url) => {
  const urlWithNewLine = url + '\n';
  fs.appendFileSync('form_textarea.txt', urlWithNewLine, (err) => {
    if (err) {
      console.error('Error in saving form textarea url:', err);
    }
  });
};

module.exports = crawl;
