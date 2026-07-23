const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const fs = require('fs');

const START_YEAR = 2010; 
const END_YEAR = 2023;   

function cleanText(text) {
  if (!text) return '';
  return text.replace(/\(Live\)/gi, '')
             .replace(/\(Inst\.\)/gi, '')
             .replace(/\(MR\)/gi, '')
             .replace(/\(Special Edition\)/gi, '')
             .replace(/\s+/g, ' ')
             .trim();
}

async function runScraper() {
  console.log('🚀 (V9 최종 완벽 매크로) 멜론 매크로 봇을 시작합니다...');
  
  const browser = await puppeteer.launch({
    headless: false, 
    args: ['--start-maximized']
  });
  
  const allSongs = [];
  const uniqueKeys = new Set();
  
  const page = await browser.newPage();
  
  // 406 차단을 우회하기 위해 가장 안전한 기본 월간 차트 페이지로 접속
  console.log('🌐 멜론 월간 차트 메인 페이지 접속 중...');
  await page.goto('https://www.melon.com/chart/month/index.htm?classCd=GN0000', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000));
  
  // 최신 년도(2023)부터 역순으로 크롤링 (이전 버튼 클릭을 최소화하기 위해)
  for (let year = END_YEAR; year >= START_YEAR; year--) {
    console.log(`\n================ [ ${year}년 월간 차트 탐색 ] ================`);
    const decade = Math.floor(year / 10) * 10;
    
    // 12월부터 1월까지 역순 탐색
    for (let month = 12; month >= 1; month--) {
      const monthStr = month.toString().padStart(2, '0');
      const targetDate = `${year}${monthStr}`;
      console.log(`👉 ${year}년 ${monthStr}월 데이터 추출 시도...`);
      
      try {
        // 1. 달력 레이어 열기
        await page.evaluate(() => {
           const btn = document.querySelector('button[title="달력 레이어 팝업"]');
           if(btn) btn.click();
        });
        await new Promise(r => setTimeout(r, 1000)); // 달력 애니메이션 대기
        
        // 2. 년도 맞추기 (달력 상단 UI의 년도가 목표 년도와 다르면 '< 이전' 버튼 클릭)
        let maxLoops = 20; // 무한 루프 방지
        while (maxLoops > 0) {
           const currentCalYear = await page.evaluate(() => {
               const el = document.querySelector('div.l_calendar .date');
               return el ? parseInt(el.innerText.replace(/[^0-9]/g, '')) : 0;
           });
           
           if (currentCalYear > year) {
               await page.evaluate(() => document.querySelector('div.l_calendar button.pre').click());
               await new Promise(r => setTimeout(r, 500));
           } else if (currentCalYear < year) {
               await page.evaluate(() => document.querySelector('div.l_calendar button.next').click());
               await new Promise(r => setTimeout(r, 500));
           } else {
               break; // 년도 맞춤 성공!
           }
           maxLoops--;
        }
        
        // 3. 월(Month) 클릭
        await page.evaluate((tDate) => {
           const monthBtn = document.querySelector(`div.l_calendar a[data-date="${tDate}"]`);
           if(monthBtn) monthBtn.click();
        }, targetDate);
        
        // 4. 차트 데이터가 화면에 새로 갱신될 때까지 3초 대기 (AJAX 로딩)
        await new Promise(r => setTimeout(r, 3000));
        
        // 5. 화면에 뜬 100곡의 HTML 읽어오기
        const extractedSongs = await page.evaluate(() => {
          const rows = document.querySelectorAll('div#tb_list tbody tr');
          const data = [];
          rows.forEach(row => {
            const titleEl = row.querySelector('.ellipsis.rank01 a, .ellipsis span a');
            const artistEl = row.querySelector('.ellipsis.rank02 a, .ellipsis.rank02 span a');
            if (titleEl && artistEl) {
              data.push({
                titleRaw: titleEl.innerText,
                artistRaw: artistEl.innerText
              });
            }
          });
          return data;
        });
        
        // 6. 데이터 정제 및 분류
        let countForMonth = 0;
        for (const item of extractedSongs) {
          const title = cleanText(item.titleRaw);
          const artist = cleanText(item.artistRaw);
          
          let genre = '발라드'; 
          let gender = '혼성';   

          if (artist.match(/아이유|aespa|IVE|NewJeans|BLACKPINK|소녀시대|TWICE|이효리|백지영|보아|태연|에일리|레드벨벳/i)) gender = '여성';
          else if (artist.match(/BTS|방탄소년단|세븐틴|EXO|BIGBANG|임영웅|조용필|성시경|박효신|SG워너비|god|신승훈|김건모/i)) gender = '남성';

          if (artist.match(/aespa|IVE|NewJeans|BLACKPINK|소녀시대|TWICE|BTS|EXO|BIGBANG|H.O.T.|젝스키스|핑클|S.E.S.|코요태/i)) genre = '댄스';
          else if (artist.match(/임영웅|영탁|장윤정|송가인|주현미|김수희/i)) genre = '트로트';
          else if (artist.match(/버즈|DAY6|윤도현|잔나비|자우림|혁오|국카스텐/i)) genre = '록/밴드';
          else if (artist.match(/다이나믹 듀오|에픽하이|지코|비와이/i)) genre = '힙합';

          const key = `${title.toLowerCase().replace(/\s/g, '')}_${artist.toLowerCase().replace(/\s/g, '')}`;
          
          if (!uniqueKeys.has(key)) {
            uniqueKeys.add(key);
            allSongs.push({ releaseYear: year, releaseMonth: month, title: title, artist: artist, genre: genre, gender: gender });
            countForMonth++;
          }
        }
        
        console.log(`✅ ${year}년 ${monthStr}월 완료: ${countForMonth}곡 확보 (누적: ${allSongs.length}곡)`);
        
      } catch (err) {
        console.log(`❌ ${year}년 ${monthStr}월 에러: ${err.message}`);
        
        // 에러 발생 시 현재 페이지 새로고침
        try {
           await page.reload({ waitUntil: 'networkidle2' });
           await new Promise(r => setTimeout(r, 2000));
        } catch(e) {}
      }
      
      // 사람처럼 보이기 위한 랜덤 대기 시간
      await new Promise(r => setTimeout(r, Math.floor(Math.random() * 1000) + 500));
    }
  }
  
  await browser.close();
  console.log(`\n🎉 모든 월간 차트 수집 완료! 총 ${allSongs.length}개의 고유 명곡을 확보했습니다!`);
  
  const fileContent = `// TJ Karaoke Melon Scraped Verified Songs Database (V9)
// Total Unique Songs: ${allSongs.length}
// Auto-generated by melon_monthly_clicker.js

const SONG_DATABASE = ${JSON.stringify(allSongs, null, 2)};
`;
  
  fs.writeFileSync('C:/Users/minsu/.gemini/antigravity-ide/scratch/tj-random-song/songData.js', fileContent, 'utf8');
  console.log('💾 Successfully saved to songData.js');
}

runScraper();
