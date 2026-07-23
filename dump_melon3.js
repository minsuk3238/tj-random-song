const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const fs = require('fs');

(async () => {
  console.log('브라우저를 열어 멜론 월간 차트 달력 UI 구조를 가져옵니다...');
  const browser = await puppeteer.launch({ headless: false, args: ['--start-maximized'] });
  const page = await browser.newPage();
  
  try {
      // 차트파인더(406 에러 발생 페이지) 대신 정상 접속되는 월간 차트 페이지로 접속
      await page.goto('https://www.melon.com/chart/month/index.htm?classCd=GN0000', { waitUntil: 'networkidle2' });
      await new Promise(r => setTimeout(r, 2000));
      
      // 달력 버튼 클릭
      await page.evaluate(() => {
         const btn = document.querySelector('button[title="달력 레이어 팝업"]');
         if(btn) btn.click();
      });
      console.log('달력 버튼 클릭 완료. 2초 대기...');
      await new Promise(r => setTimeout(r, 2000));
      
      const html = await page.evaluate(() => document.body.innerHTML);
      fs.writeFileSync('C:/Users/minsu/.gemini/antigravity-ide/scratch/tj-random-song/melon_calendar_clicked.txt', html, 'utf8');
      console.log('Saved melon_calendar_clicked.txt');
  } catch(e) {
      console.log('에러 발생:', e);
  }
  
  await browser.close();
})();
