import { Header } from "../components/header";
import { Sidebar } from "../components/sidebar";
import { initSidebarToggle } from "./home";
import { playSong } from "../components/Playbar";

let currentRouter = null;
export const SongDetail = (match) => {
  const app = document.querySelector("#app");
  const songId = match?.data?.id;

  app.innerHTML = `
    ${Header()}
    <div class="flex pt-[64px]">
      <div class="w-22">${Sidebar()}</div>
      <main class="flex-1 pb-28">
        <div
          id="song-loading-overlay"
          class="fixed inset-0 z-[100] bg-black/60 flex flex-col items-center justify-center">
          <div class="w-16 h-16 border-4 border-gray-700 border-t-white rounded-full animate-spin"></div>
        </div>
        <div class="px-12 py-8 max-w-[1400px] mx-auto">
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

async function fetchSong(id) {
  const url = `${import.meta.env.VITE_BASE_URL}/songs/details/${id}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Fetch song failed");
  return res.json();
}

async function fetchAlbumTracks(albumId) {
  const url = `${
    import.meta.env.VITE_BASE_URL
  }/albums/details/${albumId}?limit=50`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Fetch album tracks failed");
  return res.json();
}

async function loadSongDetail(id) {
  try {
    const songData = await fetchSong(id);
    let albumTracks = songData.album?.tracks || [];
    const albumId = songData.album?.album?.id;
    if (albumId) {
      const albumData = await fetchAlbumTracks(albumId);
      if (Array.isArray(albumData.tracks)) {
        albumTracks = albumData.tracks;
      }
    }
    if (songData.album) {
      songData.album.tracks = albumTracks;
    }
    await renderHero(songData);
    hideLoading();
  } catch (err) {
    console.error(err);
    hideLoading();
  }
}

function renderTracksList(tracks) {
  if (!tracks || tracks.length === 0)
    return '<p class="text-gray-400 text-center py-8">Không có bài hát nào</p>';
  return `
    <div class="mb-12">
      <h2 class="text-2xl font-bold text-white mb-4">Danh sách bài hát</h2>
      <div class="space-y-2">
        ${tracks
          .map(
            (t, i) => `
            <div class="track-item group flex items-center gap-4 py-3 px-4 rounded-lg hover:bg-gray-800 cursor-pointer transition-colors" data-track-index="${i}">
              <span class="text-gray-400 w-8 text-lg font-medium">${
                i + 1
              }</span>
              <div class="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 shadow-md relative">
                <img src="${
                  t.thumbnails?.[0] || ""
                }" class="w-full h-full object-cover" />
                <div class="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg">
                  <div class="w-8 h-8 bg-white rounded-full flex items-center justify-center"><i class="fas fa-play text-gray-900 text-sm ml-0.5"></i></div>
                </div>
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-white font-medium truncate">${t.title}</h3>
                <p class="text-gray-400 text-xs truncate">${t.artist || ""}</p>
              </div>
              <span class="text-gray-400 text-sm font-medium">${formatDuration(
                t.duration
              )}</span>
            </div>
        `
          )
          .join("")}
      </div>
    </div>
  `;
}

async function renderHero(data) {
  const heroContainer = document.querySelector("#song-hero");
  const albumTracks = data.album?.tracks || [];
  const playlists = data.playlists || [];
  const related = data.related || [];
  const combinedMap = new Map();
  albumTracks.forEach((t) => t?.id && combinedMap.set(t.id, t));
  playlists.forEach((pl) => {
    (pl.tracks || []).forEach((t) => {
      if (t?.id && !combinedMap.has(t.id)) combinedMap.set(t.id, t);
    });
  });
  related.forEach(
    (t) => t?.id && !combinedMap.has(t.id) && combinedMap.set(t.id, t)
  );
  const combinedTracks = Array.from(combinedMap.values());

  window.currentSongPageData = {
    song: data,
    albumTracks,
    playlists,
    related,
    combinedTracks,
  };

  heroContainer.innerHTML = `
    <div class="flex gap-12">
      <div class="w-1/2 sticky top-20 self-start flex flex-col items-center">
        <img
          src="${data.thumbnails?.[0]}"
          class="w-96 h-96 rounded-2xl shadow-2xl object-cover mb-8"
        />
        <h1 class="text-3xl font-bold text-white mb-4 text-center">
          ${data.title}
        </h1>
        <div class="flex items-center gap-3 text-white text-base">
          <span>Thời lượng: ${formatDuration(data.duration)}</span>
        </div>
      </div>
      <div class="w-1/2 min-h-[200vh]" id="song-content">
        ${
          combinedTracks.length
            ? renderTracksList(combinedTracks)
            : '<p class="text-gray-400">Không có bài hát</p>'
        }
      </div>
    </div>
  `;

  const imgElements = Array.from(heroContainer.querySelectorAll("img"));
  await Promise.all(
    imgElements.map(
      (img) =>
        new Promise((resolve) => {
          if (img.complete) resolve();
          else img.onload = img.onerror = () => resolve();
        })
    )
  );

  window.currentDisplayedSong = data;
  setupTrackClickHandlers(data, combinedTracks);
}

function renderAlbumSection(album) {
  if (!album?.album || !album.tracks) return "";

  return `
    <div class="mb-12">
      <h2 class="text-2xl font-bold text-white mb-4">
        Album: ${album.album.title}
      </h2>

      <div class="space-y-2">
        ${album.tracks
          .map(
            (track, i) => `
          <div
            class="group flex items-center gap-4 py-3 px-4 rounded-lg
                   hover:bg-gray-800 cursor-pointer transition-colors track-item"
            data-track-index="${i}"
          >
            <span class="text-gray-400 w-8 text-sm font-medium">${i + 1}</span>

            <div class="relative w-12 h-12 flex-shrink-0">
              <img
                src="${track.thumbnails?.[0] || ""}"
                class="w-full h-full rounded object-cover"
              />
              <div
                class="absolute inset-0 bg-black/40 opacity-0
                       group-hover:opacity-100 transition
                       flex items-center justify-center rounded"
              >
                <div class="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                  <i class="fas fa-play text-gray-900 text-xs ml-0.5"></i>
                </div>
              </div>
            </div>

            <div class="flex-1 min-w-0">
              <h3 class="text-white font-medium truncate">${track.title}</h3>
            </div>

            <span class="text-gray-400 text-sm font-medium">
              ${formatDuration(track.duration)}
            </span>
          </div>
        `
          )
          .join("")}
      </div>
    </div>
  `;
}

function setupTrackClickHandlers(currentSong, albumTracks) {
  function updateHeroDisplay(song) {
    window.currentDisplayedSong = song;

    const img = document.querySelector("#song-hero img");
    const titleEl = document.querySelector("#song-hero h1");
    const metaEl = document.querySelector(
      "#song-hero .flex.items-center.gap-3"
    );

    if (img) img.src = song.thumbnails?.[0] || "";
    if (titleEl) titleEl.textContent = song.title || "";
    if (metaEl) {
      metaEl.innerHTML = `<span>Thời lượng: ${formatDuration(
        song.duration
      )}</span>`;
    }
  }

  document.querySelectorAll(".track-item").forEach((item) => {
    item.addEventListener("click", () => {
      const index = Number(item.dataset.trackIndex);
      const track = albumTracks[index];
      if (track) {
        updateHeroDisplay(track);
        playSong(track, albumTracks, index);
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
