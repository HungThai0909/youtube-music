import { Header } from "../components/header";
import { Sidebar } from "../components/sidebar";
import { initSidebarToggle } from "./home";
import { initSearchHandler } from "../utils/initSearchHandler";
import { playSong, syncWithYouTubePlayer, stopAudioPlayback } from "../utils/Playbar";

let currentRouter = null;
let player = null;
let modalPlayer = null;
let currentVideoData = null;
let currentVideos = [];

export const VideoDetail = (match) => {
  const app = document.querySelector("#app");
  const videoId = match?.data?.id;
  app.innerHTML = `
    ${Header()}
    <div class="flex pt-[64px]">
      <div class="w-22">${Sidebar()}</div>
      <main class="flex-1 pb-28">
        <div
          id="video-loading-overlay"
          class="fixed inset-0 z-[100] bg-black/60 flex flex-col items-center justify-center">
          <div class="w-16 h-16 border-4 border-gray-700 border-t-white rounded-full animate-spin"></div>
        </div>
        <div class="px-12 py-8 max-w-[1400px] mx-auto">
          <div id="video-hero"></div>
        </div>
      </main>
    </div>
  `;

  initSidebarToggle();
  loadYouTubeAPI();
  loadVideoDetail(videoId);
  initSearchHandler();
};

export const setVideoDetailRouter = (router) => {
  currentRouter = router;
};

function loadYouTubeAPI() {
  if (window.YT && window.YT.Player) {
    return;
  }
  const tag = document.createElement("script");
  tag.src = "https://www.youtube.com/iframe_api";
  const firstScriptTag = document.getElementsByTagName("script")[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

function createYouTubePlayer(videoId, containerId = "youtube-player") {
  if (!window.YT || !window.YT.Player) {
    setTimeout(() => createYouTubePlayer(videoId, containerId), 100);
    return;
  }
  if (containerId === "youtube-player" && player) {
    player.destroy();
  } else if (containerId === "modal-youtube-player" && modalPlayer) {
    modalPlayer.destroy();
  }
  const newPlayer = new YT.Player(containerId, {
    height: "100%",
    width: "100%",
    videoId: videoId,
    playerVars: {
      autoplay: 0,
      controls: 1,
      modestbranding: 1,
      rel: 0,
    },
    events: {
      onReady: (e) => onPlayerReady(e, containerId),
      onStateChange: (e) => onPlayerStateChange(e, containerId),
    },
  });

  if (containerId === "youtube-player") {
    player = newPlayer;
  } else {
    modalPlayer = newPlayer;
  }

  return newPlayer;
}

function onPlayerReady(event, containerId) {
  const playerInstance =
    containerId === "youtube-player" ? player : modalPlayer;
  if (playerInstance && typeof syncWithYouTubePlayer === "function") {
    stopAudioPlayback();
    syncWithYouTubePlayer(playerInstance, currentVideoData, currentVideos);
  }
}

function onPlayerStateChange(event, containerId) {
  const playerInstance =
    containerId === "youtube-player" ? player : modalPlayer;
  if (event.data === 0) {
    playNextVideo();
  }
}

function playNextVideo() {
  if (currentVideos.length === 0) return;
  const currentIndex = currentVideos.findIndex(
    (v) => v.id === currentVideoData?.id
  );
  const nextIndex = (currentIndex + 1) % currentVideos.length;
  const nextVideo = currentVideos[nextIndex];
  if (nextVideo && nextVideo.videoId) {
    loadVideoInPlayer(nextVideo.videoId);
    updateHero(nextVideo);
    updateVideoSelection(nextIndex);
    currentVideoData = nextVideo;
  }
}

function loadVideoInPlayer(videoId) {
  if (player && player.loadVideoById) {
    player.loadVideoById(videoId);
  }
  if (modalPlayer && modalPlayer.loadVideoById) {
    modalPlayer.loadVideoById(videoId);
  }
}

async function fetchVideo(id) {
  const res = await fetch(
    `${import.meta.env.VITE_BASE_URL}/videos/details/${id}`
  );
  if (!res.ok) throw new Error("Fetch video failed");
  return res.json();
}

async function loadVideoDetail(id) {
  try {
    const videoData = await fetchVideo(id);
    let relatedVideos = videoData.related || [];
    if (!Array.isArray(relatedVideos)) relatedVideos = [];
    const playlists = videoData.playlists || [];
    const map = new Map();

    if (videoData?.id) {
      map.set(videoData.id, videoData);
    }

    relatedVideos.forEach((v) => v?.id && map.set(v.id, v));
    playlists.forEach((pl) =>
      (pl.tracks || []).forEach(
        (v) => v?.id && !map.has(v.id) && map.set(v.id, v)
      )
    );
    const combinedVideos = [...map.values()];
    currentVideoData = videoData;
    currentVideos = combinedVideos;

    await renderHero(videoData, combinedVideos);
    if (videoData.videoId) {
      setTimeout(() => {
        createYouTubePlayer(videoData.videoId);
      }, 100);
    }

    hideLoading();
  } catch (err) {
    console.error(err);
    hideLoading();
  }
}

function renderVideosList(videos) {
  if (!videos || videos.length === 0) {
    return `
      <p class="text-gray-400 text-center py-8">
        Không có video nào
      </p>
    `;
  }

  return `
    <div class="mb-12">
      <h2 class="text-2xl font-bold text-white mb-4">
        Video liên quan
      </h2>
      <div class="space-y-2">
        ${videos
          .map(
            (v, i) => `
          <div
            class="video-item group flex items-center gap-4 py-3 px-4
                   rounded-lg hover:bg-gray-800 cursor-pointer transition ${
                     i === 0 ? "bg-white/10" : ""
                   }"
            data-video-index="${i}"
            data-video-id="${v.videoId || ""}"
          >
            <span class="text-gray-400 w-8 text-lg font-medium">
              ${i + 1}
            </span>

            <div class="relative w-20 h-14 rounded-lg overflow-hidden shadow-md">
              <img
                src="${v.thumbnails?.[0] || ""}"
                class="w-full h-full object-cover"
              />
              <div
                class="absolute inset-0 bg-black/40 opacity-0
                       group-hover:opacity-100 transition
                       flex items-center justify-center"
              >
                <div class="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                  <i class="fas fa-play text-gray-900 text-sm ml-0.5"></i>
                </div>
              </div>
            </div>

            <div class="flex-1 min-w-0">
              <h3 class="text-white font-medium truncate ${
                i === 0 ? "text-cyan-400" : ""
              }">
                ${v.title}
              </h3>
              <p class="text-gray-400 text-xs truncate">
                ${formatViews(v.popularity)} lượt xem
              </p>
            </div>

            <span class="text-gray-400 text-sm font-medium">
              ${formatDuration(v.duration)}
            </span>
          </div>
        `
          )
          .join("")}
      </div>
    </div>
  `;
}

async function renderHero(data, combinedVideos) {
  const hero = document.querySelector("#video-hero");
  window.currentVideoPageData = {
    video: data,
    combinedVideos,
  };

  hero.innerHTML = `
    <div class="flex gap-12">
      <div class="w-1/2 sticky top-20 self-start">
        <div class="relative w-full mb-6 pb-[56.25%]">
          <div id="youtube-player" class="absolute inset-0 rounded-2xl overflow-hidden shadow-2xl"></div>
        </div>
        <div class="text-center">
          <h1 class="text-3xl font-bold text-white mb-4">
            ${data.title}
          </h1>
          <div class="flex items-center justify-center gap-6 text-gray-400 mb-4">
            <div class="flex items-center gap-2">
              <i class="fas fa-clock"></i>
              <span>${formatDuration(data.duration)}</span>
            </div>
            <div class="flex items-center gap-2">
              <i class="fas fa-eye"></i>
              <span>${formatViews(data.popularity)} lượt xem</span>
            </div>
          </div>
          <div class="flex items-center justify-center gap-3">
            <button id="play-audio-btn" class="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full font-semibold transition flex items-center gap-2">
              <i class="fas fa-music"></i>
              <span>Phát nhạc nền</span>
            </button>
            <button id="add-to-playlist-btn" class="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-full font-semibold transition flex items-center gap-2">
              <i class="fas fa-plus"></i>
              <span>Thêm vào playlist</span>
            </button>
          </div>
        </div>
      </div>
      <div class="w-1/2 min-h-[200vh]">
        ${
          combinedVideos.length
            ? renderVideosList(combinedVideos)
            : `<p class="text-gray-400">Không có video liên quan</p>`
        }
      </div>
    </div>
  `;

  setupVideoClickHandlers(data, combinedVideos);
  setupActionButtons(data, combinedVideos);
  document.addEventListener("modalVideoChanged", handleModalVideoChange);
}

function handleModalVideoChange(event) {
  const { index } = event.detail;
  const video = currentVideos[index];
  if (!video) return;

  currentVideoData = video;
  updateHero(video);
  updateVideoSelection(index);

  if (video.videoId) {
    stopAudioPlayback();
    loadVideoInPlayer(video.videoId);
  }

  if (player && typeof syncWithYouTubePlayer === "function") {
    syncWithYouTubePlayer(player, video, currentVideos);
  }
}

function updateVideoSelection(index) {
  document.querySelectorAll(".video-item").forEach((el, i) => {
    if (i === index) {
      el.classList.add("bg-white/10");
      const title = el.querySelector("h3");
      if (title) title.classList.add("text-cyan-400");
    } else {
      el.classList.remove("bg-white/10");
      const title = el.querySelector("h3");
      if (title) title.classList.remove("text-cyan-400");
    }
  });
}

function setupVideoClickHandlers(currentVideo, videos) {
  document.querySelectorAll(".video-item").forEach((item) => {
    item.addEventListener("click", () => {
      const index = Number(item.dataset.videoIndex);
      const videoId = item.dataset.videoId;
      const video = videos[index];
      if (!video) return;

      updateVideoSelection(index);

      currentVideoData = video;
      updateHero(video);
      if (videoId) {
        stopAudioPlayback();
        loadVideoInPlayer(videoId);
      }
      if (player && typeof syncWithYouTubePlayer === "function") {
        syncWithYouTubePlayer(player, video, videos);
      }

      document.dispatchEvent(
        new CustomEvent("videoDetailChanged", {
          detail: { index, video },
        })
      );
    });
  });

  document.addEventListener("playerModalOpened", (e) => {
    const isVideoMode = e.detail?.isVideoMode;
    if (isVideoMode && currentVideoData && currentVideoData.videoId) {
      setTimeout(() => {
        createYouTubePlayer(currentVideoData.videoId, "modal-youtube-player");
      }, 100);
    }
  });
}

function setupActionButtons(currentVideo, videos) {
  const playAudioBtn = document.querySelector("#play-audio-btn");
  if (playAudioBtn) {
    playAudioBtn.addEventListener("click", () => {
      playSong(currentVideo, videos, 0);
    });
  }
  const addToPlaylistBtn = document.querySelector("#add-to-playlist-btn");
  if (addToPlaylistBtn) {
    addToPlaylistBtn.addEventListener("click", () => {
      alert("Tính năng đang phát triển!");
    });
  }
}

function updateHero(video) {
  const title = document.querySelector("#video-hero h1");
  const duration = document
    .querySelector("#video-hero .fa-clock")
    ?.parentElement?.querySelector("span");
  const views = document
    .querySelector("#video-hero .fa-eye")
    ?.parentElement?.querySelector("span");

  if (title) title.textContent = video.title || "";
  if (duration) duration.textContent = formatDuration(video.duration);
  if (views) views.textContent = formatViews(video.popularity) + " lượt xem";
}

function hideLoading() {
  document.querySelector("#video-loading-overlay")?.remove();
}

function formatDuration(sec = 0) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s
      .toString()
      .padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatViews(views = 0) {
  if (!views) return "0";
  if (views >= 1000000000) return `${(views / 1000000000).toFixed(1)}B`;
  if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
  if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
  return views.toString();
}

export { player, modalPlayer, currentVideoData, currentVideos };
