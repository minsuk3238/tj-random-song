const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

(async () => {
  const browser = await puppeteer.launch({headless: false, args: ['--start-maximized']});
  const page = await browser.newPage();
  
  await page.goto('https://www.melon.com/chart/search/index.htm', {waitUntil: 'networkidle2'});

  await page.waitForSelector('.ui-select');

  const songs = await page.evaluate(async () => {
     // click 월간차트
     document.querySelector('label[for="month"]').click();
     
     await new Promise(r => setTimeout(r, 500));
     
     // click 2023년
     const years = Array.from(document.querySelectorAll('.box_scroll .list_control li'));
     const y2023 = years.find(el => el.textContent.includes('2023년'));
     if(y2023) y2023.click();
     await new Promise(r => setTimeout(r, 500));

     // click 05월
     const months = Array.from(document.querySelectorAll('.box_scroll .list_control li'));
     const m05 = months.find(el => el.textContent.includes('05월'));
     if(m05) m05.click();
     await new Promise(r => setTimeout(r, 500));

     // click 장르종합
     const genres = Array.from(document.querySelectorAll('.box_scroll .list_control li'));
     const genre = genres.find(el => el.textContent.includes('장르종합'));
     if(genre) genre.click();
     await new Promise(r => setTimeout(r, 500));

     // click 검색
     document.querySelector('.btn_b26').click();
     await new Promise(r => setTimeout(r, 3000));

     const rows = document.querySelectorAll('tbody tr');
     const data = [];
     rows.forEach(row => {
       const titleEl = row.querySelector('.ellipsis.rank01 a, .ellipsis span a');
       const artistEl = row.querySelector('.ellipsis.rank02 a, .ellipsis.rank02 span a');
       if (titleEl && artistEl) {
         data.push(titleEl.innerText.trim() + ' - ' + artistEl.innerText.trim());
       }
     });
     return data.slice(0, 5);
  });
  console.log('Songs found via Chart Finder UI click:', songs);
  await browser.close();
})();
