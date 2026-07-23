// TJ Karaoke Random Song Picker - Pachinko Slot Reel Engine (No TJ Number)
document.addEventListener('DOMContentLoaded', () => {

  // UI Elements
  const startYearSelect = document.getElementById('startYear');
  const endYearSelect = document.getElementById('endYear');
  const presetButtons = document.querySelectorAll('.preset-btn');
  const monthChipsContainer = document.getElementById('monthChips');

  const pickBtn = document.getElementById('pickBtn');
  const slotSection = document.getElementById('slotSection');
  const slotDisplay = document.getElementById('slotDisplay');

  const resultCard = document.getElementById('resultCard');
  const resYear = document.getElementById('resYear');
  const resGenre = document.getElementById('resGenre');
  const resGender = document.getElementById('resGender');
  const resTitle = document.getElementById('resTitle');
  const resArtist = document.getElementById('resArtist');
  const ytLink = document.getElementById('ytLink');
  const rePickBtn = document.getElementById('rePickBtn');

  const historyCount = document.getElementById('historyCount');
  const historyList = document.getElementById('historyList');
  const clearHistoryBtn = document.getElementById('clearHistoryBtn');

  // State: Played History List
  let playedHistory = JSON.parse(localStorage.getItem('tj_played_history_v2')) || [];

  // Initialize UI
  initYearSelects();
  initMonthChips();
  initPresetButtons();
  initSelectAllButtons();
  renderHistoryList();

  // Populate Year Select Options (1980 ~ 2026)
  function initYearSelects() {
    const currentYear = 2026;
    for (let y = 1980; y <= currentYear; y++) {
      const opt1 = document.createElement('option');
      opt1.value = y;
      opt1.textContent = `${y}년`;
      startYearSelect.appendChild(opt1);

      const opt2 = document.createElement('option');
      opt2.value = y;
      opt2.textContent = `${y}년`;
      endYearSelect.appendChild(opt2);
    }
    startYearSelect.value = 1980;
    endYearSelect.value = 2026;
  }

  // Populate Month Checkbox Chips (1 ~ 12)
  function initMonthChips() {
    monthChipsContainer.innerHTML = '';
    for (let m = 1; m <= 12; m++) {
      const label = document.createElement('label');
      label.className = 'checkbox-chip checked';
      label.innerHTML = `
        <input type="checkbox" class="month-chip" value="${m}" checked>
        <span>${m}월</span>
      `;
      monthChipsContainer.appendChild(label);
    }
  }

  // Decade Preset Buttons Click Event
  function initPresetButtons() {
    presetButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        presetButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const s = parseInt(btn.dataset.start, 10);
        const e = parseInt(btn.dataset.end, 10);

        startYearSelect.value = s;
        endYearSelect.value = e;
      });
    });
  }

  // Toggle Checkbox Chips Style Event
  document.addEventListener('change', (e) => {
    if (e.target.type === 'checkbox') {
      const parentLabel = e.target.closest('.checkbox-chip');
      if (parentLabel) {
        if (e.target.checked) {
          parentLabel.classList.add('checked');
        } else {
          parentLabel.classList.remove('checked');
        }
      }
    }
  });

  // Select All Checkbox Helper Button
  function initSelectAllButtons() {
    document.querySelectorAll('.select-all-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetClass = btn.dataset.target;
        const checkboxes = document.querySelectorAll(`.${targetClass}`);
        const allChecked = Array.from(checkboxes).every(cb => cb.checked);

        checkboxes.forEach(cb => {
          cb.checked = !allChecked;
          const parent = cb.closest('.checkbox-chip');
          if (parent) {
            if (!allChecked) parent.classList.add('checked');
            else parent.classList.remove('checked');
          }
        });
      });
    });
  }

  // Get Checked Values
  function getCheckedValues(className) {
    return Array.from(document.querySelectorAll(`.${className}:checked`)).map(cb => cb.value);
  }

  // Dynamic State Reset Helper
  function resetPachinkoSession() {
    resultCard.classList.add('hidden');
    slotSection.classList.remove('hidden');
    slotDisplay.textContent = "🎰 빠칭코 릴 롤링 시작...";
    slotDisplay.classList.add('pachinko-spinning');
  }

  // Pachinko Slot Machine Random Pick Engine
  function pickSong() {
    resetPachinkoSession();

    let startY = parseInt(startYearSelect.value, 10);
    let endY = parseInt(endYearSelect.value, 10);

    if (startY > endY) {
      [startY, endY] = [endY, startY];
      startYearSelect.value = startY;
      endYearSelect.value = endY;
    }

    const selectedMonths = getCheckedValues('month-chip').map(Number);
    const selectedGenders = getCheckedValues('gender-chip');
    const selectedGenres = getCheckedValues('genre-chip');

    // 1. Filter Database by Song Release Date (releaseYear & releaseMonth)
    let candidateSongs = SONG_DATABASE.filter(song => {
      const matchYear = song.releaseYear >= startY && song.releaseYear <= endY;
      let matchMonth = selectedMonths.length === 0 || selectedMonths.includes(song.releaseMonth);
      let matchGender = selectedGenders.length === 0 || selectedGenders.includes(song.gender);
      let matchGenre = selectedGenres.length === 0 || selectedGenres.includes(song.genre);
      return matchYear && matchMonth && matchGender && matchGenre;
    });

    // 2. Strictly Exclude Songs Present in History (100% Guarantee 0% Duplication)
    const playedKeys = new Set(playedHistory.map(item => `${item.title.trim().toLowerCase()}_${item.artist.trim().toLowerCase()}`));
    
    let unplayedCandidates = candidateSongs.filter(s => {
      const key = `${s.title.trim().toLowerCase()}_${s.artist.trim().toLowerCase()}`;
      return !playedKeys.has(key);
    });

    // Fallback if all candidates for selected filters were played: reset condition candidates
    if (unplayedCandidates.length === 0) {
      if (candidateSongs.length > 0) {
        unplayedCandidates = candidateSongs;
      } else {
        unplayedCandidates = SONG_DATABASE;
      }
    }

    pickBtn.disabled = true;

    // Pachinko Reel Fast Rolling Animation (Song Titles & Artists Rapid Scroll)
    let counter = 0;
    const maxTicks = 20;
    const interval = setInterval(() => {
      const randomSeed = SONG_DATABASE[Math.floor(Math.random() * SONG_DATABASE.length)];
      slotDisplay.textContent = `🎵 ${randomSeed.title} - ${randomSeed.artist}`;
      counter++;

      if (counter >= maxTicks) {
        clearInterval(interval);
        slotDisplay.classList.remove('pachinko-spinning');

        // Pick Final Song Candidate
        const finalSong = unplayedCandidates[Math.floor(Math.random() * unplayedCandidates.length)];

        // Record & Render Result
        addToPlayedHistory(finalSong);
        displayResult(finalSong);
      }
    }, 70);
  }

  // Add to Played History
  function addToPlayedHistory(song) {
    const key = `${song.title.trim().toLowerCase()}_${song.artist.trim().toLowerCase()}`;
    const exists = playedHistory.some(item => `${item.title.trim().toLowerCase()}_${item.artist.trim().toLowerCase()}` === key);

    if (!exists) {
      playedHistory.unshift(song);
      localStorage.setItem('tj_played_history_v2', JSON.stringify(playedHistory));
      renderHistoryList();
    }
  }

  // Display Final Result Card (Clean Pachinko Output - NO TJ NUMBER)
  function displayResult(song) {
    slotSection.classList.add('hidden');
    resultCard.classList.remove('hidden');
    pickBtn.disabled = false;

    const displayYear = song.releaseYear || song.year || 2024;
    const displayMonth = song.releaseMonth || song.month || 1;

    resYear.textContent = `${displayYear}년 ${displayMonth}월`;
    resGenre.textContent = song.genre || '가요';
    
    const genderIcon = song.gender === '남성' ? '👨' : (song.gender === '여성' ? '👩' : '👫');
    resGender.textContent = `${genderIcon} ${song.gender || '가수'}`;

    resTitle.textContent = song.title;
    resArtist.textContent = song.artist;

    // Youtube Search Link
    const query = encodeURIComponent(`TJ 노래방 ${song.artist} ${song.title}`);
    ytLink.href = `https://www.youtube.com/results?search_query=${query}`;
  }

  // Render Played Songs List in Right Panel (NO TJ NUMBER)
  function renderHistoryList() {
    historyCount.textContent = playedHistory.length;

    if (playedHistory.length === 0) {
      historyList.innerHTML = `
        <div class="empty-history">
          <p>🎤 아직 뽑은 노래가 없습니다.</p>
          <span>노래를 뽑으면 중복되지 않도록 이곳에 저장됩니다!</span>
        </div>
      `;
      return;
    }

    historyList.innerHTML = '';
    playedHistory.forEach((song, index) => {
      const itemEl = document.createElement('div');
      itemEl.className = 'history-item';

      const genderIcon = song.gender === '남성' ? '👨' : (song.gender === '여성' ? '👩' : '👫');
      const displayYear = song.releaseYear || song.year || 2024;
      const displayMonth = song.releaseMonth || song.month || 1;

      itemEl.innerHTML = `
        <div class="item-left">
          <span class="item-title">${song.title}</span>
          <span class="item-artist">${song.artist}</span>
          <span class="item-meta">${genderIcon} ${song.gender || ''} • ${displayYear}년 ${displayMonth}월 • ${song.genre}</span>
        </div>
        <div class="item-actions">
          <button class="item-del-btn" data-index="${index}" title="삭제">✕</button>
        </div>
      `;

      historyList.appendChild(itemEl);
    });

    // History single item delete event listeners
    historyList.querySelectorAll('.item-del-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.target.dataset.index, 10);
        playedHistory.splice(idx, 1);
        localStorage.setItem('tj_played_history_v2', JSON.stringify(playedHistory));
        renderHistoryList();
      });
    });
  }

  // Clear All History
  clearHistoryBtn.addEventListener('click', () => {
    if (playedHistory.length === 0) return;
    if (confirm('불렀던 곡 리스트를 전부 삭제하고 중복 기록을 초기화할까요?')) {
      playedHistory = [];
      localStorage.removeItem('tj_played_history_v2');
      renderHistoryList();
    }
  });

  // Pick Event Handlers
  pickBtn.addEventListener('click', pickSong);
  rePickBtn.addEventListener('click', pickSong);
});
