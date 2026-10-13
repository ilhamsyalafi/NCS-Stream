/* ==========================================================================
   1. DATA SYSTEM (NCS MUSIC CATALOG DATA SOURCE)
   ========================================================================== */
const tracksData = [
  {
    id: "song-001",
    title: "DANÇA DO VERÃO",
    artists: ["Scythermane", "SH3RWIN", "NXGHT!"],
    genre: ["Phonk", "Electronic"],
    releaseDate: "2024-01-01",
    duration: "2:30",
    cover: "assets/covers/song-001.png",
    audio: "assets/music/Scythermane, SH3RWIN, NXGHT! - DANÇA DO VERÃO [NCS Release].mp3",
    description: "Rilisan Phonk & Dance energik oleh Scythermane, SH3RWIN, dan NXGHT! di NoCopyrightSounds.",
    label: "NoCopyrightSounds",
    featured: true
  },
  {
    id: "song-002",
    title: "Safe & Sound",
    artists: ["Different Heaven"],
    genre: ["House", "Electronic"],
    releaseDate: "2016-01-01",
    duration: "3:15",
    cover: "assets/covers/song-002.jpg",
    audio: "assets/music/Different Heaven - Safe & Sound [NCS Release].mp3",
    description: "Karya Melodic House ceria dari Different Heaven.",
    label: "NoCopyrightSounds",
    featured: true
  },
  {
    id: "song-003",
    title: "Feel Good",
    artists: ["Syn Cole"],
    genre: ["House"],
    releaseDate: "2016-02-27",
    duration: "3:02",
    cover: "assets/covers/song-003.jpg",
    audio: "assets/music/Syn Cole - Feel Good [NCS Release].mp3",
    description: "Lagu Dance/Electro House ikonik dan penuh semangat dari Syn Cole.",
    label: "NoCopyrightSounds",
    featured: true
  },
  {
    id: "song-004",
    title: "Heroes Tonight (feat. Johnning)",
    artists: ["Janji", "Johnning"],
    genre: ["Melodic", "House"],
    releaseDate: "2015-06-13",
    duration: "3:28",
    cover: "assets/covers/song-004.webp",
    audio: "assets/music/Janji, Johnning - Heroes Tonight (feat. Johnning) [NCS Release].mp3",
    description: "Kombinasi vokal Johnning yang kuat dan melodi progresif dari Janji.",
    label: "NoCopyrightSounds",
    featured: true
  },
  {
    id: "song-005",
    title: "Sky High",
    artists: ["Elektronomia"],
    genre: ["House", "Electronic"],
    releaseDate: "2017-01-28",
    duration: "3:58",
    cover: "assets/covers/song-005.jpg",
    audio: "assets/music/Elektronomia - Sky High [NCS Release].mp3",
    description: "Melodi Progressive House melayang khas dari Elektronomia.",
    label: "NoCopyrightSounds",
    featured: true
  },
  {
    id: "song-006",
    title: "Symbolism",
    artists: ["Electro-Light"],
    genre: ["Trap", "Electronic"],
    releaseDate: "2014-11-27",
    duration: "4:50",
    cover: "assets/covers/song-006.jpg",
    audio: "assets/music/Electro-Light - Symbolism [NCS Release].mp3",
    description: "Karya Melodic Trap klasik dari Electro-Light yang sangat populer di NCS.",
    label: "NoCopyrightSounds",
    featured: true
  }
];

/* ==========================================================================
   2. STATE MANAGEMENT & LOCAL STORAGE
   ========================================================================== */
const state = {
  queue: [],
  currentIndex: -1,
  isPlaying: false,
  isShuffle: false,
  isRepeat: false, // 'off' | 'all' | 'one'
  favorites: JSON.parse(localStorage.getItem('ncs_favorites') || '[]'),
  playlists: JSON.parse(localStorage.getItem('ncs_playlists') || '[]'),
  history: JSON.parse(localStorage.getItem('ncs_history') || '[]'),
  currentRoute: { page: 'home', params: {} }
};

function saveState() {
  localStorage.setItem('ncs_favorites', JSON.stringify(state.favorites));
  localStorage.setItem('ncs_playlists', JSON.stringify(state.playlists));
  localStorage.setItem('ncs_history', JSON.stringify(state.history));
}

/* Helper SVG Placeholder */
function getPlaceholderImage(text) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
    <rect width="100%" height="100%" fill="#171E22"/>
    <circle cx="150" cy="150" r="80" fill="#111619" stroke="#6c4627" stroke-width="2"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#8b6744" font-family="sans-serif" font-size="20" font-weight="bold">${text}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/* Helper Toast Notification */
function showToast(msg) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerText = msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

/* ==========================================================================
   3. AUDIO PLAYER CORE ENGINE
   ========================================================================== */
const audio = document.getElementById('main-audio');

function loadTrack(index) {
  if (index < 0 || index >= state.queue.length) return;
  state.currentIndex = index;
  const track = state.queue[index];

  audio.src = track.audio;
  audio.load();

  // Update UI Elements Player
  document.getElementById('player-title').innerText = track.title;
  document.getElementById('player-artist').innerText = track.artists.join(', ');
  
  const coverImg = document.getElementById('player-cover');
  coverImg.src = track.cover;
  coverImg.onerror = () => { coverImg.src = getPlaceholderImage(track.title); };

  updateFavoriteBtnUI(track.id);
  addToHistory(track);
  renderQueueList();

  if (state.isPlaying) {
    audio.play().catch(err => {
      showToast("File audio lokal tidak ditemukan/gagal dimuat: " + track.audio);
      state.isPlaying = false;
      updatePlayPauseBtnUI();
    });
  }
}

function playTrack(track, queueList = null) {
  if (queueList) {
    state.queue = [...queueList];
  } else if (!state.queue.some(t => t.id === track.id)) {
    state.queue.push(track);
  }

  const index = state.queue.findIndex(t => t.id === track.id);
  state.isPlaying = true;
  updatePlayPauseBtnUI();
  loadTrack(index);
  audio.play().catch(() => {});
}

function togglePlayPause() {
  if (state.queue.length === 0) {
    if (tracksData.length > 0) playTrack(tracksData[0], tracksData);
    return;
  }

  if (audio.paused) {
    audio.play();
    state.isPlaying = true;
  } else {
    audio.pause();
    state.isPlaying = false;
  }
  updatePlayPauseBtnUI();
}

function updatePlayPauseBtnUI() {
  const btn = document.getElementById('btn-play-pause');
  btn.innerHTML = state.isPlaying ? '<i data-lucide="pause"></i>' : '<i data-lucide="play"></i>';
  lucide.createIcons();
}

function playNext() {
  if (state.queue.length === 0) return;
  let nextIndex;
  if (state.isShuffle) {
    nextIndex = Math.floor(Math.random() * state.queue.length);
  } else {
    nextIndex = (state.currentIndex + 1) % state.queue.length;
  }
  loadTrack(nextIndex);
}

function playPrev() {
  if (state.queue.length === 0) return;
  let prevIndex = (state.currentIndex - 1 + state.queue.length) % state.queue.length;
  loadTrack(prevIndex);
}

function addToHistory(track) {
  state.history = state.history.filter(t => t.id !== track.id);
  state.history.unshift(track);
  if (state.history.length > 20) state.history.pop();
  saveState();
}

/* Audio Player Event Listeners */
audio.addEventListener('timeupdate', () => {
  const curr = audio.currentTime || 0;
  const dur = audio.duration || 0;
  document.getElementById('current-time').innerText = formatTime(curr);
  document.getElementById('total-duration').innerText = formatTime(dur);
  if (dur > 0) {
    document.getElementById('seek-bar').value = (curr / dur) * 100;
  }
});

audio.addEventListener('ended', () => {
  if (state.isRepeat === 'one') {
    audio.currentTime = 0;
    audio.play();
  } else {
    playNext();
  }
});

document.getElementById('seek-bar').addEventListener('input', (e) => {
  if (audio.duration) {
    audio.currentTime = (e.target.value / 100) * audio.duration;
  }
});

document.getElementById('volume-bar').addEventListener('input', (e) => {
  audio.volume = e.target.value / 100;
});

document.getElementById('btn-play-pause').addEventListener('click', togglePlayPause);
document.getElementById('btn-next').addEventListener('click', playNext);
document.getElementById('btn-prev').addEventListener('click', playPrev);

document.getElementById('btn-shuffle').addEventListener('click', (e) => {
  state.isShuffle = !state.isShuffle;
  e.currentTarget.classList.toggle('active', state.isShuffle);
  showToast(state.isShuffle ? "Mode Acak Aktif" : "Mode Acak Mati");
});

document.getElementById('btn-repeat').addEventListener('click', (e) => {
  state.isRepeat = state.isRepeat === 'one' ? 'off' : 'one';
  e.currentTarget.classList.toggle('active', state.isRepeat === 'one');
  showToast(state.isRepeat === 'one' ? "Ulangi Lagu Aktif" : "Ulangi Mati");
});

/* Favorit dari Player Bawah */
document.getElementById('player-fav-btn')?.addEventListener('click', () => {
  if (state.currentIndex >= 0 && state.queue[state.currentIndex]) {
    toggleFavorite(state.queue[state.currentIndex].id);
  }
});

function formatTime(secs) {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

/* ==========================================================================
   4. FAVORITES & PLAYLIST MANAGERS
   ========================================================================== */
function toggleFavorite(trackId) {
  const index = state.favorites.indexOf(trackId);
  if (index > -1) {
    state.favorites.splice(index, 1);
    showToast("Dihapus dari Favorit");
  } else {
    state.favorites.push(trackId);
    showToast("Ditambahkan ke Favorit");
  }
  saveState();
  
  // Jika lagu yang disukai sedang diputar di player bawah, perbarui UI-nya
  if (state.currentIndex >= 0 && state.queue[state.currentIndex]?.id === trackId) {
    updateFavoriteBtnUI(trackId);
  }
  
  // Render ulang jika pengguna sedang membuka halaman tertentu
  if (['favorites', 'music', 'track'].includes(state.currentRoute.page)) {
    renderPage();
  }
}

function updateFavoriteBtnUI(trackId) {
  const btn = document.getElementById('player-fav-btn');
  if (!btn) return;
  const isFav = state.favorites.includes(trackId);
  btn.innerHTML = `<i data-lucide="heart" ${isFav ? 'fill="#a76f4d"' : ''}></i>`;
  btn.classList.toggle('active', isFav);
  lucide.createIcons();
}

function createPlaylist(name) {
  if (!name.trim()) return;
  const newPl = { id: 'pl-' + Date.now(), name, tracks: [] };
  state.playlists.push(newPl);
  saveState();
  showToast("Playlist '" + name + "' berhasil dibuat");
  if (state.currentRoute.page === 'playlists') renderPage();
}

function addTrackToPlaylist(playlistId, trackId) {
  const pl = state.playlists.find(p => p.id === playlistId);
  if (pl) {
    if (!pl.tracks.includes(trackId)) {
      pl.tracks.push(trackId);
      saveState();
      showToast("Ditambahkan ke " + pl.name);
    } else {
      showToast("Lagu sudah ada di dalam " + pl.name);
    }
  }
}

function playPlaylist(playlistId) {
  const pl = state.playlists.find(p => p.id === playlistId);
  if (pl && pl.tracks.length > 0) {
    const playlistTracks = tracksData.filter(t => pl.tracks.includes(t.id));
    if (playlistTracks.length > 0) playTrack(playlistTracks[0], playlistTracks);
  } else {
    showToast("Playlist ini belum berisi lagu!");
  }
}

/* ==========================================================================
   5. ROUTING SYSTEM & VIEW RENDERER
   ========================================================================== */
function parseHash() {
  const hash = window.location.hash.substring(1);
  if (!hash) return { page: 'home', params: {} };

  const parts = hash.split('/');
  const page = parts[0];
  const param = parts[1] ? decodeURIComponent(parts[1]) : null;

  return { page, param };
}

function navigateTo(hash) {
  window.location.hash = hash;
}

function handleRoute() {
  const { page, param } = parseHash();
  state.currentRoute = { page, param };

  // Update navbar links
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.getAttribute('data-page') === page);
  });

  renderPage();
}

window.addEventListener('hashchange', handleRoute);
window.addEventListener('load', () => {
  handleRoute();
  lucide.createIcons();
});

/* RENDER PAGE SWITCHER */
function renderPage() {
  const app = document.getElementById('app-content');
  const { page, param } = state.currentRoute;

  switch (page) {
    case 'home':
      app.innerHTML = renderHomePage();
      break;
    case 'music':
      app.innerHTML = renderMusicPage();
      attachMusicFilters();
      break;
    case 'track':
      app.innerHTML = renderTrackDetailPage(param);
      break;
    case 'artists':
      app.innerHTML = param ? renderArtistDetailPage(param) : renderArtistsPage();
      break;
    case 'genres':
      app.innerHTML = param ? renderGenreDetailPage(param) : renderGenresPage();
      break;
    case 'playlists':
      app.innerHTML = renderPlaylistsPage();
      break;
    case 'favorites':
      app.innerHTML = renderFavoritesPage();
      break;
    default:
      app.innerHTML = renderHomePage();
  }

  lucide.createIcons();
  attachGlobalViewEvents();
}

/* ==========================================================================
   6. VIEW TEMPLATES
   ========================================================================== */

/* HOME PAGE */
function renderHomePage() {
  const latest = [...tracksData].sort((a,b) => new Date(b.releaseDate) - new Date(a.releaseDate)).slice(0, 5);
  const featured = tracksData.filter(t => t.featured);
  
  // Genres list
  const genresSet = new Set();
  tracksData.forEach(t => t.genre.forEach(g => genresSet.add(g)));
  const genres = Array.from(genresSet);

  return `
    <section class="hero">
      <div class="hero-content">
        <span class="hero-badge">NoCopyrightSounds Catalog</span>
        <h1 class="hero-title">Eksplorasi Musik Elektronik Bebas Hak Cipta</h1>
        <p class="hero-desc">Dengarkan koleksi lagu EDM, House, Drum & Bass, dan Dubstep terbaik tanpa batasan lisensi.</p>
        <div class="hero-buttons">
          <a href="#music" class="btn btn-primary"><i data-lucide="play"></i> Jelajahi Musik</a>
          <a href="#genres" class="btn btn-secondary">Pilih Genre</a>
        </div>
      </div>
      <div class="hero-graphic">
        <div class="graphic-circle"></div>
        <div class="graphic-inner"></div>
      </div>
    </section>

    <section class="section">
      <div class="section-header">
        <h2 class="section-title">Rilisan Terbaru</h2>
        <a href="#music" class="see-all-link">Lihat Semua</a>
      </div>
      <div class="grid-tracks">
        ${latest.map(track => renderTrackCard(track)).join('')}
      </div>
    </section>

    <section class="section">
      <div class="section-header">
        <h2 class="section-title">Musik Populer</h2>
      </div>
      <div class="grid-tracks">
        ${featured.map(track => renderTrackCard(track)).join('')}
      </div>
    </section>

    <section class="section">
      <div class="section-header">
        <h2 class="section-title">Eksplorasi Genre</h2>
      </div>
      <div class="grid-genres">
        ${genres.map(g => `
          <div class="genre-card" onclick="navigateTo('genres/${encodeURIComponent(g)}')">
            <div class="genre-card-title">${g}</div>
            <div class="genre-card-count">${tracksData.filter(t => t.genre.includes(g)).length} Tracks</div>
          </div>
        `).join('')}
      </div>
    </section>
  `;
}

/* TRACK CARD COMPONENT */
function renderTrackCard(track) {
  return `
    <div class="track-card" onclick="navigateTo('track/${track.id}')">
      <div class="track-cover-container">
        <img src="${track.cover}" onerror="this.src='${getPlaceholderImage(track.title)}'" alt="${track.title}">
        <div class="play-overlay">
          <button class="play-overlay-btn" onclick="event.stopPropagation(); playTrackById('${track.id}')">
            <i data-lucide="play"></i>
          </button>
        </div>
      </div>
      <div class="track-info-title">${track.title}</div>
      <div class="track-info-artist">${track.artists.join(', ')}</div>
      <div class="track-card-footer">
        <span>${track.genre[0] || 'Electronic'}</span>
        <span>${track.duration || ''}</span>
      </div>
    </div>
  `;
}

/* MUSIC ALL TRACKS PAGE */
function renderMusicPage() {
  const genres = Array.from(new Set(tracksData.flatMap(t => t.genre)));
  const artists = Array.from(new Set(tracksData.flatMap(t => t.artists)));

  return `
    <section class="section">
      <h2 class="section-title" style="margin-bottom: 20px;">Katalog Musik</h2>
      <div class="filter-bar">
        <input type="text" id="filter-search" class="filter-input" placeholder="Cari di katalog...">
        <select id="filter-genre" class="filter-select">
          <option value="">Semua Genre</option>
          ${genres.map(g => `<option value="${g}">${g}</option>`).join('')}
        </select>
        <select id="filter-artist" class="filter-select">
          <option value="">Semua Artis</option>
          ${artists.map(a => `<option value="${a}">${a}</option>`).join('')}
        </select>
        <select id="filter-sort" class="filter-select">
          <option value="newest">Terbaru</option>
          <option value="title">Judul (A-Z)</option>
        </select>
      </div>

      <div id="music-list-container">
        ${renderTrackListTable(tracksData)}
      </div>
    </section>
  `;
}

/* TRACK LIST TABLE */
function renderTrackListTable(tracks) {
  if (tracks.length === 0) {
    return `
      <div class="empty-state">
        <i data-lucide="music"></i>
        <p>Tidak ada lagu yang cocok dengan kriteria pencarian.</p>
      </div>
    `;
  }

  return `
    <table class="track-table">
      <thead>
        <tr>
          <th style="width: 50px;">#</th>
          <th>Judul</th>
          <th>Genre</th>
          <th>Rilis</th>
          <th style="text-align: right;">Durasi</th>
          <th style="text-align: center; width: 100px;">Aksi</th>
        </tr>
      </thead>
      <tbody>
        ${tracks.map((t, idx) => `
          <tr class="track-row" onclick="navigateTo('track/${t.id}')" style="cursor:pointer;">
            <td onclick="event.stopPropagation(); playTrackById('${t.id}')">
              <button class="icon-btn"><i data-lucide="play" style="width:16px;"></i></button>
            </td>
            <td>
              <div class="track-cell-main">
                <img src="${t.cover}" onerror="this.src='${getPlaceholderImage(t.title)}'">
                <div>
                  <div style="font-weight:600; font-size:0.9rem;">${t.title}</div>
                  <div style="font-size:0.8rem; color:var(--text-secondary);">${t.artists.join(', ')}</div>
                </div>
              </div>
            </td>
            <td>${t.genre.join(', ')}</td>
            <td>${t.releaseDate || '-'}</td>
            <td style="text-align: right;">${t.duration || '-'}</td>
            <td style="text-align: center;" onclick="event.stopPropagation();">
              <button class="icon-btn" onclick="toggleFavorite('${t.id}')">
                <i data-lucide="heart" ${state.favorites.includes(t.id) ? 'fill="#00F58A"' : ''}></i>
              </button>
              <button class="icon-btn" onclick="openAddToPlaylistModal('${t.id}')">
                <i data-lucide="plus"></i>
              </button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

/* TRACK DETAIL PAGE */
function renderTrackDetailPage(id) {
  const track = tracksData.find(t => t.id === id);
  if (!track) return `<div class="empty-state">Lagu tidak ditemukan.</div>`;

  const related = tracksData.filter(t => t.id !== id && t.genre.some(g => track.genre.includes(g))).slice(0, 4);

  return `
    <div class="detail-header">
      <img class="detail-cover" src="${track.cover}" onerror="this.src='${getPlaceholderImage(track.title)}'">
      <div class="detail-meta">
        <span class="detail-badge">${track.genre.join(' / ')}</span>
        <h1 class="detail-title">${track.title}</h1>
        <div style="margin-bottom: 12px;">
          Oleh: ${track.artists.map(a => `<a href="#artists/${encodeURIComponent(a)}" class="detail-artist-link">${a}</a>`).join(', ')}
        </div>
        <p style="color:var(--text-secondary); font-size:0.9rem; margin-bottom:16px;">${track.description || ''}</p>
        
        <div class="detail-actions">
          <button class="btn btn-primary" onclick="playTrackById('${track.id}')">
            <i data-lucide="play"></i> Putar Lagu
          </button>
          <button class="btn btn-secondary" onclick="toggleFavorite('${track.id}')">
            <i data-lucide="heart" ${state.favorites.includes(track.id) ? 'fill="#b47f46"' : ''}></i> Favorit
          </button>
          <button class="btn btn-secondary" onclick="openAddToPlaylistModal('${track.id}')">
            <i data-lucide="plus"></i> Playlist
          </button>
          <button class="btn btn-secondary" onclick="copyShareLink()">
            <i data-lucide="share-2"></i> Bagikan
          </button>
        </div>
      </div>
    </div>

    <section class="section">
      <h3 class="section-title" style="margin-bottom:16px;">Lagu Terkait</h3>
      <div class="grid-tracks">
        ${related.map(r => renderTrackCard(r)).join('')}
      </div>
    </section>
  `;
}

/* ARTISTS LIST PAGE */
function renderArtistsPage() {
  const artistsMap = {};
  tracksData.forEach(t => {
    t.artists.forEach(a => {
      if (!artistsMap[a]) artistsMap[a] = 0;
      artistsMap[a]++;
    });
  });

  return `
    <section class="section">
      <h2 class="section-title" style="margin-bottom:20px;">Daftar Artis</h2>
      <div class="grid-artists">
        ${Object.keys(artistsMap).map(a => `
          <div class="artist-card" onclick="navigateTo('artists/${encodeURIComponent(a)}')">
            <img class="artist-avatar" src="${getPlaceholderImage(a)}" alt="${a}">
            <div class="artist-card-name">${a}</div>
            <div class="artist-card-tracks">${artistsMap[a]} Tracks</div>
          </div>
        `).join('')}
      </div>
    </section>
  `;
}

/* ARTIST DETAIL PAGE */
function renderArtistDetailPage(artistName) {
  const tracks = tracksData.filter(t => t.artists.includes(artistName));

  return `
    <div class="detail-header">
      <img class="detail-cover" style="border-radius:50%;" src="${getPlaceholderImage(artistName)}">
      <div class="detail-meta">
        <span class="detail-badge">Artis</span>
        <h1 class="detail-title">${artistName}</h1>
        <p style="color:var(--text-secondary);">${tracks.length} lagu dalam katalog</p>
        <div class="detail-actions">
          <button class="btn btn-primary" onclick="playAllTracks(${JSON.stringify(tracks.map(t=>t.id)).replace(/"/g, '&quot;')})">
            <i data-lucide="play"></i> Putar Semua
          </button>
        </div>
      </div>
    </div>

    <section class="section">
      <h3 class="section-title" style="margin-bottom:16px;">Lagu oleh ${artistName}</h3>
      ${renderTrackListTable(tracks)}
    </section>
  `;
}

/* GENRES PAGE & GENRE DETAIL PAGE */
function renderGenresPage() {
  const genresMap = {};
  tracksData.forEach(t => {
    t.genre.forEach(g => {
      if (!genresMap[g]) genresMap[g] = 0;
      genresMap[g]++;
    });
  });

  return `
    <section class="section">
      <h2 class="section-title" style="margin-bottom:20px;">Daftar Genre</h2>
      <div class="grid-genres">
        ${Object.keys(genresMap).map(g => `
          <div class="genre-card" onclick="navigateTo('genres/${encodeURIComponent(g)}')">
            <div class="genre-card-title">${g}</div>
            <div class="genre-card-count">${genresMap[g]} Tracks</div>
          </div>
        `).join('')}
      </div>
    </section>
  `;
}

function renderGenreDetailPage(genre) {
  const tracks = tracksData.filter(t => t.genre.includes(genre));

  return `
    <section class="section">
      <div style="margin-bottom:24px;">
        <span class="detail-badge">Genre</span>
        <h1 class="detail-title">${genre}</h1>
      </div>
      ${renderTrackListTable(tracks)}
    </section>
  `;
}

/* FAVORITES PAGE */
function renderFavoritesPage() {
  const favTracks = tracksData.filter(t => state.favorites.includes(t.id));

  return `
    <section class="section">
      <h2 class="section-title" style="margin-bottom:20px;">Lagu Favorit Saya</h2>
      ${favTracks.length > 0 ? renderTrackListTable(favTracks) : `
        <div class="empty-state">
          <i data-lucide="heart"></i>
          <p>Belum ada lagu favorit yang ditambahkan.</p>
        </div>
      `}
    </section>
  `;
}

/* PLAYLISTS PAGE */
function renderPlaylistsPage() {
  return `
    <section class="section">
      <div class="section-header">
        <h2 class="section-title">Playlist Saya</h2>
        <button class="btn btn-primary" onclick="openCreatePlaylistModal()">
          <i data-lucide="plus"></i> Buat Playlist
        </button>
      </div>

      <div class="grid-genres">
        ${state.playlists.map(p => `
          <div class="genre-card" style="text-align:left;">
            <div class="genre-card-title">${p.name}</div>
            <div class="genre-card-count">${p.tracks.length} Tracks</div>
            <button class="btn btn-secondary" style="margin-top:12px; padding:6px 12px; font-size:0.8rem;" onclick="playPlaylist('${p.id}')">
              <i data-lucide="play" style="width:14px;"></i> Putar
            </button>
          </div>
        `).join('')}
      </div>
    </section>
  `;
}

/* ==========================================================================
   7. EVENT HANDLERS & HELPERS
   ========================================================================== */
function playTrackById(id) {
  const track = tracksData.find(t => t.id === id);
  if (track) playTrack(track, tracksData);
}

function playAllTracks(ids) {
  const tracks = tracksData.filter(t => ids.includes(t.id));
  if (tracks.length > 0) playTrack(tracks[0], tracks);
}

function copyShareLink() {
  navigator.clipboard.writeText(window.location.href);
  showToast("Tautan lagu berhasil disalin!");
}

/* Music Filter Listener Attachments */
function attachMusicFilters() {
  const searchInput = document.getElementById('filter-search');
  const genreSelect = document.getElementById('filter-genre');
  const artistSelect = document.getElementById('filter-artist');
  const sortSelect = document.getElementById('filter-sort');

  function updateFilteredTracks() {
    let result = [...tracksData];
    const query = searchInput.value.toLowerCase();
    const genre = genreSelect.value;
    const artist = artistSelect.value;
    const sort = sortSelect.value;

    if (query) {
      result = result.filter(t => t.title.toLowerCase().includes(query) || t.artists.some(a => a.toLowerCase().includes(query)));
    }
    if (genre) {
      result = result.filter(t => t.genre.includes(genre));
    }
    if (artist) {
      result = result.filter(t => t.artists.includes(artist));
    }
    if (sort === 'title') {
      result.sort((a,b) => a.title.localeCompare(b.title));
    } else {
      result.sort((a,b) => new Date(b.releaseDate) - new Date(a.releaseDate));
    }

    document.getElementById('music-list-container').innerHTML = renderTrackListTable(result);
    lucide.createIcons();
  }

  [searchInput, genreSelect, artistSelect, sortSelect].forEach(el => {
    if (el) el.addEventListener('input', updateFilteredTracks);
  });
}

/* GLOBAL SEARCH INPUT */
document.getElementById('global-search').addEventListener('input', (e) => {
  const q = e.target.value.toLowerCase().trim();
  const resultsBox = document.getElementById('search-results');

  if (!q) {
    resultsBox.classList.remove('active');
    return;
  }

  const matchedTracks = tracksData.filter(t => t.title.toLowerCase().includes(q)).slice(0, 4);
  const matchedArtists = Array.from(new Set(tracksData.flatMap(t => t.artists))).filter(a => a.toLowerCase().includes(q)).slice(0, 3);

  if (matchedTracks.length === 0 && matchedArtists.length === 0) {
    resultsBox.innerHTML = `<div style="padding:16px; text-align:center; color:var(--text-secondary);">Hasil tidak ditemukan</div>`;
  } else {
    resultsBox.innerHTML = `
      ${matchedTracks.length ? '<div class="search-group-title">Lagu</div>' : ''}
      ${matchedTracks.map(t => `
        <div class="search-item" onclick="navigateTo('track/${t.id}'); document.getElementById('search-results').classList.remove('active');">
          <img src="${t.cover}" onerror="this.src='${getPlaceholderImage(t.title)}'">
          <div>
            <div style="font-weight:600; font-size:0.875rem;">${t.title}</div>
            <div style="font-size:0.75rem; color:var(--text-secondary);">${t.artists.join(', ')}</div>
          </div>
        </div>
      `).join('')}
      ${matchedArtists.length ? '<div class="search-group-title">Artis</div>' : ''}
      ${matchedArtists.map(a => `
        <div class="search-item" onclick="navigateTo('artists/${encodeURIComponent(a)}'); document.getElementById('search-results').classList.remove('active');">
          <div style="font-weight:600; font-size:0.875rem;">${a}</div>
        </div>
      `).join('')}
    `;
  }
  resultsBox.classList.add('active');
});

/* QUEUE DRAWER TOGGLE & CLOSE OUTSIDE LOGIC */
const queueDrawer = document.getElementById('queue-drawer');
const btnToggleQueue = document.getElementById('btn-toggle-queue');

btnToggleQueue.addEventListener('click', (e) => {
  e.stopPropagation();
  queueDrawer.classList.toggle('active');
  renderQueueList();
});

document.getElementById('btn-close-queue').addEventListener('click', () => {
  queueDrawer.classList.remove('active');
});

/* Menutup antrean pemutaran saat mengklik area di luar pop-up */
document.addEventListener('click', (e) => {
  if (queueDrawer.classList.contains('active')) {
    if (!queueDrawer.contains(e.target) && !btnToggleQueue.contains(e.target)) {
      queueDrawer.classList.remove('active');
    }
  }
});

function renderQueueList() {
  const container = document.getElementById('queue-list');
  if (state.queue.length === 0) {
    container.innerHTML = `<div style="text-align:center; color:var(--text-secondary); margin-top:20px;">Antrean kosong</div>`;
    return;
  }

  container.innerHTML = state.queue.map((t, idx) => `
    <div class="queue-item ${idx === state.currentIndex ? 'active' : ''}" onclick="loadTrack(${idx}); audio.play(); state.isPlaying=true; updatePlayPauseBtnUI();">
      <img src="${t.cover}" onerror="this.src='${getPlaceholderImage(t.title)}'">
      <div class="queue-item-info">
        <div class="queue-item-title">${t.title}</div>
        <div class="queue-item-artist">${t.artists.join(', ')}</div>
      </div>
    </div>
  `).join('');
}

/* MODAL CONTROL (BUAT PLAYLIST & TAMBAH KE PLAYLIST) */
function openCreatePlaylistModal() {
  document.getElementById('playlist-modal').classList.add('active');
}

document.getElementById('btn-close-modal')?.addEventListener('click', () => {
  document.getElementById('playlist-modal').classList.remove('active');
});

document.getElementById('btn-cancel-modal')?.addEventListener('click', () => {
  document.getElementById('playlist-modal').classList.remove('active');
});

document.getElementById('btn-save-playlist')?.addEventListener('click', () => {
  const input = document.getElementById('playlist-name-input');
  const name = input.value;
  createPlaylist(name);
  input.value = '';
  document.getElementById('playlist-modal').classList.remove('active');
});

function openAddToPlaylistModal(trackId) {
  const container = document.getElementById('playlist-select-list');
  if (state.playlists.length === 0) {
    container.innerHTML = `<p style="color:var(--text-secondary); padding: 12px; text-align: center;">Belum ada playlist. Buat terlebih dahulu di menu Playlists.</p>`;
  } else {
    container.innerHTML = state.playlists.map(p => `
      <div class="search-item" onclick="addTrackToPlaylist('${p.id}', '${trackId}'); document.getElementById('add-to-playlist-modal').classList.remove('active');">
        <div style="font-weight:600;">${p.name}</div>
      </div>
    `).join('');
  }
  document.getElementById('add-to-playlist-modal').classList.add('active');
}

document.getElementById('btn-close-add-modal')?.addEventListener('click', () => {
  document.getElementById('add-to-playlist-modal').classList.remove('active');
});

/* MOBILE MENU TOGGLE */
document.getElementById('mobile-menu-toggle').addEventListener('click', () => {
  document.getElementById('nav-links').classList.toggle('active');
});

function attachGlobalViewEvents() {
  // Global click listener attachment if needed
}