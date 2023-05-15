const axios = require('axios');
const cheerio = require('cheerio');

// 크롤링할 웹사이트의 시작 URL
const startUrl = 'http://localhost';

// 방문한 URL을 저장할 Set 객체
const visitedUrls = new Set();

// 깊이 우선 탐색(Depth First Search) 함수
async function crawl(url) {
  try {
    // 이미 방문한 URL이라면 종료
    if (visitedUrls.has(url)) {
      return;
    }

    // URL 방문 체크
    visitedUrls.add(url);

    // HTTP GET 요청으로 HTML 문서 가져오기
    const response = await axios.get(url);
    const html = response.data;

    // Cheerio를 사용하여 HTML 문서를 파싱
    const $ = cheerio.load(html);

    // 원하는 정보를 추출하거나 다음 링크를 찾는 작업 수행

    // 예시: 다음 링크 탐색
    $('a').each((index, element) => {
      const href = $(element).attr('href');
      if (href && href.startsWith('/')) {
        const absoluteUrl = new URL(href, url).href;
        console.log(absoluteUrl);
        crawl(absoluteUrl);
      }
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

// 크롤링 시작
crawl(startUrl);