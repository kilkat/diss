const axios = require('axios');
const cheerio = require('cheerio');

// 웹 크롤링 함수
async function crawl(url, depth) {
  try {
    if (depth < 0) {
      return;
    }

    // 웹 페이지의 HTML 코드 가져오기
    const response = await axios.get(url);
    const html = response.data;

    // HTML 코드 파싱하기
    const $ = cheerio.load(html);

    // 웹 페이지에서 href 속성이 있는 모든 a 태그 추출하기
    const links = $('a[href^="/"]');

    // a 태그 출력하기
    console.log('===', url, '===');
    links.each((index, element) => {
      console.log($(element).attr('href'));
    });
    console.log();

    // 재귀적으로 웹 페이지 크롤링하기
    for (let i = 0; i < links.length; i++) {
      const link = $(links[i]);
      const href = link.attr('href');

      // 상대 경로를 절대 경로로 변환하기
      const absoluteUrl = new URL(href, url).href;

      await crawl(absoluteUrl, depth - 1);
    }
  } catch (error) {
    console.error(error);
  }
}

// 크롤링 시작하기
crawl('http://cuha.cju.ac.kr', 10);