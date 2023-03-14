const axios = require("axios");
const cheerio = require("cheerio");

// { link: string, isExplored: boolean }[]
let links_arr = [];

async function crawl(url, tried = 0) {
  try {
    const response = await axios.get(url);
    const html = response.data;

    const $ = cheerio.load(html);

    const links = $('a[href^="/"]');

    links.each((index, element) => {
      const current = $(element).attr("href");
      if (!links_arr.some((item) => item.link === current)) {
        links_arr.push({ link: current, isExplored: false });
      }
    });

    if (!links_arr.some((item) => !item.isExplored)) {
      return links_arr;
    }

    const crawlPromises = links_arr.map(async (item, index) => {
      if (!item.isExplored) {
        links_arr[index].isExplored = true;
        const result = await crawl(url + item.link, tried++);
        return result;
      }
    });

    const results = await Promise.all(crawlPromises);
    const flattenedResults = results.flat();

    // Filter out duplicate links
    const uniqueLinksArr = flattenedResults.filter((item, index) => {
      return (
        index === flattenedResults.findIndex((obj) => obj.link === item.link)
      );
    });

    return uniqueLinksArr;
  } catch (error) {
    console.error(error);
  }
}

const init = async () => {
  const res = await crawl("http://cuha.cju.ac.kr");
  console.log(res);
};

init();