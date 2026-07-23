const axios = require('axios');
const cheerio = require('cheerio');

async function checkYear(year) {
  try {
    const url = `https://www.genie.co.kr/chart/musicHistory?year=${year}&category=0&month=1&pg=1`;
    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });
    const $ = cheerio.load(res.data);
    const count = $('tr.list').length;
    console.log(`Year ${year}: ${count} songs found`);
  } catch (err) {
    console.log(`Year ${year}: Error ${err.message}`);
  }
}

async function run() {
  const years = [1980, 1985, 1988, 1989, 1990];
  for (const y of years) {
    await checkYear(y);
  }
}

run();
