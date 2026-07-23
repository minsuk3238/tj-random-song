const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const fs = require('fs');

(async () => {
  console.log('브라우저를 열어 멜론 월간 차트 UI 구조를 가져옵니다...');
  const browser = await puppeteer.launch({ headless: false, args: ['--start-maximized'] });
  const page = await browser.newPage();
  
  await page.goto('https://www.melon.com/chart/search/index.htm', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  
  // 1. "월간차트" 탭 클릭
  await page.evaluate(() => {
     document.querySelector('h4.tab02 a').click();
  });
  console.log('월간차트 탭 클릭 완료. 3초 대기...');
  await new Promise(r => setTimeout(r, 3000));
  
  // 2. 연대(Decade) 클릭 (2010년대)
  // 구조를 모르므로 일단 전체 HTML을 저장
  const html = await page.evaluate(() => document.body.innerHTML);
  fs.writeFileSync('C:/Users/minsu/.gemini/antigravity-ide/scratch/tj-random-song/melon_search_clicked.txt', html, 'utf8');
  
  console.log('Saved melon_search_clicked.txt');
  await browser.close();
})();
