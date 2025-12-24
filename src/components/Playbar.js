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

function initAudioPlayer() {
  if (!audioPlayer) {
    audioPlayer = new Audio();
    audioPlayer.addEventListener("loadedmetadata", onAudioLoaded);
    audioPlayer.addEventListener("timeupdate", onTimeUpdate);
    audioPlayer.addEventListener("ended", handleSongEnded);
    audioPlayer.addEventListener("play", () => {
      isPlaying = true;
      updatePlayButton();
    });
    audioPlayer.addEventListener("pause", () => {
      isPlaying = false;
      updatePlayButton();
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
}

function onTimeUpdate() {
  currentTime = audioPlayer.currentTime;
  updateProgressBar();
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
    const response = await axiosInstance.post("/events/play", {
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

export async function playSong(songData, playlistArray = [], index = 0) {
  const requestId = ++lastPlayRequestId;
  
  if (isLoadingAudio) {
    console.log("Hủy yêu cầu tải trước đó");
  }
  
  isLoadingAudio = true;
  currentSong = songData;
  playlist = playlistArray;
  currentIndex = index;
  hasTrackedPlay = false;

  showPlayer();
  updatePlayerInfo();
  
  const audioUrl = songData.audioUrl || (await getAudioUrl(songData.id));

  if (requestId !== lastPlayRequestId) {
    console.log("Yêu cầu bị hủy");
    return;
  }

  if (!audioUrl) {
    console.error("Không tìm thấy URL", songData);
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
    console.warn("Hết thời gian chờ", e);
  }

  if (requestId !== lastPlayRequestId) {
    if (playerEl) playerEl.removeAttribute("data-loading");
    isLoadingAudio = false;
    return;
  }

  try {
    await audioPlayer.play();
  } catch (err) {
    console.error("Phát nhạc thất bại:", err);
    
    try {
      await new Promise((r) => setTimeout(r, 100));
      
      if (requestId !== lastPlayRequestId) {
        if (playerEl) playerEl.removeAttribute("data-loading");
        isLoadingAudio = false;
        return;
      }
      
      await audioPlayer.play();
    } catch (err2) {
      console.error("Phát thất bại sau khi đã thử lại:", err2);
    }
  }

  if (playerEl) playerEl.removeAttribute("data-loading");
  isLoadingAudio = false;
  updatePlayerInfo();
}

async function getAudioUrl(songId) {
  try {
    const response = await axiosInstance.get(`/songs/stream/${songId}`);
    return response.data.audioUrl || response.data.url;
  } catch (error) {
    console.error("Lỗi URL âm thanh", error);
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
  if (!audioPlayer) return;

  if (isPlaying) {
    audioPlayer.pause();
  } else {
    audioPlayer.play().catch(err => {
      console.error("Lỗi phát nhạc:", err);
    });
  }
}

export function playNext() {
  if (playlist.length === 0) return;

  if (isShuffle) {
    const randomIndex = Math.floor(Math.random() * playlist.length);
    playSong(playlist[randomIndex], playlist, randomIndex);
  } else {
    const nextIndex = (currentIndex + 1) % playlist.length;
    playSong(playlist[nextIndex], playlist, nextIndex);
  }
}

export function playPrevious() {
  if (playlist.length === 0) return;
  if (currentTime > 5) {
    audioPlayer.currentTime = 0;
    return;
  }
  const prevIndex =
    currentIndex - 1 < 0 ? playlist.length - 1 : currentIndex - 1;
  playSong(playlist[prevIndex], playlist, prevIndex);
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
    }
  }
  localStorage.setItem("player_volume", String(volume));
  localStorage.setItem("player_muted", String(isMuted));
  updateVolumeUI();
}

export function toggleMute() {
  if (!audioPlayer) {
    isMuted = !isMuted;
    if (!isMuted && volume === 0) {
      volume = prevVolume || 50;
    }
    localStorage.setItem("player_muted", String(isMuted));
    localStorage.setItem("player_volume", String(volume));
    updateVolumeUI();
    return;
  }

  if (!isMuted) {
    prevVolume = volume;
    isMuted = true;
    audioPlayer.muted = true;
  } else {
    isMuted = false;
    audioPlayer.muted = false;
    if (volume === 0) {
      volume = prevVolume || 50;
      audioPlayer.volume = volume / 100;
    }
  }
  localStorage.setItem("player_muted", String(isMuted));
  localStorage.setItem("player_volume", String(volume));
  updateVolumeUI();
}

export function toggleRepeat() {
  isRepeat = !isRepeat;
  updateRepeatButton();
}

export function toggleShuffle() {
  isShuffle = !isShuffle;
  updateShuffleButton();
}

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function updatePlayerInfo() {
  if (!currentSong) return;
  const thumbnail = document.querySelector("#player-thumbnail");
  const title = document.querySelector("#player-title");
  const artist = document.querySelector("#player-artist");

  if (thumbnail) thumbnail.src = currentSong.thumbnails?.[0] || "";
  if (title) title.textContent = currentSong.title || "Unknown";
  if (artist) artist.textContent = "Không rõ nghệ sĩ";
}

function updatePlayButton() {
  const btn = document.querySelector("#play-pause-btn");
  if (!btn) return;
  const icon = btn.querySelector("i");
  if (icon) {
    icon.className = isPlaying
      ? "fas fa-pause text-black text-xl"
      : "fas fa-play text-black text-xl ml-0.5";
  }
}

function updateProgressBar() {
  const progressBar = document.querySelector("#progress-bar");
  const progressFill = document.querySelector("#progress-fill");
  const progressThumb = document.querySelector("#progress-thumb");
  if (progressBar && duration) {
    const percentage = (currentTime / duration) * 100;
    progressBar.value = percentage;
    if (progressFill) {
      progressFill.style.width = `${percentage}%`;
    }
    if (progressThumb) {
      progressThumb.style.left = `${percentage}%`;
    }
  }

  const currentTimeEl = document.querySelector("#current-time");
  if (currentTimeEl) {
    currentTimeEl.textContent = formatTime(currentTime);
  }
  const durationEl = document.querySelector("#duration-time");
  if (durationEl) {
    durationEl.textContent = formatTime(duration);
  }
}

function updateDuration() {
  const durationEl = document.querySelector("#duration-time");
  if (durationEl) {
    durationEl.textContent = formatTime(duration);
  }
}

function updateVolumeUI() {
  const volumeBtn = document.querySelector("#volume-btn");
  const icon = volumeBtn?.querySelector("i");

  if (icon) {
    if (isMuted || volume === 0) {
      icon.className = "fas fa-volume-mute text-white text-xl";
    } else if (volume < 50) {
      icon.className = "fas fa-volume-down text-white text-xl";
    } else {
      icon.className = "fas fa-volume-up text-white text-xl";
    }
  }

  const volumeSlider = document.querySelector("#volume-slider");
  if (volumeSlider) {
    volumeSlider.value = volume;
  }
}

function updateRepeatButton() {
  const btn = document.querySelector("#repeat-btn");
  if (btn) {
    if (isRepeat) {
      btn.classList.add("text-white");
      btn.classList.remove("text-gray-400");
    } else {
      btn.classList.remove("text-white");
      btn.classList.add("text-gray-400");
    }
  }
}

function updateShuffleButton() {
  const btn = document.querySelector("#shuffle-btn");
  if (btn) {
    if (isShuffle) {
      btn.classList.add("text-white");
      btn.classList.remove("text-gray-400");
    } else {
      btn.classList.remove("text-white");
      btn.classList.add("text-gray-400");
    }
  }
}

function showPlayer() {
  let playerEl = document.querySelector("#music-player-footer");

  if (!playerEl) {
    createPlayer();
    playerEl = document.querySelector("#music-player-footer");
  }

  if (playerEl) {
    playerEl.classList.remove("hidden");
  }
}

function createPlayer() {
  const playerHTML = `
    <div id="music-player-footer" class="fixed bottom-0 left-0 right-0 bg-black z-50 hidden">
      <div id="progress-container"
         class="relative h-1 bg-white cursor-pointer group">
        <div id="progress-fill"
           class="absolute left-0 top-0 h-full w-0 bg-red-500
           transition-colors group-hover:bg-red-600">
        </div>
        <div id="progress-thumb"
           class="absolute top-1/2 left-0 w-3 h-3 bg-red-500 rounded-full
           -translate-x-1/2 -translate-y-1/2 opacity-100 transition-colors
           group-hover:bg-red-600">
        </div>
        <div id="progress-tooltip"
           class="absolute bottom-full left-0 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded
           pointer-events-none opacity-0 transition-opacity -translate-x-1/2 whitespace-nowrap">
          0:00
        </div>
        <input type="range" id="progress-bar" min="0" max="100" value="0"
           class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10">
      </div>
      <div class="flex items-center justify-between px-4 py-2">
        <div class="flex items-center gap-3 flex-1 min-w-0 max-w-[30%]">
          <img id="player-thumbnail" src="" alt="" 
            class="w-14 h-14 rounded object-cover flex-shrink-0">
          <div class="min-w-0 flex-1">
            <h4 id="player-title" class="text-white font-medium truncate text-sm"></h4>
            <p id="player-artist" class="text-gray-400 text-xs truncate"></p>
          </div>
        </div>
        <div class="flex items-center gap-8 flex-1 justify-center">
          <button id="shuffle-btn" class="text-gray-400 hover:text-white transition cursor-pointer">
            <i class="fas fa-random text-lg"></i>
          </button>
          <button id="prev-btn" class="text-white transition">
            <i class="fas fa-step-backward text-2xl cursor-pointer"></i>
          </button>
          <button id="play-pause-btn" 
            class="w-9 h-9 bg-white rounded-full flex items-center justify-center transition cursor-pointer">
            <i class="fas fa-play text-black text-xl ml-0.5"></i>
          </button>
          <button id="next-btn" class="text-white transition">
            <i class="fas fa-step-forward text-2xl cursor-pointer"></i>
          </button>
          <button id="repeat-btn" class="text-gray-400 hover:text-white transition cursor-pointer">
            <i class="fas fa-redo text-lg"></i>
          </button>
        </div>
        <div class="flex items-center gap-6 flex-1 justify-end max-w-[30%]">
          <div class="flex items-center gap-2 text-sm text-white">
            <span id="current-time">0:00</span>
            <span>/</span>
            <span id="duration-time">0:00</span>
          </div>
          <button class="text-white hover:text-gray-300 transition cursor-pointer">
            <i class="fas fa-list-ul text-xl"></i>
          </button>
          <button class="text-white hover:text-gray-300 transition cursor-pointer">
            <i class="far fa-thumbs-up text-xl"></i>
          </button>
          <div class="flex items-center gap-2">
            <button id="volume-btn"
                 class="text-white hover:text-gray-300 transition cursor-pointer">
              <i class="fas fa-volume-up text-xl"></i>
            </button>
            <input type="range" id="volume-slider" min="0" max="100" value="100"
               class="w-24 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer
                      slider-thumb:w-3 slider-thumb:h-3 slider-thumb:bg-white slider-thumb:rounded-full"/>
          </div>
          <button class="text-white hover:text-gray-300 transition cursor-pointer">
            <i class="fas fa-ellipsis-h text-xl"></i>
          </button>
        </div>
      </div>
    </div>`;

  document.body.insertAdjacentHTML("beforeend", playerHTML);
  attachEventListeners();
  updateVolumeUI();
  setupProgressHover();
}

function setupProgressHover() {
  const progressContainer = document.querySelector("#progress-container");
  const progressBar = document.querySelector("#progress-bar");
  const tooltip = document.querySelector("#progress-tooltip");
  
  if (!progressContainer || !progressBar || !tooltip) return;

  progressContainer.addEventListener("mousemove", (e) => {
    if (!duration) return;
    
    const rect = progressContainer.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const time = (percentage / 100) * duration;
    
    tooltip.textContent = formatTime(time);
    tooltip.style.left = `${x}px`;
    tooltip.style.opacity = "1";
  });

  progressContainer.addEventListener("mouseleave", () => {
    tooltip.style.opacity = "0";
  });
}

function attachEventListeners() {
  document.querySelector("#play-pause-btn")?.addEventListener("click", () => {
    togglePlay();
  });

  document.querySelector("#prev-btn")?.addEventListener("click", () => {
    playPrevious();
  });

  document.querySelector("#next-btn")?.addEventListener("click", () => {
    playNext();
  });

  const progressBar = document.querySelector("#progress-bar");
  progressBar?.addEventListener("input", (e) => {
    const time = (e.target.value / 100) * duration;
    seek(time);
  });

  const volumeSlider = document.querySelector("#volume-slider");
  volumeSlider?.addEventListener("input", (e) => {
    const newVol = parseInt(e.target.value) || 0;
    setVolume(newVol);
  });

  document.querySelector("#volume-btn")?.addEventListener("click", () => {
    toggleMute();
  });

  document.querySelector("#repeat-btn")?.addEventListener("click", () => {
    toggleRepeat();
  });

  document.querySelector("#shuffle-btn")?.addEventListener("click", () => {
    toggleShuffle();
  });
}