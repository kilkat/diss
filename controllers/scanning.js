const fs = require('fs');
const readline = require('readline');
const open = require('open');
const { chromium } = require('playwright');

const array = fs.readFileSync('payload.txt').toString().split("\n");

const scanning = async(req, res) => {
    const url = req.body.href;
    const timeout = 30000;
    
    try {
        // 브라우저 인스턴스 생성
        const browser = await chromium.launch();
        
        // 새로운 Context 인스턴스 생성
        const context = await browser.newContext();
        
        // 새로운 Page 인스턴스 생성
        const page = await context.newPage();
        
        // 페이지 로딩 완료시까지 대기
        page.on('load', () => console.log('Page loaded!'));
        page.on('error', err => console.log(`Error occured: ${err}`));

        for (let i in array) {
            let victim_url = url + array[i];
            console.log(victim_url);

            // 페이지 이동
            await page.goto(victim_url, {timeout: timeout, waitUntil: 'domcontentloaded'});

            // 일정 시간 후 브라우저 종료
            await page.waitForTimeout(5000);
        }

        // 브라우저 종료
        await browser.close();
        console.log('Browser closed!');
    } catch (error) {
        console.error(error);
    }
};

const count = async(req, res) => {
    let cnt = 0;
    console.log(cnt);
    cnt += 1;
    console.log(cnt);
}

module.exports = {
    scanning,
    count,
}