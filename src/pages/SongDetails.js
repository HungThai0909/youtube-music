import { Header } from "../components/header";
import { Sidebar } from "./components/Sidebar";
import { initSidebarToggle } from "./home";
import { initSearchHandler } from "../utils/initSearchHandler";
import { playSong } from "../utils/Playbar";

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
  initSearchHandler();
  loadSongDetail(songId);
};

export const setSongDetailRouter = (router) => {
  currentRouter = router;
};

async function fetchSong(id) {
  const res = await fetch(
    `${import.meta.env.VITE_BASE_URL}/songs/details/${id}`
  );
  if (!res.ok) throw new Error("Fetch song failed");
  return res.json();
}

async function loadSongDetail(id) {
  try {
    const songData = await fetchSong(id);
    let albumTracks = songData.album?.tracks || [];
    if (!Array.isArray(albumTracks)) albumTracks = [];

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
  if (!tracks || tracks.length === 0) {
    return `
      <p class="text-gray-400 text-center py-8">
        Không có bài hát nào
      </p>
    `;
  }

  return `
    <div class="mb-12">
      <h2 class="text-2xl font-bold text-white mb-4">
        Danh sách bài hát
      </h2>
      <div class="space-y-2">
        ${tracks
          .map(
            (t, i) => `
          <div
            class="track-item group flex items-center gap-4 py-3 px-4
                   rounded-lg hover:bg-gray-800 cursor-pointer transition"
            data-track-index="${i}">
            <span class="text-gray-400 w-8 text-lg font-medium">
              ${i + 1}
            </span>
            <div class="relative w-14 h-14 rounded-lg overflow-hidden shadow-md">
              <img
                src="${t.thumbnails?.[0] || ""}"
                class="w-full h-full object-cover"/>
              <div
                class="absolute inset-0 bg-black/40 opacity-0
                       group-hover:opacity-100 transition
                       flex items-center justify-center">
                <div class="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                  <i class="fas fa-play text-gray-900 text-sm ml-0.5"></i>
                </div>
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="text-white font-medium truncate">
                ${t.title}
              </h3>
              <p class="text-gray-400 text-xs truncate">
                ${t.artist || ""}
              </p>
            </div>
            <span class="text-gray-400 text-sm font-medium">
              ${formatDuration(t.duration)}
            </span>
          </div>`
          )
          .join("")}
      </div>
    </div>
  `;
}

async function renderHero(data) {
  const hero = document.querySelector("#song-hero");
  const albumTracks = data.album?.tracks || [];
  const playlists = data.playlists || [];
  const related = data.related || [];
  const map = new Map();
  albumTracks.forEach((t) => t?.id && map.set(t.id, t));
  playlists.forEach((pl) =>
    (pl.tracks || []).forEach(
      (t) => t?.id && !map.has(t.id) && map.set(t.id, t)
    )
  );
  related.forEach((t) => t?.id && !map.has(t.id) && map.set(t.id, t));

  const combinedTracks = [...map.values()];

  window.currentSongPageData = {
    song: data,
    combinedTracks,
  };

  hero.innerHTML = `
    <div class="flex gap-12">
      <div class="w-1/2 sticky top-20 self-start text-center">
        <img
          src="${data.thumbnails?.[0]}"
          class="w-96 h-96 rounded-2xl shadow-2xl object-cover mx-auto mb-8"
        />
        <h1 class="text-3xl font-bold text-white mb-4">
          ${data.title}
        </h1>
        <div class="text-white">
          Thời lượng: ${formatDuration(data.duration)}
        </div>
      </div>

      <div class="w-1/2 min-h-[200vh]">
        ${
          combinedTracks.length
            ? renderTracksList(combinedTracks)
            : `<p class="text-gray-400">Không có bài hát</p>`
        }
      </div>
    </div>
  `;

  setupTrackClickHandlers(combinedTracks);
}

function setupTrackClickHandlers(tracks) {
  document.querySelectorAll(".track-item").forEach((item) => {
    item.addEventListener("click", () => {
      const index = Number(item.dataset.trackIndex);
      const track = tracks[index];
      if (!track) return;
      updateHero(track);
      playSong(track, tracks, index);
    });
  });
}

function updateHero(song) {
  const img = document.querySelector("#song-hero img");
  const title = document.querySelector("#song-hero h1");

  if (img) img.src = song.thumbnails?.[0] || "";
  if (title) title.textContent = song.title || "";
}

function hideLoading() {
  document.querySelector("#song-loading-overlay")?.remove();
}

function formatDuration(sec = 0) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
