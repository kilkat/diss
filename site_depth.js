const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const startUrl = 'https://hive.cju.ac.kr/common/greeting.do';

const maxDepth = 10;

const outputFileName = 'result.txt';

const visitedUrls = new Set();

async function crawl(url, depth) {
  while(true){

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
      // console.error('Error:', error);
    }

    break;

  }
}

crawl(startUrl, 1)
  .then(() => {
    const urlsArray = Array.from(visitedUrls);
    const urlsString = urlsArray.join('\n');
    fs.writeFileSync(outputFileName, urlsString);
    console.log(`Visited URLs saved to ${outputFileName}`);
  })
  .catch((error) => {
    console.error('Error:', error);
  });
