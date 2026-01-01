import { Header } from "../components/header";
import { Sidebar } from "../components/Sidebar";
import { initSidebarToggle } from "./home";
import { initSearchHandler } from "../utils/initSearchHandler";
import {
  playSong,
  syncWithYouTubePlayer,
  stopAudioPlayback,
  stopYouTubeSync,
  setVolume,
  toggleMute,
  getPlayerState,
  playNext,
} from "../utils/Playbar";

let currentRouter = null;
let player = null;
let modalPlayer = null;
let currentVideoData = null;
let currentVideos = [];
let mainPlayerVolumeCheckInterval = null;
let modalPlayerVolumeCheckInterval = null;
let modalShouldAutoplay = false;
let pendingPlaybackTransfer = false;

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

function startMainPlayerVolumeMonitoring() {
  if (mainPlayerVolumeCheckInterval) {
    clearInterval(mainPlayerVolumeCheckInterval);
  }

  let lastVolume = null;
  let lastMutedState = null;

  mainPlayerVolumeCheckInterval = setInterval(() => {
    if (!player || !player.getVolume) return;

    try {
      const volume = Math.round(player.getVolume());
      const isMuted = player.isMuted();
      if (volume !== lastVolume || isMuted !== lastMutedState) {
        lastVolume = volume;
        lastMutedState = isMuted;

        document.dispatchEvent(
          new CustomEvent("mainPlayerVolumeChanged", {
            detail: { volume, isMuted },
          })
        );
      }
    } catch (e) {
      console.warn("[Main Player Volume Monitor] Error:", e);
    }
  }, 500);
}

function stopMainPlayerVolumeMonitoring() {
  if (mainPlayerVolumeCheckInterval) {
    clearInterval(mainPlayerVolumeCheckInterval);
    mainPlayerVolumeCheckInterval = null;
  }
}

function startModalPlayerVolumeMonitoring() {
  if (modalPlayerVolumeCheckInterval) {
    clearInterval(modalPlayerVolumeCheckInterval);
  }

  let lastVolume = null;
  let lastMutedState = null;

  modalPlayerVolumeCheckInterval = setInterval(() => {
    if (!modalPlayer || !modalPlayer.getVolume) return;

    try {
      const volume = Math.round(modalPlayer.getVolume());
      const isMuted = modalPlayer.isMuted();
      if (volume !== lastVolume || isMuted !== lastMutedState) {
        lastVolume = volume;
        lastMutedState = isMuted;

        document.dispatchEvent(
          new CustomEvent("modalPlayerVolumeChanged", {
            detail: { volume, isMuted },
          })
        );
      }
    } catch (e) {
      console.warn("[Modal Player Volume Monitor] Error:", e);
    }
  }, 500);
}

function stopModalPlayerVolumeMonitoring() {
  if (modalPlayerVolumeCheckInterval) {
    clearInterval(modalPlayerVolumeCheckInterval);
    modalPlayerVolumeCheckInterval = null;
  }
}

function createYouTubePlayer(videoId, containerId = "youtube-player") {
  if (!window.YT || !window.YT.Player) {
    setTimeout(() => createYouTubePlayer(videoId, containerId), 100);
    return;
  }
  if (containerId === "youtube-player" && player) {
    player.destroy();
    stopMainPlayerVolumeMonitoring();
  } else if (containerId === "modal-youtube-player" && modalPlayer) {
    modalPlayer.destroy();
    stopModalPlayerVolumeMonitoring();
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
    startMainPlayerVolumeMonitoring();
    if (window.currentVideoPageData) {
      window.currentVideoPageData.player = newPlayer;
    }
  } else {
    modalPlayer = newPlayer;
    startModalPlayerVolumeMonitoring();
  }

  return newPlayer;
}

function syncModalPlayerWithMainPlayer() {
  if (!player || !modalPlayer) return;

  try {
    const mainTime = player.getCurrentTime();
    modalPlayer.seekTo(mainTime, true);

    const mainVolume = player.getVolume();
    const mainIsMuted = player.isMuted();

    modalPlayer.setVolume(mainVolume);
    if (mainIsMuted) {
      modalPlayer.mute();
    } else {
      modalPlayer.unMute();
    }
  } catch (e) {
    console.warn("[Modal Sync] Error:", e);
  }
}

function syncMainPlayerWithModalPlayer() {
  if (!player || !modalPlayer) return;

  try {
    const modalTime = modalPlayer.getCurrentTime();
    player.seekTo(modalTime, true);

    const modalVolume = modalPlayer.getVolume();
    const modalIsMuted = modalPlayer.isMuted();

    player.setVolume(modalVolume);
    if (modalIsMuted) {
      player.mute();
    } else {
      player.unMute();
    }
  } catch (e) {
    console.warn("[Main Player Sync] Error:", e);
  }
}

function onPlayerReady(event, containerId) {
  const playerInstance =
    containerId === "youtube-player" ? player : modalPlayer;

  if (containerId === "youtube-player") {
    if (playerInstance && typeof syncWithYouTubePlayer === "function") {
      stopAudioPlayback();
      syncWithYouTubePlayer(playerInstance, currentVideoData, currentVideos);
      if (window.currentVideoPageData) {
        window.currentVideoPageData.player = playerInstance;
      }
    }
  } else if (containerId === "modal-youtube-player") {
    setTimeout(() => {
      try {
        stopAudioPlayback();
      } catch (e) {}

      try {
        if (player && player.pauseVideo) {
          player.pauseVideo();
        }
      } catch (e) {
        console.warn("[Modal Open] Error pausing main player:", e);
      }

      if (!modalPlayer) {
        modalShouldAutoplay = false;
        return;
      }

      try {
        const last = window.playbarLastState || {};
        if (last && (last.currentTime || last.currentTime === 0)) {
          try {
            if (typeof modalPlayer.seekTo === "function")
              modalPlayer.seekTo(last.currentTime || 0, true);
          } catch (err) {}

          try {
            if (
              Number.isFinite(last.volume) &&
              typeof setVolume === "function"
            ) {
              setVolume(Math.round(last.volume));
            }
         
            try {
              const state = getPlayerState();
              if (
                last.isMuted &&
                !state.isMuted &&
                typeof toggleMute === "function"
              )
                toggleMute();
              if (
                !last.isMuted &&
                state.isMuted &&
                typeof toggleMute === "function"
              )
                toggleMute();
            } catch (err) {}
          } catch (err) {}

        
          if (last.isPlaying) {
            try {
              if (typeof stopYouTubeSync === "function") stopYouTubeSync();
            } catch (err) {}
          }

          try {
            if (typeof syncWithYouTubePlayer === "function") {
              syncWithYouTubePlayer(
                modalPlayer,
                currentVideoData,
                currentVideos
              );
            }
          } catch (err) {
            console.warn("[Modal Open] Error syncing modal with playbar:", err);
          }

          try {
            const shouldPlay = !!(last.isPlaying || modalShouldAutoplay);
            if (shouldPlay) {
              if (modalPlayer.playVideo) {
                modalPlayer.playVideo();
              }
            } else {
              if (modalPlayer.pauseVideo) {
                try {
                  modalPlayer.pauseVideo();
                } catch (e) {}
              }
            }
          } catch (e) {
            console.warn("[Modal Open] Error controlling modal playback:", e);
          }
        } else {
       
          if (modalPlayer && typeof syncWithYouTubePlayer === "function") {
            syncModalPlayerWithMainPlayer();
            syncWithYouTubePlayer(modalPlayer, currentVideoData, currentVideos);

            try {
              const shouldPlay = !!modalShouldAutoplay;
              if (shouldPlay) {
                if (modalPlayer.playVideo) {
                  modalPlayer.playVideo();
                }
              } else {
                if (modalPlayer.pauseVideo) {
                  try {
                    modalPlayer.pauseVideo();
                  } catch (e) {}
                }
              }
            } catch (e) {
              console.warn("[Modal Open] Error controlling modal playback:", e);
            }
          } else {
            syncModalPlayerWithMainPlayer();
            if (!modalShouldAutoplay) {
              try {
                if (modalPlayer && modalPlayer.pauseVideo)
                  modalPlayer.pauseVideo();
              } catch (e) {}
              try {
                updateModalPlayButton();
                updatePlayButton();
              } catch (e) {}
            }
          }
        }
      } catch (e) {
        console.warn("[Modal Open] Error during transfer logic:", e);
      }

      modalShouldAutoplay = false;
    }, 100);
  }
}

function onPlayerStateChange(event, containerId) {
  if (event.data === 0) {
    const state = getPlayerState();
    if (state.isRepeat && currentVideoData && currentVideoData.videoId) {
      const targetPlayer =
        containerId === "youtube-player" ? player : modalPlayer;
      if (targetPlayer && targetPlayer.seekTo) {
        try {
          targetPlayer.seekTo(0, true);
          setTimeout(() => {
            try {
              if (targetPlayer.playVideo) targetPlayer.playVideo();
            } catch (e) {
              console.warn("[Repeat] Error playing video:", e);
            }
          }, 100);
        } catch (e) {
          console.warn("[Repeat] Error restarting video:", e);
        }
      }
    } else if (
      state.playlist &&
      state.playlist.length > 0 &&
      state.isVideoMode
    ) {
      playNext();
    } else {
      playNextVideo();
    }
  }
}

function playNextVideo() {
  const state = getPlayerState();
  if (state.isVideoMode && state.playlist && state.playlist.length > 0) {
    playNext();
  } else if (currentVideos.length === 0) {
    return;
  } else {
    const currentIndex = currentVideos.findIndex(
      (v) => v.id === currentVideoData?.id
    );
    let nextIndex;
    if (state.isShuffle) {
      nextIndex = Math.floor(Math.random() * currentVideos.length);
    } else {
      nextIndex = (currentIndex + 1) % currentVideos.length;
    }
    const nextVideo = currentVideos[nextIndex];
    if (nextVideo && nextVideo.videoId) {
      loadVideoInPlayer(nextVideo.videoId);
      updateHero(nextVideo);
      updateVideoSelection(nextIndex);
      currentVideoData = nextVideo;
    }
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
    
      const state = getPlayerState();
      if (
        state.youtubePlayer &&
        typeof state.youtubePlayer.getIframe === "function"
      ) {
        try {
          const iframe = state.youtubePlayer.getIframe();
          const container = document.querySelector("#youtube-player");
          if (iframe && container && iframe.parentNode !== container) {
            container.appendChild(iframe);
          }
          player = state.youtubePlayer;
          startMainPlayerVolumeMonitoring();
          if (window.currentVideoPageData)
            window.currentVideoPageData.player = player;
          if (typeof syncWithYouTubePlayer === "function") {
            syncWithYouTubePlayer(player, currentVideoData, currentVideos);
          }
        } catch (e) {
          console.warn("[VideoDetails] Error reusing global YT player:", e);
          setTimeout(() => createYouTubePlayer(videoData.videoId), 100);
        }
      } else {
        setTimeout(() => createYouTubePlayer(videoData.videoId), 100);
      }
    }

    await waitForThumbnailsToLoad();
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
              <span>Thời lượng: ${formatDuration(data.duration)}</span>
            </div>
            <div class="flex items-center gap-2">
              <span>${formatViews(data.popularity)} lượt xem</span>
            </div>
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
  setupModalEventListeners();

  (function setupPersistHandlers() {
    const appEl = document.querySelector("#app");
    const heroEl = document.querySelector("#video-hero");
    if (!appEl || !heroEl) return;

    const persistPlayer = () => {
      try {
        if (!player) return;
        let wasPlaying = false;
        let currentTime = 0;
        try {
          if (typeof player.getPlayerState === "function") {
            wasPlaying = player.getPlayerState() === 1;
          }
        } catch (e) {}
        try {
          if (typeof player.getCurrentTime === "function") {
            currentTime = Number(player.getCurrentTime()) || 0;
          }
        } catch (e) {}

        let globalEl = document.querySelector("#global-youtube-container");
        if (!globalEl) {
          globalEl = document.createElement("div");
          globalEl.id = "global-youtube-container";
          globalEl.style.display = "none";
          document.body.appendChild(globalEl);
        }

        try {
          if (typeof player.getIframe === "function") {
            const iframe = player.getIframe();
            if (iframe && iframe.parentNode !== globalEl) {
              globalEl.appendChild(iframe);
            }
          }
        } catch (e) {
          console.warn("[Persist Player] Error moving iframe:", e);
        }

        if (typeof syncWithYouTubePlayer === "function") {
          syncWithYouTubePlayer(player, currentVideoData, currentVideos);
        }

        setTimeout(() => {
          try {
            document.dispatchEvent(
              new CustomEvent("playerHandOff", {
                detail: {
                  wasPlaying,
                  currentTime,
                  playerInstance: player,
                  videoData: currentVideoData,
                  videoList: currentVideos,
                },
              })
            );
          } catch (e) {
            console.warn(
              "[Persist Player] Error dispatching handoff event:",
              e
            );
          }
        }, 30);

        try {
          stopMainPlayerVolumeMonitoring();
        } catch (e) {}
        if (
          window.currentVideoPageData &&
          window.currentVideoPageData.player === player
        ) {
          delete window.currentVideoPageData.player;
        }

        setTimeout(() => {
          try {
            player = null;
          } catch (e) {}
        }, 200);
      } catch (e) {
        console.warn("[Persist Player] Error:", e);
      }
    };

    const onDocClick = (evt) => {
      try {
        const a = evt.target.closest && evt.target.closest("a[href]");
        if (!a) return;
        const href = a.getAttribute("href");
        if (!href) return;
       
        if (href.startsWith("http") && !href.startsWith(window.location.origin))
          return;
        const url = new URL(href, window.location.href);
        if (url.pathname !== window.location.pathname) {
          persistPlayer();
        }
      } catch (e) {}
    };

    const onPop = () => persistPlayer();

    document.addEventListener("click", onDocClick, true);
    window.addEventListener("popstate", onPop);

    const observer = new MutationObserver(() => {
      if (!document.body.contains(heroEl)) {
        persistPlayer();
        observer.disconnect();
        document.removeEventListener("click", onDocClick, true);
        window.removeEventListener("popstate", onPop);
      }
    });

    observer.observe(appEl, { childList: true, subtree: true });
  })();
}

function setupModalEventListeners() {
  document.addEventListener("modalVideoChanged", handleModalVideoChange);

  document.addEventListener("playerModalOpened", (e) => {
    const isVideoMode = e.detail?.isVideoMode;
    modalShouldAutoplay =
      !!e.detail?.isPlaying && !window.playbarLastState?.isPlaying;
    if (window.playbarLastState?.isPlaying) {
     
      pendingPlaybackTransfer = true;
    }

    if (isVideoMode && currentVideoData && currentVideoData.videoId) {
      setTimeout(() => {
        createYouTubePlayer(currentVideoData.videoId, "modal-youtube-player");
        setTimeout(() => {
          try {
            const last = window.playbarLastState || {};
            if (window.YT && window.YT.get) {
              const mp = window.YT.get("modal-youtube-player");
              if (mp && typeof mp.seekTo === "function") {
                mp.seekTo(last.currentTime || 0, true);
                try {
                  if (typeof mp.setVolume === "function")
                    mp.setVolume(
                      Number.isFinite(last.volume)
                        ? Math.round(last.volume)
                        : 100
                    );
                  if (last.isMuted) {
                    if (typeof mp.mute === "function") mp.mute();
                  } else {
                    if (typeof mp.unMute === "function") mp.unMute();
                  }
                  if (last.isPlaying || !!e.detail?.isPlaying) {
                    if (typeof mp.playVideo === "function") mp.playVideo();
                  } else if (typeof mp.pauseVideo === "function")
                    mp.pauseVideo();
                } catch (err) {}
              }
            }
          } catch (err) {}
        }, 250);
      }, 100);
    }
  });

  document.addEventListener("playerModalClosed", () => {
    if (modalPlayer && player) {
      try {
        let modalWasPlaying = false;
        try {
          if (modalPlayer && modalPlayer.getPlayerState) {
            modalWasPlaying = modalPlayer.getPlayerState() === 1;
          }
        } catch (e) {}
        syncMainPlayerWithModalPlayer();

        if (typeof syncWithYouTubePlayer === "function") {
          syncWithYouTubePlayer(player, currentVideoData, currentVideos);
        }
        try {
          if (modalWasPlaying) {
            if (player && player.playVideo) {
              player.playVideo();
            }
          } else {
            if (player && player.pauseVideo) {
              player.pauseVideo();
            }
          }
        } catch (e) {
          console.warn("[Modal Close] Error controlling main player:", e);
        }
      } catch (e) {
        console.warn("[Modal Close] Error resuming main player:", e);
      }

      try {
        if (modalPlayer && modalPlayer.pauseVideo) {
          modalPlayer.pauseVideo();
        }
      } catch (e) {
        console.warn("[Modal Close] Error pausing modal player:", e);
      }
    }
  });
  document.addEventListener("playerSongChanged", (event) => {
    const { song, skipSync, index } = event.detail || {};
    if (!song) return;
    currentVideoData = song;
    updateHero(song);
    let foundIndex = currentVideos.findIndex((v) => v.id === song.id);
    if (typeof index === "number" && index >= 0) {
      foundIndex = index;
    }

    if (foundIndex !== -1) {
      updateVideoSelection(foundIndex);
    }
    if (!skipSync) {
      try {
        stopAudioPlayback();
      } catch (e) {}
    }
  });

  document.addEventListener("modalPlayerVolumeChanged", (event) => {
    const { volume: newVolume, isMuted: newIsMuted } = event.detail;

    document.dispatchEvent(
      new CustomEvent("mainPlayerVolumeChanged", {
        detail: { volume: newVolume, isMuted: newIsMuted },
      })
    );
  });
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
    if (modalPlayer && modalPlayer.loadVideoById) {
      try {
        modalPlayer.loadVideoById(video.videoId);
        setTimeout(() => {
          try {
            if (modalPlayer.playVideo) modalPlayer.playVideo();
          } catch (e) {}
        }, 100);
      } catch (e) {
        console.warn("[Handle Modal Change] Error loading modal player:", e);
      }
    }
    if (player && player.pauseVideo) {
      try {
        player.pauseVideo();
      } catch (e) {
        console.warn("[Handle Modal Change] Error pausing main player:", e);
      }
    }
  }
  if (modalPlayer && typeof syncWithYouTubePlayer === "function") {
    syncWithYouTubePlayer(modalPlayer, video, currentVideos);
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
      currentVideos = videos;
      updateHero(video);

      if (videoId) {
        stopAudioPlayback();
        loadVideoInPlayer(videoId);
        setTimeout(() => {
          try {
            if (player && player.seekTo) {
              player.seekTo(0, true);
            }
            if (player && player.playVideo) {
              player.playVideo();
            }
          } catch (e) {}
        }, 100);
      }

      if (player && typeof syncWithYouTubePlayer === "function") {
        syncWithYouTubePlayer(player, video, videos, false);
      }
    });
  });
}

function updateHero(video) {
  const title = document.querySelector("#video-hero h1");
  const durationSpan = document.querySelector(
    "#video-hero .flex.items-center.justify-center.gap-6 > div:first-child span"
  );
  const viewsSpan = document.querySelector(
    "#video-hero .flex.items-center.justify-center.gap-6 > div:last-child span"
  );

  if (title) title.textContent = video.title || "";
  if (durationSpan)
    durationSpan.textContent = `Thời lượng: ${formatDuration(video.duration)}`;
  if (viewsSpan)
    viewsSpan.textContent = `${formatViews(video.popularity)} lượt xem`;
}

async function waitForThumbnailsToLoad() {
  const images = document.querySelectorAll("#video-hero img");
  const imagePromises = Array.from(images).map((img) => {
    if (img.complete) return Promise.resolve();
    return new Promise((resolve, reject) => {
      img.addEventListener("load", resolve);
      img.addEventListener("error", resolve);
      setTimeout(resolve, 3000);
    });
  });
  await Promise.all(imagePromises);
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
