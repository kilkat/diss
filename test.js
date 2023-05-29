const fs = require('fs');

const site_tree = fs.readFileSync('site_tree.txt').toString().split('\n');

for (let i in site_tree) {
  try {
    let target_url = site_tree[i];
    const regex = /[?=]/g;
    const matches = target_url.match(regex);

    if (matches) {
      const positions = [];
      matches.forEach(match => {
        const position = target_url.indexOf(match);
        positions.push(position);
      });
      console.log(positions);
    }
  } catch (error) {
    continue;
  }
}
