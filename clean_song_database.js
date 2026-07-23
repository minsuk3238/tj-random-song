const fs = require('fs');
const path = require('path');
const songData = require('./songData.js');

function cleanTitle(title) {
  if (!title) return '';
  return title
    .replace(/^TITLE\s*/gi, '')
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

let cleanedCount = 0;
const cleanedDB = songData.map(song => {
  const newTitle = cleanTitle(song.title);
  if (newTitle !== song.title) {
    cleanedCount++;
  }
  return {
    ...song,
    title: newTitle
  };
});

console.log(`Cleaned ${cleanedCount} song titles!`);

const fileContent = `// TJ Karaoke Genie Scraped Monthly TOP 100 Database (1980-2026)
// Total Entries: ${cleanedDB.length}
// Cleaned TITLE prefix & metadata

const SONG_DATABASE = ${JSON.stringify(cleanedDB, null, 2)};
if (typeof module !== 'undefined') module.exports = SONG_DATABASE;
`;

fs.writeFileSync(path.join(__dirname, 'songData.js'), fileContent, 'utf8');
console.log('Saved cleaned database to songData.js');
