import api from "../axios";

export function initSearchHandler() {
  const searchInput = document.querySelector("#searchInput");
  const searchResults = document.querySelector("#searchResults");
  const searchLoading = document.querySelector("#searchLoading");
  const searchSuggestions = document.querySelector("#searchSuggestions");
  const suggestionsList = document.querySelector("#suggestionsList");
  const searchContent = document.querySelector("#searchContent");
  const searchNoResults = document.querySelector("#searchNoResults");
  const clearSearch = document.querySelector("#clearSearch");
  const searchIcon = document.querySelector("#searchIcon");

  if (!searchInput) return;
  let debounceTimer = null;
  let currentQuery = "";
  const debounce = (func, delay) => {
    return (...args) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => func(...args), delay);
    };
  };
  const hideAllSections = () => {
    searchLoading.classList.add("hidden");
    searchSuggestions.classList.add("hidden");
    searchContent.classList.add("hidden");
    searchNoResults.classList.add("hidden");
  };
  const showLoading = () => {
    hideAllSections();
    searchLoading.classList.remove("hidden");
    searchResults.classList.remove("hidden");
  };

  const hideSearchResults = () => {
    searchResults.classList.add("hidden");
    hideAllSections();
  };

  const fetchSuggestions = async (query) => {
    try {
      const response = await api.get("/search/suggestions", {
        params: { q: query },
      });
      return {
        suggestions: response.data?.suggestions || [],
        completed: response.data?.completed || [],
      };
    } catch (error) {
      return { suggestions: [], completed: [] };
    }
  };

  const fetchSearchResults = async (query, limit = 20, page = 1) => {
    try {
      const response = await api.get("/search", {
        params: { q: query, limit, page },
      });
      if (response.data) {
      }
      return response.data || {};
    } catch (error) {
      return {};
    }
  };

  const renderSuggestions = (suggestionData) => {
    const { suggestions = [], completed = [] } = suggestionData;
    const query = searchInput.value.trim().toLowerCase();
    const filteredSuggestions = suggestions.filter((item) => {
      const itemLower = item.toLowerCase();
      const matches = itemLower.startsWith(query);
      return matches;
    });

    const filteredCompleted = completed.filter((item) => {
      const titleLower = item.title.toLowerCase();
      const matches = titleLower.startsWith(query);
      return matches;
    });

    if (!filteredSuggestions.length && !filteredCompleted.length) {
      searchSuggestions.classList.add("hidden");
      return;
    }

    let html = "";
    if (filteredSuggestions.length > 0) {
      html += filteredSuggestions
        .map(
          (item) => `
          <div class="px-4 py-3 hover:bg-gray-800 cursor-pointer transition-colors flex items-center gap-3 suggestion-item" data-query="${item}">
            <span class="text-white">${item}</span>
          </div>
        `
        )
        .join("");
    }

    if (filteredCompleted.length > 0) {
      html += `<div class="px-4 py-2 text-xs text-gray-500 uppercase font-semibold mt-2">Kết quả</div>`;
      html += filteredCompleted
        .map(
          (item) => `
          <div class="px-4 py-3 hover:bg-gray-800 cursor-pointer transition-colors flex items-center gap-3 completed-item" 
               data-id="${item.id}" 
               data-type="${item.type}"
               data-slug="${item.slug}">
            <img 
              src="${item.thumbnails?.[0] || "https://via.placeholder.com/48"}" 
              alt="${item.title}" 
              class="w-12 h-12 rounded object-cover"
              onerror="this.src='https://via.placeholder.com/48'"
            >
            <div class="flex-1 min-w-0">
              <div class="text-white font-medium truncate">${item.title}</div>
              <div class="text-gray-400 text-xs flex items-center gap-2">
                <span class="truncate">${item.subtitle || ""}</span>
              </div>
            </div>
          </div>
        `
        )
        .join("");
    }

    suggestionsList.innerHTML = html;
    searchSuggestions.classList.remove("hidden");
    document.querySelectorAll(".suggestion-item").forEach((item) => {
      item.addEventListener("click", () => {
        const query = item.getAttribute("data-query");
        searchInput.value = query;
        performFullSearch(query);
      });
    });

    document.querySelectorAll(".completed-item").forEach((item) => {
      item.addEventListener("click", () => {
        const type = item.getAttribute("data-type");
        const id = item.getAttribute("data-id");
        const slug = item.getAttribute("data-slug");

        if (type === "album") {
          window.location.href = `/album/details/${id}`;
        } else if (type === "playlist") {
          window.location.href = `/playlist/details/${id}`;
        } else if (type === "song") {
          window.location.href = `/song/details/${id}`;
        } else if (type === "video") {
          window.location.href = `/video/details/${id}`;
        }
      });
    });
  };

  const renderSearchResults = (data) => {
    const results = data.results || [];

    if (!results || results.length === 0) {
      hideAllSections();
      searchNoResults.classList.remove("hidden");
      return;
    }

    const songs = results.filter((item) => item.type === "song");
    const albums = results.filter((item) => item.type === "album");
    const playlists = results.filter((item) => item.type === "playlist");
    const artists = results.filter((item) => item.type === "artist");
    const videos = results.filter((item) => item.type === "video");

    let html = "";

    if (videos.length > 0) {
      html += `
        <div class="border-b border-gray-800">
          <div class="px-4 py-3 text-sm text-gray-400 font-semibold">Video</div>
          ${videos
            .slice(0, 3)
            .map(
              (video) => `
            <div class="px-4 py-3 hover:bg-gray-800 cursor-pointer transition-colors flex items-center gap-3" data-video-id="${
              video.id
            }">
              <img 
                src="${
                  video.thumbnails?.[0] || "https://via.placeholder.com/96x54"
                }" 
                alt="${video.title}" 
                class="w-24 h-16 rounded object-cover"
                onerror="this.src='https://via.placeholder.com/96x54'"
              >
              <div class="flex-1 min-w-0">
                <div class="text-white font-medium truncate">${
                  video.title
                }</div>
                <div class="text-gray-400 text-sm truncate">${
                  video.subtitle || ""
                }</div>
              </div>
              <div class="text-gray-500 text-xs">${formatDuration(
                video.duration || 0
              )}</div>
            </div>
          `
            )
            .join("")}
        </div>
      `;
    }
    if (songs.length > 0) {
      html += `
        <div class="border-b border-gray-800">
          <div class="px-4 py-3 text-sm text-gray-400 font-semibold">Bài hát</div>
          ${songs
            .slice(0, 5)
            .map(
              (song) => `
            <div class="px-4 py-3 hover:bg-gray-800 cursor-pointer transition-colors flex items-center gap-3" data-song-id="${
              song.id
            }">
              <img 
                src="${
                  song.thumbnails?.[0] || "https://via.placeholder.com/48"
                }" 
                alt="${song.title}" 
                class="w-12 h-12 rounded object-cover"
                onerror="this.src='https://via.placeholder.com/48'"
              >
              <div class="flex-1 min-w-0">
                <div class="text-white font-medium truncate">${song.title}</div>
                <div class="text-gray-400 text-sm truncate">${
                  song.subtitle || "Unknown"
                }</div>
              </div>
              <div class="text-gray-500 text-xs">${formatDuration(
                song.duration || 0
              )}</div>
            </div>
          `
            )
            .join("")}
        </div>
      `;
    }

    if (albums.length > 0) {
      html += `
        <div class="border-b border-gray-800">
          <div class="px-4 py-3 text-sm text-gray-400 font-semibold">Album</div>
          <div class="grid grid-cols-2 gap-3 px-4 pb-3">
            ${albums
              .slice(0, 4)
              .map(
                (album) => `
              <div class="hover:bg-gray-800 p-2 rounded cursor-pointer transition-colors" data-album-id="${
                album.id
              }">
                <img 
                  src="${
                    album.thumbnails?.[0] || "https://via.placeholder.com/200"
                  }" 
                  alt="${album.title}" 
                  class="w-full aspect-square rounded object-cover mb-2"
                  onerror="this.src='https://via.placeholder.com/200'"
                >
                <div class="text-white text-sm font-medium truncate">${
                  album.title
                }</div>
                <div class="text-gray-400 text-xs truncate">${
                  album.subtitle || "Various Artists"
                }</div>
              </div>
            `
              )
              .join("")}
          </div>
        </div>
      `;
    }

    if (playlists.length > 0) {
      html += `
        <div class="border-b border-gray-800">
          <div class="px-4 py-3 text-sm text-gray-400 font-semibold">Playlist</div>
          ${playlists
            .slice(0, 3)
            .map(
              (playlist) => `
            <div class="px-4 py-3 hover:bg-gray-800 cursor-pointer transition-colors flex items-center gap-3" data-playlist-id="${
              playlist.id
            }">
              <img 
                src="${
                  playlist.thumbnails?.[0] || "https://via.placeholder.com/64"
                }" 
                alt="${playlist.title}" 
                class="w-16 h-16 rounded object-cover"
                onerror="this.src='https://via.placeholder.com/64'"
              >
              <div class="flex-1 min-w-0">
                <div class="text-white font-medium truncate">${
                  playlist.title
                }</div>
                <div class="text-gray-400 text-sm">${
                  playlist.subtitle || ""
                }</div>
              </div>
            </div>
          `
            )
            .join("")}
        </div>
      `;
    }

    if (artists.length > 0) {
      html += `
        <div class="border-b border-gray-800">
          <div class="px-4 py-3 text-sm text-gray-400 font-semibold">Nghệ sĩ</div>
          <div class="grid grid-cols-2 gap-3 px-4 pb-3">
            ${artists
              .slice(0, 4)
              .map(
                (artist) => `
              <div class="hover:bg-gray-800 p-2 rounded cursor-pointer transition-colors text-center" data-artist-id="${
                artist.id
              }">
                <img 
                  src="${
                    artist.thumbnails?.[0] || "https://via.placeholder.com/80"
                  }" 
                  alt="${artist.title}" 
                  class="w-20 h-20 rounded-full object-cover mx-auto mb-2"
                  onerror="this.src='https://via.placeholder.com/80'"
                >
                <div class="text-white text-sm font-medium truncate">${
                  artist.title
                }</div>
                <div class="text-gray-400 text-xs truncate">${
                  artist.subtitle || ""
                }</div>
              </div>
            `
              )
              .join("")}
          </div>
        </div>
      `;
    }

    searchContent.innerHTML = html;
    hideAllSections();
    searchContent.classList.remove("hidden");
  };

  const formatDuration = (seconds) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const performFullSearch = async (query) => {
    if (!query.trim()) {
      hideSearchResults();
      return;
    }

    currentQuery = query;
    showLoading();

    const results = await fetchSearchResults(query);
    if (currentQuery !== query) return;

    hideAllSections();
    renderSearchResults(results);
    searchResults.classList.remove("hidden");
  };

  const performSuggestionsOnly = async (query) => {
    if (!query.trim()) {
      hideSearchResults();
      return;
    }

    currentQuery = query;
    const suggestions = await fetchSuggestions(query);
    if (currentQuery !== query) return;

    hideAllSections();
    renderSuggestions(suggestions);
    searchResults.classList.remove("hidden");
  };

  const debouncedSuggestions = debounce(performSuggestionsOnly, 300);
  searchInput.addEventListener("input", (e) => {
    const query = e.target.value;

    if (query.trim()) {
      clearSearch.classList.remove("hidden");
      searchIcon.classList.add("hidden");
      debouncedSuggestions(query);
    } else {
      clearSearch.classList.add("hidden");
      searchIcon.classList.remove("hidden");
      hideSearchResults();
    }
  });

  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const query = searchInput.value.trim();
      if (query) {
        performFullSearch(query);
      }
    }
  });

  searchInput.addEventListener("focus", () => {
    if (searchInput.value.trim() && searchContent.innerHTML) {
      searchResults.classList.remove("hidden");
    }
  });

  clearSearch.addEventListener("click", () => {
    searchInput.value = "";
    clearSearch.classList.add("hidden");
    searchIcon.classList.remove("hidden");
    hideSearchResults();
    searchInput.focus();
  });

  document.addEventListener("click", (e) => {
    if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
      searchResults.classList.add("hidden");
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !searchResults.classList.contains("hidden")) {
      hideSearchResults();
    }
  });
}
