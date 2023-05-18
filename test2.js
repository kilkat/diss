const axios = require('axios');
const cheerio = require('cheerio');

// root url 설정
const ROOT_URL = 'http://192.168.222.128:3000';

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
        links.push(ROOT_URL + href);
      }
    });

    console.log(`Found ${links.length} links at ${url}`);

    // 모든 링크에 대해 동시에 crawl을 호출 (DFS)
    await Promise.all(links.map(crawl));

  } catch (error) {
    console.log(`Error in accessing ${url}: `, error.message);
  }
}

crawl(ROOT_URL);
