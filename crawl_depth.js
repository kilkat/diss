const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const urlLib = require('url');

let visited = {};

const crawl = async (url) => {
  visited = {};
  fs.writeFileSync('site_tree.txt', '');

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

      // originUrl과 현재 페이지 URL에서만 링크를 추가
      if (fullUrl.startsWith(originUrl) || fullUrl === currentUrl) {
        links.push(fullUrl);
      }
    });

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

module.exports = crawl;