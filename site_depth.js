const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

let visited = {};

async function crawl(url) {
  // 이미 방문한 페이지는 무시
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

      // 모든 링크에 대해 동시에 crawl을 호출 (DFS)
      await Promise.all(links.map(crawl));

      // URL 저장
      saveUrl(url);

    } catch (error) {
      console.log(`Error in accessing ${url}: `, error.message);
      // 실패한 URL 저장
      saveUrl(url);
    }
}

function saveUrl(url) {
  const urlWithNewLine = url + '\n';
  fs.appendFile('site_tree.txt', urlWithNewLine, (err) => {
    if (err) {
      console.error('Error in saving site tree:', err);
    }
  });
}

module.exports = crawl;