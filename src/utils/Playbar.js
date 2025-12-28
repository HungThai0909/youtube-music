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
  if (!accessToken) return;

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
  document.dispatchEvent(new CustomEvent('playerSongChanged', {
    detail: { song: songData, index }
  }));

  const audioUrl = songData.audioUrl || (await getAudioUrl(songData.id));

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

async function getAudioUrl(songId) {
  try {
    const response = await axiosInstance.get(`/songs/stream/${songId}`);
    return response.data.audioUrl || response.data.url;
  } catch (error) {
    console.error("Error getting audio URL:", error);
    return null;
  }
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

export function playNext() {
  if (playlist.length === 0) return;

  if (isShuffle) {
    const randomIndex = Math.floor(Math.random() * playlist.length);
    if (isVideoMode) {
      const video = playlist[randomIndex];
      if (video.videoId && youtubePlayer && youtubePlayer.loadVideoById) {
        youtubePlayer.loadVideoById(video.videoId);
        currentSong = video;
        currentIndex = randomIndex;
        updatePlayerInfo();
        updateModalInfo();
        updateModalPlaylist();
        document.dispatchEvent(new CustomEvent('playerSongChanged', {
          detail: { song: video, index: randomIndex }
        }));
        document.dispatchEvent(new CustomEvent('modalVideoChanged', {
          detail: { index: randomIndex, video }
        }));
      }
    } else {
      playSong(playlist[randomIndex], playlist, randomIndex);
    }
  } else {
    const nextIndex = (currentIndex + 1) % playlist.length;
    if (isVideoMode) {
      const video = playlist[nextIndex];
      if (video.videoId && youtubePlayer && youtubePlayer.loadVideoById) {
        youtubePlayer.loadVideoById(video.videoId);
        currentSong = video;
        currentIndex = nextIndex;
        updatePlayerInfo();
        updateModalInfo();
        updateModalPlaylist();
        document.dispatchEvent(new CustomEvent('playerSongChanged', {
          detail: { song: video, index: nextIndex }
        }));
        document.dispatchEvent(new CustomEvent('modalVideoChanged', {
          detail: { index: nextIndex, video }
        }));
      }
    } else {
      playSong(playlist[nextIndex], playlist, nextIndex);
    }
  }
}

export function playPrevious() {
  if (playlist.length === 0) return;

  if (currentTime > 5 && !isVideoMode) {
    audioPlayer.currentTime = 0;
    return;
  }

  const prevIndex = currentIndex - 1 < 0 ? playlist.length - 1 : currentIndex - 1;
  
  if (isVideoMode) {
    const video = playlist[prevIndex];
    if (video.videoId && youtubePlayer && youtubePlayer.loadVideoById) {
      youtubePlayer.loadVideoById(video.videoId);
      currentSong = video;
      currentIndex = prevIndex;
      updatePlayerInfo();
      updateModalInfo();
      updateModalPlaylist();
      document.dispatchEvent(new CustomEvent('playerSongChanged', {
        detail: { song: video, index: prevIndex }
      }));
      document.dispatchEvent(new CustomEvent('modalVideoChanged', {
        detail: { index: prevIndex, video }
      }));
    }
  } else {
    playSong(playlist[prevIndex], playlist, prevIndex);
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
        const volumeBeforeMute = parseInt(localStorage.getItem("player_volume_before_mute")) || prevVolume || 50;
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
      const volumeBeforeMute = parseInt(localStorage.getItem("player_volume_before_mute")) || prevVolume || 50;
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
    const volumeBeforeMute = parseInt(localStorage.getItem("player_volume_before_mute")) || prevVolume || 50;
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
  attachEventListeners
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
      
      if (ytIsMuted !== lastMutedState || Math.abs(ytVolume - (lastVolume || 0)) > 1) {
        lastVolume = ytVolume;
        lastMutedState = ytIsMuted;
        
        if (ytIsMuted !== isMuted) {
          isMuted = ytIsMuted;
          if (ytIsMuted) {
            localStorage.setItem("player_volume_before_mute", String(volume));
            volume = 0;
          } else {
            const volumeBeforeMute = parseInt(localStorage.getItem("player_volume_before_mute")) || 50;
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

export function syncWithYouTubePlayer(player, videoData, videoList = [], skipEvent = false) {
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
    document.dispatchEvent(new CustomEvent('playerSongChanged', {
      detail: { song: videoData, index: currentIndex, skipSync: true }
    }));
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
    youtubePlayer
  };
}