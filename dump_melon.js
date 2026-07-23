const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  console.log('브라우저를 열어 멜론 월간 차트 페이지 구조를 가져옵니다...');
  const browser = await puppeteer.launch({ headless: false, args: ['--start-maximized'] });
  const page = await browser.newPage();
  
  // 차트파인더가 아닌 기본 월간차트 페이지로 접속
  await page.goto('https://www.melon.com/chart/month/index.htm?classCd=GN0000', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 3000)); // 로딩 대기
  
  const html = await page.evaluate(() => document.body.innerHTML);
  fs.writeFileSync('C:/Users/minsu/.gemini/antigravity-ide/scratch/tj-random-song/melon_month_body.txt', html, 'utf8');
  
  // 차트파인더 페이지도 혹시 모르니 가져오기
  await page.goto('https://www.melon.com/chart/search/index.htm', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 3000));
  const html2 = await page.evaluate(() => document.body.innerHTML);
  fs.writeFileSync('C:/Users/minsu/.gemini/antigravity-ide/scratch/tj-random-song/melon_search_body.txt', html2, 'utf8');

  console.log('Saved melon_month_body.txt and melon_search_body.txt');
  await browser.close();
})();
