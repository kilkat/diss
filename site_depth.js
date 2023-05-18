const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const maxDepth = 2;

const outputFileName = 'site_tree.txt';

const visitedUrls = new Set();

async function crawl(url, depth) {
  while (true) {
    try {
      if (visitedUrls.has(url)) {
        return;
      }

      visitedUrls.add(url);

      const response = await axios.get(url);
      if (response.status === 200) {
        const html = response.data;

        const $ = cheerio.load(html);

        $('a').each((index, element) => {
          const href = $(element).attr('href');
          if (href && href.startsWith('/')) {
            const absoluteUrl = new URL(href, url).href;
            if (depth < maxDepth) {
              crawl(absoluteUrl, depth + 1);
            }
          }
        });
      }
    } catch (error) {
      continue;
    }

    break;
  }
}

module.exports = {
  crawl: crawl,
  saveVisitedUrls: function (fileName) {
    const urlsArray = Array.from(visitedUrls);
    const urlsString = urlsArray.join('\n');
    fs.writeFileSync(fileName, urlsString);
    console.log(`Visited URLs saved to ${fileName}`);
  },
};
