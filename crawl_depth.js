const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const urlLib = require('url');

let visited = {};

const crawl = async (url) => {
  visited = {}; // Reset the visited object each time you crawl
  fs.writeFileSync('site_tree.txt', ''); // Clear the site_tree file each time you crawl

  await crawlUrl(url);
};

const crawlUrl = async (url) => {
  if (visited[url]) {
    return;
  }

  try {
    const response = await axios.get(url);
    visited[url] = true;

    const $ = cheerio.load(response.data);
    let links = [];

    $('a').each((index, element) => {
      let href = $(element).attr('href');
      let fullUrl = urlLib.resolve(url, href);
      links.push(fullUrl);
    });

    console.log(`Found ${links.length} links at ${url}`);
    await Promise.all(links.map(crawlUrl));
    saveUrl(url);

  } catch (error) {
    console.log(`Error in accessing ${url}: `, error.message);
    saveUrl(url);
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
