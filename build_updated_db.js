const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// Clean helper
function cleanText(text) {
  if (!text) return '';
  return text.replace(/^TITLE\s*/gi, '')
             .replace(/^19금\s*/gi, '')
             .replace(/^15금\s*/gi, '')
             .replace(/^HOT\s*/gi, '')
             .replace(/\(Live\)/gi, '')
             .replace(/\(Inst\.\)/gi, '')
             .replace(/\(MR\)/gi, '')
             .replace(/\(Special Edition\)/gi, '')
             .replace(/\s+/g, ' ')
             .trim();
}

// Genre Classifier
function getGenre(title, artist) {
  const t = (title + ' ' + artist).toLowerCase();

  if (artist.match(/임영웅|영탁|이찬원|정동원|장민호|김호중|김희재|송가인|양지은|홍지윤|홍진영|장윤정|박현빈|주현미|김수희|나훈아|남진|설운도|태진아|송대관|현철|김연자|심수봉|김혜연|조항조|진성|박구윤|신유|김용임|안성훈|박지현|진해성|손태진|에녹|민수현|황영웅/i)) {
    return '트로트';
  }
  if (artist.match(/버즈|DAY6|데이식스|윤도현|YB|잔나비|자우림|혁오|국카스텐|넬|FT아일랜드|CNBLUE|씨엔블루|QWER|실리카겔|쏜애플|체리필터|산울림|들국화|부활|시나위|백두산|봄여름가을겨울|김경호|박완규|서문탁|마야|몽니|소란|페퍼톤스|루시|LUCY|엔플라잉|N\.Flying|터치드|Xdinary Heroes|신해철|넥스트|N\.EX\.T|이브/i)) {
    return '록/밴드';
  }
  if (artist.match(/다이나믹 듀오|에픽하이|지코|ZICO|비와이|릴러말즈|창모|ASH ISLAND|기리보이|우원재|이영지|저스디스|비오|BE'O|빈지노|Beenzino|로꼬|그레이|박재범|Jay Park|블랙넛|씨잼|슈프림팀|리쌍|드렁큰타이거|윤미래|타이거JK|사이먼 도미닉|쌈디|더콰이엇|도끼|Dok2|스윙스|매드클라운|산이|버벌진트|식케이|빅나티|BIG Naughty|폴로다레드|호미들|pH-1|키드밀리|쿠기|미란이|머쉬베놈|원슈타인|조광일|래원|쿠기|쿠기/i)) {
    return '힙합';
  }
  if (artist.match(/aespa|IVE|아이브|NewJeans|뉴진스|BLACKPINK|블랙핑크|소녀시대|TWICE|트와이스|BTS|방탄소년단|EXO|엑소|BIGBANG|빅뱅|H\.O\.T\.|젝스키스|핑클|S\.E\.S\.|코요태|샤이니|SHINee|NCT|세븐틴|SEVENTEEN|STAYC|스테이씨|LE SSERAFIM|르세라핌|아일릿|ILLIT|TWS|투어스|싸이|PSY|2NE1|카라|KARA|원더걸스|슈퍼주니어|동방신기|신화|ITZY|있지|NMIXX|엔믹스|RIIZE|라이즈|BOYNEXTDOOR|보이넥스트도어|ZEROBASEONE|제로베이스원|베이비몬스터|BABYMONSTER|케플러|Kep1er|여자친구|GFRIEND|오마이걸|마마무|EXID|씨스타|SISTAR|AOA|에이핑크|Apink|청하|선미|현아|화사|HWASA|비|보아|BoA|엄정화|박진영|터보|쿨|2PM|인피니트|하이라이트|BTOB|비투비|블락비|위너|WINNER|iKON|아이콘|몬스타엑스|Stray Kids|스트레이 키즈|TXT|투모로우바이투게더|ENHYPEN|엔하이픈|더보이즈|THE BOYZ|에이티즈|ATEEZ|TREASURE|트레저|KISS OF LIFE|키스오브라이프|tripleS|트리플에스|아이오아이|I\.O\.I|워너원|Wanna One|아이즈원|IZ\*ONE/i)) {
    return '댄스';
  }
  return '발라드';
}

async function fetchGenieMonth(year, month) {
  const monthStr = month.toString().padStart(2, '0');
  const ymd = `${year}${monthStr}01`;
  const songs = [];

  for (let pg = 1; pg <= 2; pg++) {
    const url = `https://www.genie.co.kr/chart/top200?ditc=M&ymd=${ymd}&hh=15&rtm=N&pg=${pg}`;
    try {
      const res = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        timeout: 8000
      });
      const $ = cheerio.load(res.data);
      const rows = $('tr.list');
      rows.each((idx, el) => {
        const titleEl = $(el).find('a.title.ellipsis');
        const artistEl = $(el).find('a.artist.ellipsis');
        if (titleEl.length && artistEl.length) {
          const title = cleanText(titleEl.text().trim());
          const artist = cleanText(artistEl.text().trim());
          const rank = (pg - 1) * 50 + idx + 1;
          const genre = getGenre(title, artist);
          songs.push({
            year,
            month,
            rank,
            title,
            artist,
            genre
          });
        }
      });
    } catch (e) {
      console.error(`Error fetching ${year}-${monthStr} pg=${pg}:`, e.message);
    }
  }
  return songs;
}

async function main() {
  console.log('🔄 1. 기존 데이터베이스 로드 및 1980~2011 과거 데이터 정제 (성별 필드 완전 제거)...');
  const oldDB = require('./songData.js');
  const pastSongs = [];
  
  // 1980~2011 과거 데이터 필터 및 정제
  oldDB.forEach(s => {
    if (s.year < 2012) {
      const title = cleanText(s.title);
      const artist = cleanText(s.artist);
      const genre = getGenre(title, artist);
      pastSongs.push({
        year: s.year,
        month: s.month,
        rank: s.rank,
        title,
        artist,
        genre
      });
    }
  });
  console.log(`✅ 1980~2011 데이터: ${pastSongs.length}곡 준비 완료`);

  console.log('🚀 2. 2012~2026 실시간 Genie 월간 TOP 100 데이터 수집 시작 (성별 필드 없음)...');
  const modernSongs = [];
  
  // 2012부터 2026년까지
  for (let year = 2012; year <= 2026; year++) {
    const maxMonth = (year === 2026) ? 8 : 12; // 2026년 8월 현재까지
    for (let month = 1; month <= maxMonth; month++) {
      const songs = await fetchGenieMonth(year, month);
      console.log(`[${year}년 ${month.toString().padStart(2, '0')}월] ${songs.length}곡 수집 완료 (1위: ${songs[0] ? songs[0].title + ' - ' + songs[0].artist : '없음'})`);
      modernSongs.push(...songs);
      // Small pause to be polite
      await new Promise(r => setTimeout(r, 100));
    }
  }

  console.log(`✅ 2012~2026 최신 데이터: ${modernSongs.length}곡 수집 완료`);

  // Combine datasets
  const fullDatabase = [...pastSongs, ...modernSongs];
  console.log(`📊 전체 데이터베이스 총 ${fullDatabase.length}곡 구축 완료!`);

  // Write to songData.js
  const fileContent = `// TJ Karaoke Monthly TOP 100 Database (1980-2026)
// Total Entries: ${fullDatabase.length}
// Updated with verified Genie Monthly Charts up to 2026-08 (Gender removed)

const SONG_DATABASE = ${JSON.stringify(fullDatabase, null, 2)};
if (typeof module !== 'undefined') module.exports = SONG_DATABASE;
`;

  fs.writeFileSync(path.join(__dirname, 'songData.js'), fileContent, 'utf8');
  console.log('💾 songData.js 최신 업데이트 및 저장 완료!');
}

main();
