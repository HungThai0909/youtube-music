import { Header } from "../components/header";
import { Sidebar } from "../components/sidebar";
import { initSidebarToggle } from "./home";

let currentRouter = null;
export const SongDetail = (match) => {
  const app = document.querySelector("#app");
  const songId = match?.data?.id;
  app.innerHTML = `
    ${Header()}
    <div class="flex pt-[64px]">
      <div class="w-22">${Sidebar()}</div>
      <main class="flex-1 bg-gray-900 overflow-y-auto h-[calc(100vh-64px)]">
        <div id="song-loading-overlay"
          class="fixed inset-0 z-[100] bg-black/60 flex flex-col items-center justify-center">
          <div class="w-16 h-16 border-4 border-gray-700 border-t-white rounded-full animate-spin"></div>
        </div>
        <div class="px-12 py-8 max-w-[1800px] mx-auto">
          <div id="song-hero"></div>
        </div>
      </main>
    </div>
  `;
  initSidebarToggle();
  loadSongDetail(songId);
};

export const setSongDetailRouter = (router) => {
  currentRouter = router;
};

async function loadSongDetail(id) {
  try {
    const data = await fetchSong(id);
    await renderHero(data);
    hideLoading();
  } catch (err) {
    console.error(err);
    hideLoading();
  }
}

async function fetchSong(id) {
  const url = `${import.meta.env.VITE_BASE_URL}/songs/details/${id}`;
  console.log("Fetching:", url);
  const res = await fetch(url);
  if (!res.ok) throw new Error("Fetch failed");
  return res.json();
}

async function renderHero(data) {
  const heroContainer = document.querySelector("#song-hero");
  const albumTracks = data.album?.tracks || [];
  const playlists = data.playlists || [];
  const relatedSongs = data.related || [];
  heroContainer.innerHTML = `
    <div class="flex gap-12">
      <div class="w-1/2 sticky top-20 self-start flex flex-col items-center">
        <img src="${data.thumbnails?.[0]}" 
             class="w-96 h-96 aspect-square rounded-2xl shadow-2xl object-cover mb-8"> 
        <h1 class="text-3xl font-bold text-white mb-4 leading-tight text-center">${data.title}</h1>
        <div class="flex items-center gap-3 text-white text-base mb-6"> 
          <span>${formatDuration(data.duration)}</span>
          <span>•</span>
          <span>${data.popularity || 0} lượt nghe</span>
        </div>
        <button class="px-8 py-3 bg-white text-black rounded-full font-semibold hover:scale-105 transition mb-8">
          <i class="fas fa-play mr-2"></i> Phát nhạc
        </button>
      </div>
      <div class="w-1/2" id="song-content">
        ${albumTracks.length > 0 ? renderAlbumSection(data.album) : ''}
        ${playlists.length > 0 ? renderPlaylistsSection(playlists) : ''}
        ${relatedSongs.length > 0 ? renderRelatedSection(relatedSongs) : ''}
      </div>
    </div>
  `;
  const imgElements = Array.from(heroContainer.querySelectorAll("img"));
  await Promise.all(
    imgElements.map(
      (img) =>
        new Promise((resolve) => {
          if (img.complete) resolve();
          else {
            img.onload = img.onerror = () => resolve();
          }
        })
    )
  );
  setupPlaylistClickHandlers();
}

function renderAlbumSection(album) {
  if (!album?.album || !album.tracks) return '';
  return `
    <div class="mb-12">
      <h2 class="text-2xl font-bold text-white mb-6">Album: ${album.album.title}</h2>
      <div class="space-y-2">
        ${album.tracks.map((track, i) => `
          <div class="group flex items-center gap-4 py-3 px-4 rounded-lg hover:bg-gray-800 cursor-pointer transition-colors">
            <span class="text-gray-400 w-8 text-base font-medium">${i + 1}</span>
            <div class="relative w-12 h-12 flex-shrink-0">
              <img src="${track.thumbnails?.[0] || ""}" 
                   class="w-full h-full rounded object-cover"
                   onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2248%22 height=%2248%22%3E%3Crect fill=%22%23374151%22 width=%22100%25%22 height=%22100%25%22/%3E%3C/svg%3E'">
              <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center rounded">
                <div class="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                  <i class="fas fa-play text-gray-900 text-xs ml-0.5"></i>
                </div>
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="text-white font-medium truncate">${track.title}</h3>
            </div>
            <span class="text-gray-400 text-sm font-medium">${formatDuration(track.duration)}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderPlaylistsSection(playlists) {
  return `
    <div class="mb-12">
      <h2 class="text-2xl font-bold text-white mb-6">Có trong playlist</h2>
      <div class="grid grid-cols-2 gap-4">
        ${playlists.map(playlist => `
          <div class="group cursor-pointer" data-playlist-slug="${playlist.slug}">
            <div class="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition">
              <img src="${playlist.thumbnails?.[0]}" 
                   class="w-full aspect-video rounded-lg mb-3 object-cover"
                   onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22320%22 height=%22180%22%3E%3Crect fill=%22%23374151%22 width=%22100%25%22 height=%22100%25%22/%3E%3C/svg%3E'">
              <h3 class="text-white font-semibold truncate group-hover:text-blue-400">${playlist.title}</h3>
              <p class="text-gray-400 text-sm">${playlist.tracks?.length || 0} bài hát</p>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderRelatedSection(songs) {
  return `
    <div class="mb-12">
      <h2 class="text-2xl font-bold text-white mb-6">Bài hát liên quan</h2>
      <div class="space-y-2">
        ${songs.map((song, i) => `
          <div class="group flex items-center gap-4 py-3 px-4 rounded-lg hover:bg-gray-800 cursor-pointer transition-colors"
               onclick="window.location.href='/song/details/${song.id}'">
            <span class="text-gray-400 w-8 text-base font-medium">${i + 1}</span>
            <div class="relative w-12 h-12 flex-shrink-0">
              <img src="${song.thumbnails?.[0] || ""}" 
                   class="w-full h-full rounded object-cover"
                   onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2248%22 height=%2248%22%3E%3Crect fill=%22%23374151%22 width=%22100%25%22 height=%22100%25%22/%3E%3C/svg%3E'">
              <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center rounded">
                <div class="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                  <i class="fas fa-play text-gray-900 text-xs ml-0.5"></i>
                </div>
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="text-white font-medium truncate group-hover:text-blue-400">${song.title}</h3>
            </div>
            <span class="text-gray-400 text-sm font-medium">${formatDuration(song.duration)}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function setupPlaylistClickHandlers() {
  const playlistCards = document.querySelectorAll('[data-playlist-slug]');
  playlistCards.forEach(card => {
    card.addEventListener('click', (e) => {
      e.preventDefault();
      const slug = card.dataset.playlistSlug;
      if (currentRouter && slug) {
        currentRouter.navigate(`/playlist/details/${slug}`);
      }
    });
  });
}

function hideLoading() {
  document.querySelector("#song-loading-overlay")?.remove();
}

function formatDuration(sec = 0) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}