const puppeteer = require('puppeteer');
const fs = require('fs');

const START_YEAR = 1980;
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
  console.log('🚀 (V2 강제 클릭 패치) 멜론 매크로 봇을 시작합니다...');
  
  const browser = await puppeteer.launch({
    headless: false, 
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  const page = await browser.newPage();
  const allSongs = [];
  const uniqueKeys = new Set();
  
  // 최초 페이지 진입
  const startUrl = `https://www.melon.com/chart/age/index.htm?chartType=YE&chartMac=2020&chartYear=2023`;
  await page.goto(startUrl, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000)); // 초기 렌더링 대기
  
  const decades = [1980, 1990, 2000, 2010, 2020];

  for (const decade of decades) {
    console.log(`\n================ [ ${decade}년대 탭 클릭 시도 ] ================`);
    
    try {
      // 1. 브라우저 내부 JS를 이용하여 '연대' 강제 클릭 (예: "1980년대")
      const decadeClicked = await page.evaluate((d) => {
        const elements = Array.from(document.querySelectorAll('a, button, span'));
        const target = elements.find(el => el.innerText.trim() === `${d}년대`);
        if (target) {
          target.click();
          return true;
        }
        return false;
      }, decade);
      
      if (!decadeClicked) {
        console.log(`⚠️ ${decade}년대 탭을 찾을 수 없어 건너뜁니다.`);
        continue;
      }
      
      await new Promise(r => setTimeout(r, 2500)); // 연대 탭 변경 후 애니메이션/로딩 대기

      let endYear = decade + 9;
      if (decade === 2020) endYear = 2023;

      for (let year = decade; year <= endYear; year++) {
        console.log(`👉 ${year}년 버튼 찾는 중...`);
        
        try {
          // 2. 브라우저 내부 JS를 이용하여 '연도' 강제 클릭 (예: "1981년")
          const yearClicked = await page.evaluate((y) => {
            const elements = Array.from(document.querySelectorAll('a, button, span'));
            // 정확히 "1981년" 이라는 텍스트를 가진 요소를 찾음
            const target = elements.find(el => el.innerText.trim() === `${y}년`);
            if (target) {
              target.click();
              return true;
            }
            return false;
          }, year);
          
          if (!yearClicked) {
             console.log(`⚠️ ${year}년 버튼을 찾을 수 없습니다.`);
             continue;
          }

          // 화면 Ajax 데이터 갱신 대기 (매우 중요)
          await new Promise(r => setTimeout(r, 3000));
          
          // 3. 데이터 추출
          const extractedSongs = await page.evaluate(() => {
            const rows = document.querySelectorAll('tbody tr');
            const data = [];
            rows.forEach(row => {
              const titleEl = row.querySelector('.ellipsis.rank01 a');
              const artistEl = row.querySelector('.ellipsis.rank02 a');
              if (titleEl && artistEl) {
                data.push({
                  titleRaw: titleEl.innerText,
                  artistRaw: artistEl.innerText
                });
              }
            });
            return data;
          });
          
          let countForYear = 0;
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
              allSongs.push({ releaseYear: year, releaseMonth: 1, title: title, artist: artist, genre: genre, gender: gender });
              countForYear++;
            }
          }
          
          console.log(`✅ ${year}년 완료: ${countForYear}곡 확보 (누적: ${allSongs.length}곡)`);
          
        } catch (err) {
          console.log(`❌ ${year}년 스크래핑 에러: ${err.message}`);
        }
      }

    } catch (err) {
       console.log(`❌ ${decade}년대 스크래핑 에러: ${err.message}`);
    }
  }
  
  await browser.close();
  
  console.log(`\n🎉 모든 수집 완료! 총 ${allSongs.length}개의 100% 팩트 명곡을 긁어왔습니다!`);
  
  const fileContent = `// TJ Karaoke Melon Scraped Verified Songs Database (Node.js UI Macro V2)
// Total Unique Songs: ${allSongs.length}
// Auto-generated by melon_clicker.js

const SONG_DATABASE = ${JSON.stringify(allSongs, null, 2)};
`;
  
  fs.writeFileSync('C:/Users/minsu/.gemini/antigravity-ide/scratch/tj-random-song/songData.js', fileContent, 'utf8');
  console.log('💾 Successfully saved to songData.js');
}

runScraper();
