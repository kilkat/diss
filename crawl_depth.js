const axios = require('axios');
const cheerio = require('cheerio');
const urlLib = require('url');

let visited = {};

const crawl = async (url) => {
  visited = {};

  await crawlUrl(url);
  return visited;
};

const crawlUrl = async (url) => {
  if (visited[url]) {
    return;
  }

  let links; // links 변수를 선언

  try {
    const response = await axios.get(url);
    visited[url] = true;

    const $ = cheerio.load(response.data);
    links = []; // links 변수 초기화

    $('a').each((index, element) => {
      let href = $(element).attr('href');
      let fullUrl = urlLib.resolve(url, href);
      links.push(fullUrl);
    });

    console.log(`Found ${links.length} links at ${url}`);
    await Promise.all(links.map(crawlUrl));

  } catch (error) {
    console.log(`Error in accessing ${url}: `, error.message);
    visited[url] = true;
    if (links) {
      await Promise.all(links.map(link => crawlUrl(link)));
    }
  }
};

module.exports = crawl;
