const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const crawl = async (url) => {
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
      if (href.startsWith('/')) {
        links.push(url + href);
      }
    });

    console.log(`Found ${links.length} links at ${url}`);
    await Promise.all(links.map(crawl));
    saveUrl(url);

  } catch (error) {
    console.log(`Error in accessing ${url}: `, error.message);
    saveUrl(url);
  }
};

let visited = {};
// await crawl(url);

function saveUrl(url) {
  const urlWithNewLine = url + '\n';
  fs.appendFileSync('site_tree.txt', urlWithNewLine, (err) => {
    if (err) {
      console.error('Error in saving site tree:', err);
    }
  });
}

module.exports = crawl;