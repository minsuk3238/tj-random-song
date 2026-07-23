const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

(async () => {
  const browser = await puppeteer.launch({headless: false, args: ['--start-maximized']});
  const page = await browser.newPage();
  
  // Test month hash url for 2017 Jan (Downpour was released then, wait, Ailee's I will go to you like the first snow was #1)
  const url = 'https://www.melon.com/chart/month/index.htm?classCd=GN0000#params[idx]=1&params[rankMonth]=201701';
  await page.goto(url, {waitUntil: 'networkidle2'});
  
  // wait a bit for AJAX
  await new Promise(r => setTimeout(r, 4000));

  const extractedSongs = await page.evaluate(() => {
    const rows = document.querySelectorAll('tbody tr');
    const data = [];
    rows.forEach(row => {
      const titleEl = row.querySelector('.ellipsis.rank01 a, .ellipsis span a');
      const artistEl = row.querySelector('.ellipsis.rank02 a, .ellipsis.rank02 span a');
      if (titleEl && artistEl) {
        data.push(titleEl.innerText.trim() + ' - ' + artistEl.innerText.trim());
      }
    });
    return data.slice(0, 3);
  });
  console.log('Songs for 2017-01:', extractedSongs);
  await browser.close();
})();
