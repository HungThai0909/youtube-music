import axiosInstance from "../axios";

let audioPlayer = null;
let currentSong = null;
let isPlaying = false;
let currentTime = 0;
let duration = 0;
let volume = parseInt(localStorage.getItem("player_volume")) || 100;
let prevVolume = volume;
let isMuted = localStorage.getItem("player_muted") === "true";
let isRepeat = false;
let isShuffle = false;
let playlist = [];
let currentIndex = -1;
let hasTrackedPlay = false;
let lastPlayRequestId = 0;
let isLoadingAudio = false;
let youtubePlayer = null;
let youtubeUpdateInterval = null;
let isVideoMode = false;
let volumeCheckInterval = null;
let isSyncing = false;

function initAudioPlayer() {
  if (!audioPlayer) {
    audioPlayer = new Audio();
    audioPlayer.addEventListener("loadedmetadata", onAudioLoaded);
    audioPlayer.addEventListener("timeupdate", onTimeUpdate);
    audioPlayer.addEventListener("ended", handleSongEnded);
    audioPlayer.addEventListener("play", () => {
      isPlaying = true;
      updatePlayButton();
      updateModalPlayButton();
    });
    audioPlayer.addEventListener("pause", () => {
      isPlaying = false;
      updatePlayButton();
      updateModalPlayButton();
    });
    audioPlayer.addEventListener("error", (e) => {
      console.error("[Player] Audio error:", e);
      isLoadingAudio = false;
      const playerEl = document.querySelector("#music-player-footer");
      if (playerEl) playerEl.removeAttribute("data-loading");
    });
    audioPlayer.volume = volume / 100;
    audioPlayer.muted = isMuted;
  }
}

function onAudioLoaded() {
  duration = audioPlayer.duration;
  updateDuration();
  updateModalDuration();
}

function onTimeUpdate() {
  currentTime = audioPlayer.currentTime;
  updateProgressBar();
  updateModalProgressBar();

  if (!hasTrackedPlay && currentTime > 3 && isPlaying && !audioPlayer.paused) {
    trackPlayEvent(currentSong.id);
    hasTrackedPlay = true;
  }
}

async function trackPlayEvent(songId) {
  const accessToken = localStorage.getItem("access_token");
  if (!accessToken) {
    return;
  }

  try {
    await axiosInstance.post("/events/play", {
      songId: songId,
      timestamp: new Date().toISOString(),
    });
    setTimeout(() => {
      if (typeof window.refreshPersonalizedSection === "function") {
        window.refreshPersonalizedSection();
      }
    }, 500);
  } catch (error) {
    console.error("Error tracking play event:", error);
    if (error.response?.status === 401) {
      console.warn("Unauthorized - token may have expired");
    }
  }
}

export function stopAudioPlayback() {
  if (audioPlayer) {
    audioPlayer.pause();
    audioPlayer.currentTime = 0;
  }
  stopYouTubeSync();
  isVideoMode = false;
}

export async function playSong(songData, playlistArray = [], index = 0) {
  stopYouTubeSync();
  isVideoMode = false;

  const requestId = ++lastPlayRequestId;
  isLoadingAudio = true;
  currentSong = songData;
  playlist = playlistArray;
  currentIndex = index;
  hasTrackedPlay = false;

  showPlayer();
  updatePlayerInfo();
  updateModalInfo();
  updateModalPlaylist();
  document.dispatchEvent(
    new CustomEvent("playerSongChanged", {
      detail: { song: songData, index },
    })
  );
  const audioUrl = songData.audioUrl;

  if (requestId !== lastPlayRequestId) return;

  if (!audioUrl) {
    console.error("No audio URL found for song:", songData);
    isLoadingAudio = false;
    return;
  }

  initAudioPlayer();

  const playerEl = document.querySelector("#music-player-footer");
  if (playerEl) playerEl.setAttribute("data-loading", "true");

  try {
    audioPlayer.pause();
    audioPlayer.currentTime = 0;
  } catch (e) {
    console.warn("Error stopping previous audio:", e);
  }

  if (requestId !== lastPlayRequestId) {
    if (playerEl) playerEl.removeAttribute("data-loading");
    isLoadingAudio = false;
    return;
  }

  audioPlayer.src = audioUrl;

  try {
    audioPlayer.load();
  } catch (e) {
    console.warn("Error loading audio:", e);
  }

  if (requestId !== lastPlayRequestId) {
    if (playerEl) playerEl.removeAttribute("data-loading");
    isLoadingAudio = false;
    return;
  }

  try {
    await awaitEvent(audioPlayer, "canplay", 5000);
  } catch (e) {
    console.warn("[Player] canplay timeout", e);
  }

  if (requestId !== lastPlayRequestId) {
    if (playerEl) playerEl.removeAttribute("data-loading");
    isLoadingAudio = false;
    return;
  }

  try {
    await audioPlayer.play();
  } catch (err) {
    console.error("[Player] Play failed:", err);
    try {
      await new Promise((r) => setTimeout(r, 100));
      if (requestId !== lastPlayRequestId) {
        if (playerEl) playerEl.removeAttribute("data-loading");
        isLoadingAudio = false;
        return;
      }
      await audioPlayer.play();
    } catch (err2) {
      console.error("[Player] Play failed after retry:", err2);
    }
  }

  if (playerEl) playerEl.removeAttribute("data-loading");
  isLoadingAudio = false;
  updatePlayerInfo();
  updateModalInfo();
}

function awaitEvent(target, eventName, timeout = 5000) {
  return new Promise((resolve, reject) => {
    let timer = null;
    function cleanup() {
      target.removeEventListener(eventName, onEvent);
      if (timer) clearTimeout(timer);
    }
    function onEvent() {
      cleanup();
      resolve();
    }
    target.addEventListener(eventName, onEvent, { once: true });
    timer = setTimeout(() => {
      cleanup();
      reject(new Error("timeout waiting for " + eventName));
    }, timeout);
  });
}

export function togglePlay() {
  if (youtubePlayer && youtubePlayer.getPlayerState) {
    try {
      const state = youtubePlayer.getPlayerState();
      if (state === 1) {
        youtubePlayer.pauseVideo();
      } else {
        youtubePlayer.playVideo();
      }
      return;
    } catch (e) {
      console.warn("[YouTube Control] Error:", e);
    }
  }
  if (!audioPlayer) return;

  if (isPlaying) {
    audioPlayer.pause();
  } else {
    audioPlayer.play().catch((err) => {
      console.error("[Player] Play error:", err);
    });
  }
}

function handleVideoChange(video, index, videoList) {
  if (!isVideoMode) {
    playSong(video, videoList, index);
    return;
  }

  let targetPlayer = youtubePlayer;
  if (
    window.currentVideoPageData &&
    window.currentVideoPageData.combinedVideos
  ) {
    if (window.currentVideoPageData.player) {
      targetPlayer = window.currentVideoPageData.player;
      youtubePlayer = targetPlayer;
    } else {
      const videoDetailsContainer = document.querySelector("#youtube-player");
      if (videoDetailsContainer) {
        try {
          const iframe = videoDetailsContainer.querySelector("iframe");
          if (iframe && window.YT && window.YT.get) {
            const playerId = iframe.id || "youtube-player";
            targetPlayer = window.YT.get(playerId);
            if (targetPlayer) {
              youtubePlayer = targetPlayer;
              window.currentVideoPageData.player = targetPlayer;
            }
          }
        } catch (e) {
          console.warn(
            "[handleVideoChange] Error getting VideoDetails player:",
            e
          );
        }
      }
    }
  }

  if (video.videoId && targetPlayer && targetPlayer.loadVideoById) {
    currentSong = video;
    currentIndex = index;
    playlist = videoList;
    currentTime = 0;
    hasTrackedPlay = false;
    let priorVol = volume;
    let priorMuted = isMuted;
    try {
      if (targetPlayer && typeof targetPlayer.getVolume === "function") {
        const v = targetPlayer.getVolume();
        if (Number.isFinite(v)) priorVol = Math.round(v);
      }
      if (targetPlayer && typeof targetPlayer.isMuted === "function") {
        priorMuted = !!targetPlayer.isMuted();
      }
    } catch (e) {}
    targetPlayer.loadVideoById(video.videoId);
    try {
      if (typeof targetPlayer.setVolume === "function") {
        targetPlayer.setVolume(priorVol);
      }
      if (typeof targetPlayer.isMuted === "function") {
        if (priorMuted) {
          if (typeof targetPlayer.mute === "function") targetPlayer.mute();
        } else {
          if (typeof targetPlayer.unMute === "function") targetPlayer.unMute();
        }
      }
    } catch (e) {
      console.warn(
        "[handleVideoChange] Error restoring player volume/mute:",
        e
      );
    }
    volume = priorVol;
    isMuted = priorMuted;
    updateVolumeUI();
    updateModalVolumeUI();

    updatePlayerInfo();
    updateModalInfo();
    updateModalPlaylist();

    const modalEl = document.querySelector("#player-modal");
    const isModalOpen = modalEl && !modalEl.classList.contains("hidden");

    if (isModalOpen) {
      try {
        if (typeof syncWithYouTubePlayer === "function") {
          syncWithYouTubePlayer(targetPlayer, video, videoList, true);
        }
      } catch (e) {
        console.warn("[handleVideoChange] Error syncing modal player:", e);
      }
      document.dispatchEvent(
        new CustomEvent("modalVideoChanged", { detail: { index } })
      );
      try {
        if (window.currentVideoPageData && window.currentVideoPageData.player) {
          const mainPlayer = window.currentVideoPageData.player;
          if (mainPlayer && mainPlayer.loadVideoById) {
            try {
              mainPlayer.loadVideoById(video.videoId);
              setTimeout(() => {
                try {
                  if (mainPlayer.pauseVideo) mainPlayer.pauseVideo();
                } catch (e) {}
              }, 100);
            } catch (e) {
              console.warn(
                "[handleVideoChange] Error preloading main player:",
                e
              );
            }
          }
        }
      } catch (e) {
        console.warn("[handleVideoChange] Error preloading main player:", e);
      }
      setTimeout(() => {
        try {
          if (targetPlayer.seekTo) {
            targetPlayer.seekTo(0, true);
          }
          if (targetPlayer.playVideo) {
            targetPlayer.playVideo();
          }
          try {
            if (typeof targetPlayer.setVolume === "function")
              targetPlayer.setVolume(priorVol);
            if (priorMuted) {
              if (typeof targetPlayer.mute === "function") targetPlayer.mute();
            } else {
              if (typeof targetPlayer.unMute === "function")
                targetPlayer.unMute();
            }
          } catch (e) {}

          isPlaying = true;
          updatePlayButton();
          updateModalPlayButton();
        } catch (e) {
          console.warn("[handleVideoChange] Error playing modal video:", e);
        }
      }, 300);

      document.dispatchEvent(
        new CustomEvent("playerSongChanged", {
          detail: { song: video, index: index, skipSync: true },
        })
      );
    } else {
      setTimeout(() => {
        try {
          if (targetPlayer.seekTo) {
            targetPlayer.seekTo(0, true);
          }
          if (targetPlayer.playVideo) {
            targetPlayer.playVideo();
          }
          isPlaying = true;
          updatePlayButton();
          updateModalPlayButton();
        } catch (e) {
          console.warn("[handleVideoChange] Error playing video:", e);
        }
      }, 300);

      document.dispatchEvent(
        new CustomEvent("playerSongChanged", {
          detail: { song: video, index: index, skipSync: true },
        })
      );
    }
  }
}

export function playNext() {
  let playlistToUse = playlist;
  if (
    window.currentVideoPageData &&
    window.currentVideoPageData.combinedVideos
  ) {
    playlistToUse = window.currentVideoPageData.combinedVideos;
  }

  if (playlistToUse.length === 0) return;

  if (isShuffle) {
    const randomIndex = Math.floor(Math.random() * playlistToUse.length);
    if (isVideoMode) {
      handleVideoChange(playlistToUse[randomIndex], randomIndex, playlistToUse);
    } else {
      playSong(playlistToUse[randomIndex], playlistToUse, randomIndex);
    }
  } else {
    const nextIndex = (currentIndex + 1) % playlistToUse.length;
    if (isVideoMode) {
      handleVideoChange(playlistToUse[nextIndex], nextIndex, playlistToUse);
    } else {
      playSong(playlistToUse[nextIndex], playlistToUse, nextIndex);
    }
  }
}

export function playPrevious() {
  let playlistToUse = playlist;
  if (
    window.currentVideoPageData &&
    window.currentVideoPageData.combinedVideos
  ) {
    playlistToUse = window.currentVideoPageData.combinedVideos;
  }

  if (playlistToUse.length === 0) return;

  if (currentTime > 5 && !isVideoMode) {
    audioPlayer.currentTime = 0;
    return;
  }

  const prevIndex =
    currentIndex - 1 < 0 ? playlistToUse.length - 1 : currentIndex - 1;

  if (isVideoMode) {
    handleVideoChange(playlistToUse[prevIndex], prevIndex, playlistToUse);
  } else {
    playSong(playlistToUse[prevIndex], playlistToUse, prevIndex);
  }
}

function handleSongEnded() {
  if (isRepeat) {
    audioPlayer.currentTime = 0;
    audioPlayer.play();
  } else if (playlist.length > 1) {
    playNext();
  }
}

export function seek(time) {
  if (youtubePlayer && youtubePlayer.seekTo) {
    try {
      youtubePlayer.seekTo(time, true);
      return;
    } catch (e) {
      console.warn("[YouTube Seek] Error:", e);
    }
  }
  if (audioPlayer) {
    audioPlayer.currentTime = time;
  }
}

export function setVolume(vol) {
  const newVol = Math.max(0, Math.min(100, parseInt(vol) || 0));
  volume = newVol;

  if (audioPlayer) {
    audioPlayer.volume = volume / 100;
    if (isMuted && volume > 0) {
      isMuted = false;
      audioPlayer.muted = false;
      localStorage.setItem("player_muted", "false");
    }
  }

  if (youtubePlayer && youtubePlayer.setVolume) {
    try {
      youtubePlayer.setVolume(volume);
      if (isMuted && volume > 0) {
        isMuted = false;
        youtubePlayer.unMute();
        localStorage.setItem("player_muted", "false");
      }
    } catch (e) {
      console.warn("[YouTube Volume] Error:", e);
    }
  }

  localStorage.setItem("player_volume", String(volume));
  updateVolumeUI();
  updateModalVolumeUI();
}

export function toggleMute() {
  if (youtubePlayer && youtubePlayer.isMuted) {
    try {
      const ytIsMuted = youtubePlayer.isMuted();
      if (!ytIsMuted) {
        localStorage.setItem("player_volume_before_mute", String(volume));
        prevVolume = volume;
        volume = 0;
        isMuted = true;
        youtubePlayer.mute();
      } else {
        const volumeBeforeMute =
          parseInt(localStorage.getItem("player_volume_before_mute")) ||
          prevVolume ||
          50;
        volume = volumeBeforeMute;
        isMuted = false;
        youtubePlayer.unMute();
        youtubePlayer.setVolume(volume);
      }
      localStorage.setItem("player_muted", String(isMuted));
      localStorage.setItem("player_volume", String(volume));
      updateVolumeUI();
      updateModalVolumeUI();
      return;
    } catch (e) {
      console.warn("[YouTube Mute] Error:", e);
    }
  }

  if (!audioPlayer) {
    if (!isMuted) {
      localStorage.setItem("player_volume_before_mute", String(volume));
      prevVolume = volume;
      volume = 0;
      isMuted = true;
    } else {
      const volumeBeforeMute =
        parseInt(localStorage.getItem("player_volume_before_mute")) ||
        prevVolume ||
        50;
      volume = volumeBeforeMute;
      isMuted = false;
    }
    localStorage.setItem("player_muted", String(isMuted));
    localStorage.setItem("player_volume", String(volume));
    updateVolumeUI();
    updateModalVolumeUI();
    return;
  }

  if (!isMuted) {
    localStorage.setItem("player_volume_before_mute", String(volume));
    prevVolume = volume;
    volume = 0;
    isMuted = true;
    audioPlayer.muted = true;
    audioPlayer.volume = 0;
  } else {
    const volumeBeforeMute =
      parseInt(localStorage.getItem("player_volume_before_mute")) ||
      prevVolume ||
      50;
    volume = volumeBeforeMute;
    isMuted = false;
    audioPlayer.muted = false;
    audioPlayer.volume = volume / 100;
  }
  localStorage.setItem("player_muted", String(isMuted));
  localStorage.setItem("player_volume", String(volume));
  updateVolumeUI();
  updateModalVolumeUI();
}

export function toggleRepeat() {
  if (!isRepeat) {
    isRepeat = true;
    isShuffle = false;
    updateShuffleButton();
    updateModalShuffleButton();
  } else {
    isRepeat = false;
  }

  updateRepeatButton();
  updateModalRepeatButton();
}

export function toggleShuffle() {
  if (!isShuffle) {
    isShuffle = true;
    isRepeat = false;
    updateRepeatButton();
    updateModalRepeatButton();
  } else {
    isShuffle = false;
  }

  updateShuffleButton();
  updateModalShuffleButton();
}

import {
  formatTime,
  updatePlayerInfo,
  updatePlayButton,
  updateProgressBar,
  updateDuration,
  updateVolumeUI,
  updateRepeatButton,
  updateShuffleButton,
  updateModalInfo,
  updateModalPlayButton,
  updateModalProgressBar,
  updateModalDuration,
  updateModalVolumeUI,
  updateModalRepeatButton,
  updateModalShuffleButton,
  updateModalPlaylist,
  showPlayer,
  toggleModal,
  setupModalProgressHover,
  setupProgressHover,
  createPlayer,
  attachEventListeners,
} from "../components/Playbar.js";

function startVolumeMonitoring() {
  if (volumeCheckInterval) {
    clearInterval(volumeCheckInterval);
  }

  let lastVolume = null;
  let lastMutedState = null;

  volumeCheckInterval = setInterval(() => {
    if (!youtubePlayer || !youtubePlayer.getVolume) return;

    try {
      const ytVolume = Math.round(youtubePlayer.getVolume());
      const ytIsMuted = youtubePlayer.isMuted();

      if (
        ytIsMuted !== lastMutedState ||
        Math.abs(ytVolume - (lastVolume || 0)) > 1
      ) {
        lastVolume = ytVolume;
        lastMutedState = ytIsMuted;

        if (ytIsMuted !== isMuted) {
          isMuted = ytIsMuted;
          if (ytIsMuted) {
            localStorage.setItem("player_volume_before_mute", String(volume));
            volume = 0;
          } else {
            const volumeBeforeMute =
              parseInt(localStorage.getItem("player_volume_before_mute")) || 50;
            volume = volumeBeforeMute;
          }
        } else if (!ytIsMuted && ytVolume !== volume) {
          volume = ytVolume;
        }

        localStorage.setItem("player_volume", String(volume));
        localStorage.setItem("player_muted", String(isMuted));

        updateVolumeUI();
        updateModalVolumeUI();
      }
    } catch (e) {
      console.warn("[Volume Monitor] Error:", e);
    }
  }, 500);
}

function stopVolumeMonitoring() {
  if (volumeCheckInterval) {
    clearInterval(volumeCheckInterval);
    volumeCheckInterval = null;
  }
}

export function syncWithYouTubePlayer(
  player,
  videoData,
  videoList = [],
  skipEvent = false
) {
  if (isSyncing) return;
  isSyncing = true;

  youtubePlayer = player;
  currentSong = videoData;
  playlist = videoList;
  currentIndex = videoList.findIndex((v) => v.id === videoData.id);
  isVideoMode = true;

  showPlayer();
  updatePlayerInfo();
  updateModalInfo();
  updateModalPlaylist();

  if (!skipEvent) {
    document.dispatchEvent(
      new CustomEvent("playerSongChanged", {
        detail: { song: videoData, index: currentIndex, skipSync: true },
      })
    );
  }

  isSyncing = false;

  try {
    if (youtubePlayer && youtubePlayer.setVolume) {
      youtubePlayer.setVolume(volume);
      if (isMuted) {
        youtubePlayer.mute();
      } else {
        youtubePlayer.unMute();
      }
    }
  } catch (e) {
    console.warn("[YouTube Volume Sync] Error:", e);
  }
  startVolumeMonitoring();

  try {
    let isUsingModal = false;
    try {
      if (youtubePlayer && typeof youtubePlayer.getIframe === "function") {
        const iframe = youtubePlayer.getIframe();
        if (
          iframe &&
          iframe.parentNode &&
          iframe.parentNode.id === "modal-youtube-player"
        ) {
          isUsingModal = true;
        }
      }
    } catch (err) {}

    const payload = {
      currentTime,
      isPlaying,
      videoData: currentSong,
      volume,
      isMuted,
      isUsingModal,
    };
    window.playbarLastState = payload;
    document.dispatchEvent(
      new CustomEvent("playbarSynced", { detail: payload })
    );
  } catch (e) {}

  if (youtubeUpdateInterval) {
    clearInterval(youtubeUpdateInterval);
  }

  youtubeUpdateInterval = setInterval(() => {
    if (!youtubePlayer || !youtubePlayer.getCurrentTime) return;

    try {
      const ytCurrentTime = youtubePlayer.getCurrentTime();
      const ytDuration = youtubePlayer.getDuration();
      const ytState = youtubePlayer.getPlayerState();

      if (ytDuration && ytDuration > 0) {
        duration = ytDuration;
        currentTime = ytCurrentTime;
        isPlaying = ytState === 1;

        updateProgressBar();
        updateModalProgressBar();
        updatePlayButton();
        updateModalPlayButton();
        if (!hasTrackedPlay && currentTime > 3 && isPlaying) {
          trackPlayEvent(currentSong.id);
          hasTrackedPlay = true;
        }
      }
    } catch (e) {
      console.warn("[YouTube Sync] Error:", e);
    }
  }, 100);
}

document.addEventListener("playerHandOff", (e) => {
  try {
    const d = e.detail || {};
    const {
      playerInstance,
      currentTime: handedTime = 0,
      wasPlaying = false,
      videoData,
      videoList,
    } = d;
    if (playerInstance) {
      (function createAndAdoptPlayer() {
        try {
          const vid =
            videoData?.videoId ||
            (playerInstance &&
              playerInstance.getVideoData &&
              playerInstance.getVideoData().video_id) ||
            null;

          if (!vid) {
            try {
              syncWithYouTubePlayer(playerInstance, videoData, videoList, true);
            } catch (err) {
              console.warn(
                "[Playbar] Error syncing provided player (no video id):",
                err
              );
            }
            return;
          }

          let globalEl = document.querySelector("#global-youtube-container");
          if (!globalEl) {
            globalEl = document.createElement("div");
            globalEl.id = "global-youtube-container";
            globalEl.style.display = "none";
            document.body.appendChild(globalEl);
          }

          try {
            while (globalEl.firstChild)
              globalEl.removeChild(globalEl.firstChild);
          } catch (e) {}

          const playerDivId = "playbar-youtube-player";
          const wrapper = document.createElement("div");
          wrapper.id = playerDivId;
          globalEl.appendChild(wrapper);

          const instantiate = () => {
            try {
              if (!window.YT || !window.YT.Player) {
                setTimeout(instantiate, 100);
                return;
              }
              const p = new window.YT.Player(playerDivId, {
                videoId: vid,
                playerVars: {
                  start: Math.floor(handedTime || 0),
                  origin: window.location.origin,
                },
                events: {
                  onReady: (ev) => {
                    try {
                      if (typeof ev.target.seekTo === "function")
                        ev.target.seekTo(handedTime || 0, true);
                    } catch (e) {}
                    try {
                      syncWithYouTubePlayer(
                        ev.target,
                        videoData,
                        videoList,
                        true
                      );
                    } catch (err) {
                      console.warn(
                        "[Playbar] syncWithYouTubePlayer error:",
                        err
                      );
                    }

                    let attemptsInner = 0;
                    const tryPlayInner = () => {
                      attemptsInner++;
                      try {
                        if (
                          wasPlaying &&
                          typeof ev.target.playVideo === "function"
                        ) {
                          try {
                            ev.target.playVideo();
                            isPlaying = true;
                            updatePlayButton();
                            updateModalPlayButton();
                            return;
                          } catch (err) {
                          }
                        } else {
                          isPlaying = !!wasPlaying;
                          updatePlayButton();
                          updateModalPlayButton();
                        }
                      } catch (err) {}
                      if (attemptsInner < 8)
                        setTimeout(tryPlayInner, 150 * attemptsInner);
                    };
                    setTimeout(tryPlayInner, 50);
                  },
                },
              });
            } catch (err) {
              console.warn("[Playbar] Error creating internal YT player:", err);
            }
          };

          instantiate();
        } catch (err) {
          console.warn("[Playbar] createAndAdoptPlayer error:", err);
        }
      })();
    } else {
      try {
        const globalEl = document.querySelector("#global-youtube-container");
        if (globalEl) {
          const iframe = globalEl.querySelector("iframe");
          if (iframe && window.YT && window.YT.get) {
            const pid = iframe.id || "youtube-player";
            const p = window.YT.get(pid);
            if (p) {
              syncWithYouTubePlayer(p, videoData, videoList, true);

              let attempts2 = 0;
              const trySeekPlay2 = () => {
                attempts2++;
                try {
                  if (typeof p.seekTo === "function")
                    p.seekTo(handedTime, true);
                  if (wasPlaying && typeof p.playVideo === "function") {
                    p.playVideo();
                    isPlaying = true;
                    updatePlayButton();
                    updateModalPlayButton();
                    return;
                  } else {
                    isPlaying = !!wasPlaying;
                    updatePlayButton();
                    updateModalPlayButton();
                  }
                } catch (err) {}
                if (attempts2 < 8) setTimeout(trySeekPlay2, 150 * attempts2);
              };
              setTimeout(trySeekPlay2, 50);
            }
          }
        }
      } catch (err) {
        console.warn(
          "[Playbar] Error handling playerHandOff without instance:",
          err
        );
      }
    }
  } catch (e) {
    console.warn("[Playbar] playerHandOff handler error:", e);
  }
});

export function stopYouTubeSync() {
  if (youtubeUpdateInterval) {
    clearInterval(youtubeUpdateInterval);
    youtubeUpdateInterval = null;
  }
  stopVolumeMonitoring();

  if (youtubePlayer) {
    try {
      youtubePlayer.pauseVideo();
    } catch (e) {
      console.warn("[YouTube] Error pausing:", e);
    }
  }
  youtubePlayer = null;
}

export function getPlayerState() {
  return {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isRepeat,
    isShuffle,
    playlist,
    currentIndex,
    isVideoMode,
    youtubePlayer,
  };
}
