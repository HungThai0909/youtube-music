import {
  togglePlay,
  playNext,
  playPrevious,
  seek,
  setVolume,
  toggleMute,
  toggleRepeat,
  toggleShuffle,
  playSong,
  getPlayerState,
} from "../utils/Playbar";

export function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return "0:00";

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s
      .toString()
      .padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function updatePlayerInfo() {
  const state = getPlayerState();
  if (!state.currentSong) return;

  const thumbnail = document.querySelector("#player-thumbnail");
  const title = document.querySelector("#player-title");
  const artist = document.querySelector("#player-artist");

  if (thumbnail) thumbnail.src = state.currentSong.thumbnails?.[0] || "";
  if (title) title.textContent = state.currentSong.title || "Unknown";
  if (artist) artist.textContent = "Không rõ nghệ sĩ";
}

export function updatePlayButton() {
  const state = getPlayerState();
  const btn = document.querySelector("#play-pause-btn");
  if (!btn) return;
  const icon = btn.querySelector("i");
  if (icon) {
    icon.className = state.isPlaying
      ? "fas fa-pause text-black text-xl"
      : "fas fa-play text-black text-xl ml-0.5";
  }
}

export function updateProgressBar() {
  const state = getPlayerState();
  const progressBar = document.querySelector("#progress-bar");
  const progressFill = document.querySelector("#progress-fill");
  const progressThumb = document.querySelector("#progress-thumb");

  if (progressBar && state.duration) {
    const percentage = (state.currentTime / state.duration) * 100;
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
    currentTimeEl.textContent = formatTime(state.currentTime);
  }
  const durationEl = document.querySelector("#duration-time");
  if (durationEl) {
    durationEl.textContent = formatTime(state.duration);
  }
}

export function updateDuration() {
  const state = getPlayerState();
  const durationEl = document.querySelector("#duration-time");
  if (durationEl) {
    durationEl.textContent = formatTime(state.duration);
  }
}

export function updateVolumeUI() {
  const state = getPlayerState();
  const volumeBtn = document.querySelector("#volume-btn");
  const icon = volumeBtn?.querySelector("i");

  if (icon) {
    if (state.isMuted || state.volume === 0) {
      icon.className = "fas fa-volume-mute text-white text-xl";
    } else if (state.volume < 50) {
      icon.className = "fas fa-volume-down text-white text-xl";
    } else {
      icon.className = "fas fa-volume-up text-white text-xl";
    }
  }

  const volumeSlider = document.querySelector("#volume-slider");
  if (volumeSlider) {
    volumeSlider.value = state.volume;
  }
}

export function updateRepeatButton() {
  const state = getPlayerState();
  const btn = document.querySelector("#repeat-btn");
  if (btn) {
    if (state.isRepeat) {
      btn.classList.add("text-white");
      btn.classList.remove("text-gray-400");
    } else {
      btn.classList.remove("text-white");
      btn.classList.add("text-gray-400");
    }
  }
}

export function updateShuffleButton() {
  const state = getPlayerState();
  const btn = document.querySelector("#shuffle-btn");
  if (btn) {
    if (state.isShuffle) {
      btn.classList.add("text-white");
      btn.classList.remove("text-gray-400");
    } else {
      btn.classList.remove("text-white");
      btn.classList.add("text-gray-400");
    }
  }
}

export function toggleModal() {
  const modal = document.querySelector("#player-modal");
  if (!modal) return;

  const state = getPlayerState();
  const isHidden = modal.classList.contains("hidden");

  if (isHidden) {
    modal.classList.remove("hidden");
    updateModalInfo();
    updateModalPlaylist();
    updateModalVolumeUI();
    updateModalRepeatButton();
    updateModalShuffleButton();
    document.dispatchEvent(
      new CustomEvent("playerModalOpened", {
        detail: { isVideoMode: state.isVideoMode },
      })
    );
  } else {
    modal.classList.add("hidden");
    document.dispatchEvent(new CustomEvent("playerModalClosed"));
  }
}

export function updateModalInfo() {
  const state = getPlayerState();
  if (!state.currentSong) return;

  const modalYouTubePlayer = document.querySelector("#modal-youtube-player");
  const modalThumbnail = document.querySelector("#modal-thumbnail");
  const modalTitle = document.querySelector("#modal-title");
  const modalArtist = document.querySelector("#modal-artist");
  const modalPlaylistTitle = document.querySelector("#modal-playlist-title");

  const isVideoDetailsPage =
    window.currentVideoPageData && window.currentVideoPageData.combinedVideos;
  const isSongDetailsPage =
    window.currentSongPageData && window.currentSongPageData.combinedTracks;

  if (state.isVideoMode && state.youtubePlayer) {
    if (modalYouTubePlayer) modalYouTubePlayer.classList.remove("hidden");
    if (modalThumbnail) modalThumbnail.classList.add("hidden");
    if (modalPlaylistTitle) {
      if (isVideoDetailsPage) {
        modalPlaylistTitle.textContent = "Video liên quan";
      } else if (isSongDetailsPage) {
        modalPlaylistTitle.textContent = "Danh sách bài hát";
      } else {
        modalPlaylistTitle.textContent = "Danh sách phát liên quan";
      }
    }
  } else {
    if (modalYouTubePlayer) modalYouTubePlayer.classList.add("hidden");
    if (modalThumbnail) {
      modalThumbnail.classList.remove("hidden");
      modalThumbnail.src = state.currentSong.thumbnails?.[0] || "";
    }
    if (modalPlaylistTitle) {
      if (isVideoDetailsPage) {
        modalPlaylistTitle.textContent = "Video liên quan";
      } else if (isSongDetailsPage) {
        modalPlaylistTitle.textContent = "Danh sách bài hát";
      } else {
        modalPlaylistTitle.textContent = "Danh sách phát liên quan";
      }
    }
  }

  if (modalTitle) modalTitle.textContent = state.currentSong.title || "Unknown";
  if (modalArtist) {
    modalArtist.textContent = state.currentSong.artist || "Không rõ nghệ sĩ";
  }

  updateModalDuration();
}

export function updateModalPlayButton() {
  const state = getPlayerState();
  const btn = document.querySelector("#modal-play-btn");
  if (!btn) return;
  const icon = btn.querySelector("i");
  if (icon) {
    icon.className = state.isPlaying
      ? "fas fa-pause text-4xl"
      : "fas fa-play text-4xl ml-1";
  }
}

export function updateModalProgressBar() {
  const state = getPlayerState();
  const progressBar = document.querySelector("#modal-progress-bar");
  const progressFill = document.querySelector("#modal-progress-fill");

  if (progressBar && state.duration) {
    const percentage = (state.currentTime / state.duration) * 100;
    progressBar.value = percentage;
    if (progressFill) {
      progressFill.style.width = `${percentage}%`;
    }
  }

  const currentTimeEl = document.querySelector("#modal-current-time");
  if (currentTimeEl) {
    currentTimeEl.textContent = formatTime(state.currentTime);
  }
}

export function updateModalDuration() {
  const state = getPlayerState();
  const durationEl = document.querySelector("#modal-duration-time");
  if (durationEl) {
    if (state.currentSong && state.currentSong.duration) {
      durationEl.textContent = formatTime(state.currentSong.duration);
    } else {
      durationEl.textContent = formatTime(state.duration);
    }
  }
}

export function updateModalVolumeUI() {
  const state = getPlayerState();
  const icon = document.querySelector("#modal-volume-btn i");
  if (icon) {
    if (state.isMuted || state.volume === 0) {
      icon.className = "fas fa-volume-mute text-2xl";
    } else if (state.volume < 50) {
      icon.className = "fas fa-volume-down text-2xl";
    } else {
      icon.className = "fas fa-volume-up text-2xl";
    }
  }

  const volumeSlider = document.querySelector("#modal-volume-slider");
  if (volumeSlider) {
    volumeSlider.value = state.volume;
  }
}

export function updateModalRepeatButton() {
  const state = getPlayerState();
  const btn = document.querySelector("#modal-repeat-btn");
  if (btn) {
    if (state.isRepeat) {
      btn.classList.add("text-white");
      btn.classList.remove("text-gray-400");
    } else {
      btn.classList.remove("text-white");
      btn.classList.add("text-gray-400");
    }
  }
}

export function updateModalShuffleButton() {
  const state = getPlayerState();
  const btn = document.querySelector("#modal-shuffle-btn");
  if (btn) {
    if (state.isShuffle) {
      btn.classList.add("text-white");
      btn.classList.remove("text-gray-400");
    } else {
      btn.classList.remove("text-white");
      btn.classList.add("text-gray-400");
    }
  }
}

export function updateModalPlaylist() {
  const state = getPlayerState();
  const playlistContainer = document.querySelector("#modal-playlist");
  const modalPlaylistTitle = document.querySelector("#modal-playlist-title");

  let playlistToShow = state.playlist;
  let isVideoDetailsPage = false;
  let isSongDetailsPage = false;

  if (
    window.currentVideoPageData &&
    window.currentVideoPageData.combinedVideos
  ) {
    playlistToShow = window.currentVideoPageData.combinedVideos;
    isVideoDetailsPage = true;
    if (modalPlaylistTitle) {
      modalPlaylistTitle.textContent = "Video liên quan";
    }
  } else if (
    window.currentSongPageData &&
    window.currentSongPageData.combinedTracks
  ) {
    playlistToShow = window.currentSongPageData.combinedTracks;
    isSongDetailsPage = true;
    if (modalPlaylistTitle) {
      modalPlaylistTitle.textContent = "Danh sách bài hát";
    }
  } else {
    if (modalPlaylistTitle) {
      modalPlaylistTitle.textContent = "Danh sách phát liên quan";
    }
  }

  if (!playlistContainer || !playlistToShow.length) return;

  playlistContainer.innerHTML = playlistToShow
    .map(
      (track, index) => `
    <div class="modal-playlist-item flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 cursor-pointer transition ${
      index === state.currentIndex ||
      (state.currentSong && track.id === state.currentSong.id)
        ? "bg-white/10"
        : ""
    }"
         data-index="${index}">
      <img src="${track.thumbnails?.[0] || ""}" 
           class="w-12 h-12 rounded object-cover flex-shrink-0"/>
      <div class="flex-1 min-w-0">
        <h4 class="text-white font-medium truncate ${
          index === state.currentIndex ||
          (state.currentSong && track.id === state.currentSong.id)
            ? "text-cyan-400"
            : ""
        }">${track.title || "Unknown"}</h4>
        <p class="text-gray-400 text-sm truncate">${
          track.artist || "Không rõ nghệ sĩ"
        }</p>
      </div>
      <span class="text-gray-400 text-sm">${formatTime(
        track.duration || 0
      )}</span>
    </div>
  `
    )
    .join("");

  playlistContainer.querySelectorAll(".modal-playlist-item").forEach((item) => {
    item.addEventListener("click", () => {
      const index = parseInt(item.dataset.index);
      const state = getPlayerState();
      const track = playlistToShow[index];
      if (!track) return;

      if (state.isVideoMode || isVideoDetailsPage) {
        if (
          track.videoId &&
          state.youtubePlayer &&
          state.youtubePlayer.loadVideoById
        ) {
          state.youtubePlayer.loadVideoById(track.videoId);
          updatePlayerInfo();
          updateModalInfo();
          updateModalPlaylist();
          document.dispatchEvent(
            new CustomEvent("modalVideoChanged", {
              detail: { index, video: track },
            })
          );
        }
      } else {
        playSong(track, playlistToShow, index);
      }
    });
  });

  document.addEventListener("videoDetailChanged", (event) => {
    const { index } = event.detail;
    updateModalPlaylist();
  });

  const currentIndex = state.currentSong
    ? playlistToShow.findIndex((t) => t.id === state.currentSong.id)
    : state.currentIndex;

  const currentItem = playlistContainer.querySelector(
    `[data-index="${currentIndex}"]`
  );
  if (currentItem) {
    currentItem.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

export function setupModalProgressHover() {
  const progressContainer = document.querySelector("#modal-progress-container");
  const tooltip = document.querySelector("#modal-progress-tooltip");

  if (!progressContainer || !tooltip) return;

  progressContainer.addEventListener("mousemove", (e) => {
    const state = getPlayerState();
    if (!state.duration) return;

    const rect = progressContainer.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const time = (percentage / 100) * state.duration;

    tooltip.textContent = formatTime(time);
    tooltip.style.left = `${x}px`;
    tooltip.style.opacity = "1";
  });

  progressContainer.addEventListener("mouseleave", () => {
    tooltip.style.opacity = "0";
  });
}

export function showPlayer() {
  let playerEl = document.querySelector("#music-player-footer");

  if (!playerEl) {
    createPlayer();
    playerEl = document.querySelector("#music-player-footer");
  }

  if (playerEl) {
    playerEl.classList.remove("hidden");
  }
}

export function createPlayer() {
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
        <div id="player-info-clickable" class="flex items-center gap-3 flex-1 min-w-0 max-w-[30%] cursor-pointer hover:bg-white/5 rounded-lg p-2 -m-2 transition">
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
               class="w-24 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"/>
          </div>
          <button class="text-white hover:text-gray-300 transition cursor-pointer">
            <i class="fas fa-ellipsis-h text-xl"></i>
          </button>
        </div>
      </div>
    </div>
    <div id="player-modal" class="fixed inset-0 bg-gradient-to-b from-gray-900 via-gray-800 to-black z-[60] hidden">
      <div class="h-full flex flex-col">
        <div class="flex items-center justify-end p-6">
          <button id="modal-close-btn" class="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center transition">
            <i class="fas fa-times text-white text-2xl"></i>
          </button>
        </div>
        <div class="flex-1 flex overflow-hidden px-12 pb-12">
          <div class="w-1/2 flex flex-col items-center justify-center pr-12">
            <div id="modal-media-container" class="w-full mb-8">
              <div class="relative w-full pb-[56.25%]">
                <div id="modal-youtube-player" class="absolute inset-0 rounded-2xl overflow-hidden shadow-2xl hidden"></div>
                <img id="modal-thumbnail" src="" 
                     class="absolute inset-0 w-full h-full rounded-2xl shadow-2xl object-cover"/>
              </div>
            </div>
            <h1 id="modal-title" class="text-3xl font-bold text-white mb-2 text-center"></h1>
            <p id="modal-artist" class="text-lg text-gray-400 mb-8 text-center"></p>
            <div class="w-full mb-6">
              <div id="modal-progress-container" class="relative h-2 bg-white/20 rounded-full cursor-pointer group">
                <div id="modal-progress-fill" class="absolute left-0 top-0 h-full bg-red-500 rounded-full"></div>
                <div id="modal-progress-tooltip"
                     class="absolute bottom-full left-0 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded
                     pointer-events-none opacity-0 transition-opacity -translate-x-1/2 whitespace-nowrap">
                  0:00
                </div>
                <input type="range" id="modal-progress-bar" min="0" max="100" value="0"
                       class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10">
              </div>
              <div class="flex justify-between text-sm text-gray-400 mt-2">
                <span id="modal-current-time">0:00</span>
                <span id="modal-duration-time">0:00</span>
              </div>
            </div>
            <div class="flex items-center gap-6">
              <button id="modal-shuffle-btn" class="text-gray-400 hover:text-white transition cursor-pointer">
                <i class="fas fa-random text-2xl"></i>
              </button>
              <button id="modal-prev-btn" class="text-white hover:scale-110 transition cursor-pointer">
                <i class="fas fa-step-backward text-3xl"></i>
              </button>
              <button id="modal-play-btn" class="w-16 h-16 bg-white rounded-full flex items-center justify-center hover:scale-105 transition cursor-pointer">
                <i class="fas fa-play text-black text-4xl ml-1"></i>
              </button>
              <button id="modal-next-btn" class="text-white hover:scale-110 transition cursor-pointer">
                <i class="fas fa-step-forward text-3xl"></i>
              </button>
              <button id="modal-repeat-btn" class="text-gray-400 hover:text-white transition cursor-pointer">
                <i class="fas fa-redo text-2xl"></i>
              </button>
              <div class="flex items-center gap-2 ml-4">
                <button id="modal-volume-btn" class="text-white hover:text-gray-300 transition cursor-pointer">
                  <i class="fas fa-volume-up text-2xl"></i>
                </button>
                <input type="range" id="modal-volume-slider" min="0" max="100" value="100"
                       class="w-24 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"/>
              </div>
            </div>
          </div>
          <div class="w-1/2 flex flex-col pl-12 border-l border-white/10">
            <h2 id="modal-playlist-title" class="text-white text-xl font-semibold mb-4">Danh sách phát liên quan</h2>
            <div id="modal-playlist" class="flex-1 overflow-y-auto space-y-2 pr-4">
            </div>
          </div>
        </div>
      </div>
    </div>`;

  document.body.insertAdjacentHTML("beforeend", playerHTML);
  attachEventListeners();
  setupMainPlayerVolumeListener();
  updateVolumeUI();
  setupProgressHover();
  setupModalProgressHover();
}

function setupMainPlayerVolumeListener() {
  document.addEventListener("mainPlayerVolumeChanged", (event) => {
    const { volume: newVolume, isMuted: newIsMuted } = event.detail;
    const state = getPlayerState();

    if (
      Math.abs(newVolume - state.volume) <= 1 &&
      newIsMuted === state.isMuted
    ) {
      return;
    }

    if (newIsMuted !== state.isMuted) {
      if (newIsMuted) {
        localStorage.setItem("player_volume_before_mute", String(state.volume));
        localStorage.setItem("player_volume", "0");
        localStorage.setItem("player_muted", "true");
      } else {
        const volumeBeforeMute =
          parseInt(localStorage.getItem("player_volume_before_mute")) || 50;
        localStorage.setItem("player_volume", String(volumeBeforeMute));
        localStorage.setItem("player_muted", "false");
      }
    } else if (!newIsMuted && newVolume !== state.volume) {
      localStorage.setItem("player_volume", String(newVolume));
    }

    updateVolumeUI();
    updateModalVolumeUI();
  });
}

export function setupProgressHover() {
  const progressContainer = document.querySelector("#progress-container");
  const progressBar = document.querySelector("#progress-bar");
  const tooltip = document.querySelector("#progress-tooltip");

  if (!progressContainer || !progressBar || !tooltip) return;

  progressContainer.addEventListener("mousemove", (e) => {
    const state = getPlayerState();
    if (!state.duration) return;

    const rect = progressContainer.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const time = (percentage / 100) * state.duration;

    tooltip.textContent = formatTime(time);
    tooltip.style.left = `${x}px`;
    tooltip.style.opacity = "1";
  });

  progressContainer.addEventListener("mouseleave", () => {
    tooltip.style.opacity = "0";
  });
}

export function attachEventListeners() {
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
    const state = getPlayerState();
    const time = (e.target.value / 100) * state.duration;
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

  document
    .querySelector("#player-info-clickable")
    ?.addEventListener("click", () => {
      toggleModal();
    });

  document.querySelector("#modal-close-btn")?.addEventListener("click", () => {
    toggleModal();
  });

  document.querySelector("#modal-play-btn")?.addEventListener("click", () => {
    togglePlay();
  });

  document.querySelector("#modal-prev-btn")?.addEventListener("click", () => {
    playPrevious();
  });

  document.querySelector("#modal-next-btn")?.addEventListener("click", () => {
    playNext();
  });

  const modalProgressBar = document.querySelector("#modal-progress-bar");
  modalProgressBar?.addEventListener("input", (e) => {
    const state = getPlayerState();
    const time = (e.target.value / 100) * state.duration;
    seek(time);
  });

  const modalVolumeSlider = document.querySelector("#modal-volume-slider");
  modalVolumeSlider?.addEventListener("input", (e) => {
    const newVol = parseInt(e.target.value) || 0;
    setVolume(newVol);
  });

  document.querySelector("#modal-volume-btn")?.addEventListener("click", () => {
    toggleMute();
  });

  document.querySelector("#modal-repeat-btn")?.addEventListener("click", () => {
    toggleRepeat();
  });

  document
    .querySelector("#modal-shuffle-btn")
    ?.addEventListener("click", () => {
      toggleShuffle();
    });
}
