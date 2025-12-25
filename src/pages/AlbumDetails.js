import { Header } from "../components/header";
import { Sidebar } from "./components/Sidebar";
import { initSidebarToggle } from "./home";
import { initSearchHandler } from "../utils/initSearchHandler";

let currentRouter = null;
export const AlbumDetail = (match) => {
  const app = document.querySelector("#app");
  const albumSlug = match?.data?.id;
  app.innerHTML = `
    ${Header()}
    <div class="flex pt-[64px]">
      <div class="w-22">${Sidebar()}</div>
      <main class="flex-1 ">
        <div id="album-loading-overlay"
          class="fixed inset-0 z-[100] bg-black/60 flex flex-col items-center justify-center">
          <div class="w-16 h-16 border-4 border-gray-700 border-t-white rounded-full animate-spin"></div>
        </div>
        <div class="px-12 py-8 max-w-[1400px] mx-auto">
          <div id="album-hero"></div>
        </div>
      </main>
    </div>
  `;
  initSidebarToggle();
  initSearchHandler();
  loadAlbumDetail(albumSlug);
};

export const setAlbumDetailRouter = (router) => {
  currentRouter = router;
};

async function loadAlbumDetail(slug) {
  try {
    const data = await fetchAlbum(slug);
    await renderHero(data);
    hideLoading();
    setupTrackClickHandlers();
  } catch (err) {
    console.error(err);
    hideLoading();
  }
}

async function fetchAlbum(slug) {
  const url = `${
    import.meta.env.VITE_BASE_URL
  }/albums/details/${slug}?limit=50`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Fetch failed");
  return res.json();
}

async function renderHero(data) {
  const tracks = data.tracks || [];
  const heroContainer = document.querySelector("#album-hero");
  heroContainer.innerHTML = `
    <div class="flex gap-12">
      <div class="w-1/2 sticky top-20 self-start flex flex-col items-center">
        <img
          src="${data.thumbnails?.[0]}"
          class="w-96 h-96 aspect-square rounded-2xl shadow-2xl object-cover mb-8"
        />
        <h1 class="text-xl font-bold text-white mb-4 leading-tight text-center">
          ${data.title}
        </h1>
        <div class="flex items-center gap-3 text-white text-base mb-2">
          <span>${data.songCount || tracks.length} bài hát</span>
          <span>•</span>
          <span>${formatTotalDuration(data.duration)}</span>
        </div>
        <p class="text-white text-base mb-2">
          ${data.popularity || 0} lượt nghe
        </p>
        <p class="text-gray-400 text-base mb-2">
          Loại album: ${data.albumType || "Album"}
        </p>
        <p class="text-gray-400 text-base text-center">
          Phát hành: ${formatReleaseDate(data.releaseDate)}
        </p>
      </div>
      <div class="w-1/2 min-h-[600px]" id="album-tracks-container">
        ${renderTracks(tracks)}
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
}

function renderTracks(tracks) {
  if (!tracks || tracks.length === 0) {
    return `<p class="text-gray-400 text-center py-8">Không có bài hát nào</p>`;
  }
  return tracks
    .map(
      (t, i) => `
      <div class="track-item group flex items-center gap-4 py-3 px-4 rounded-lg hover:bg-gray-800 cursor-pointer transition-colors" data-song-id="${
        t.videoId || t.id || ""
      }">
        <span class="text-gray-400 w-8 text-lg font-medium">${i + 1}</span>
        <div class="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 shadow-md">
          <img
            src="${t.thumbnails?.[0] || ""}"
            class="w-full h-full object-cover"
            onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2256%22 height=%2256%22%3E%3Crect fill=%22%23374151%22 width=%22100%25%22 height=%22100%25%22/%3E%3C/svg%3E'"
          />
          <div
            class="absolute inset-0 flex items-center justify-center
                   bg-black/40 opacity-0 group-hover:opacity-100
                   transition-opacity duration-200 cursor-pointer">
            <div
              class="w-8 h-8 bg-white rounded-full
                     flex items-center justify-center transition cursor-pointer">
              <i class="fas fa-play text-gray-900 text-xs ml-0.5"></i>
            </div>
          </div>
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="text-white font-medium truncate">${t.title}</h3>
          <p class="text-gray-400 text-sm truncate">
            ${t.artists?.join(", ") || "Various Artists"}
          </p>
        </div>
        <span class="text-gray-400 text-sm font-medium">
          ${formatDuration(t.duration)}
        </span>
      </div>
    `
    )
    .join("");
}

function setupTrackClickHandlers() {
  const trackItems = document.querySelectorAll(".track-item");
  trackItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      const songId = item.dataset.songId;
      if (currentRouter && songId) {
        currentRouter.navigate(`/song/details/${songId}`);
      }
    });
  });
}

function hideLoading() {
  document.querySelector("#album-loading-overlay")?.remove();
}

function formatDuration(sec = 0) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatTotalDuration(totalSeconds = 0) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) return `${hours} giờ ${minutes} phút`;
  return `${minutes} phút`;
}

function formatReleaseDate(dateString) {
  if (!dateString) return "Không rõ";
  const date = new Date(dateString);
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
