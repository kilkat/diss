const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

// 크롤링할 웹사이트의 시작 URL
const startUrl = 'https://hive.cju.ac.kr/common/greeting.do';
// 최대 탐색 깊이
const maxDepth = 10;
// 결과를 저장할 파일명
const outputFileName = 'result.txt';

// 방문한 URL을 저장할 Set 객체
const visitedUrls = new Set();

// 깊이 우선 탐색(Depth First Search) 함수
async function crawl(url, depth) {
  try {
    // 이미 방문한 URL이라면 종료
    if (visitedUrls.has(url)) {
      return;
    }

    // URL 방문 체크
    visitedUrls.add(url);

    // HTTP GET 요청으로 HTML 문서 가져오기
    const response = await axios.get(url);
    if (response.status === 200) {
      const html = response.data;

      // Cheerio를 사용하여 HTML 문서를 파싱
      const $ = cheerio.load(html);

      // 원하는 정보를 추출하거나 다음 링크를 찾는 작업 수행

      // 예시: 다음 링크 탐색
      $('a').each((index, element) => {
        const href = $(element).attr('href');
        if (href && href.startsWith('/')) {
          const absoluteUrl = new URL(href, url).href;
          if (depth < maxDepth) {
            crawl(absoluteUrl, depth + 1);
          }
        }
      });
    } else {
      console.log(`Error: Failed to fetch URL (${response.status}) - ${url}`);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// 크롤링 시작
crawl(startUrl, 1)
  .then(() => {
    // Set 객체를 배열로 변환하여 파일로 저장
    const urlsArray = Array.from(visitedUrls);
    const urlsString = urlsArray.join('\n');
    fs.writeFileSync(outputFileName, urlsString);
    console.log(`Visited URLs saved to ${outputFileName}`);
  })
  .catch((error) => {
    console.error('Error:', error);
  });
