const axios = require('axios');
const cheerio = require('cheerio');
const { response } = require('express');

var root_link = [] 

axios({
  url: 'http://cuha.cju.ac.kr',
  method: 'GET',
})
  .then(({data}) => {
    const $ = cheerio.load(data);
    $('a').each(function(index) {
      const href = $(this).attr('href');
        if(!(href.indexOf('/', 0))){
          root_link.push(href);
        };
    });
    console.log(root_link);
  })
  .catch(err => {
    console.error(err);
  });
