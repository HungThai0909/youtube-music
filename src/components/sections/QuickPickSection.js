export const QuickPickSection = {
  API_URL:
    "https://youtube-music.f8team.dev/api/quick-picks?mood?country&limit=20",
  ITEMS_PER_PAGE: 4,
  currentPage: 0,
  playlists: [],

  render() {
    return `
      <section class="mb-10">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-3xl font-bold text-white">Quick Picks</h2>
          <div class="flex gap-4">
            <button id="quick-picks-prev" class="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-all duration-300 flex items-center justify-center cursor-pointer">
              <i class="fas fa-chevron-left"></i>
            </button>
            <button id="quick-picks-next" class="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-all duration-300 flex items-center justify-center cursor-pointer">
              <i class="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>
        <div id="quick-picks-container" class="space-y-0">
        </div>
        <div id="quick-picks-loading" class="text-white py-8 text-center">
          <i class="fas fa-spinner fa-spin text-3xl"></i>
          <p class="mt-2">Đang tải...</p>
        </div>
        <div id="quick-picks-error" class="hidden text-center text-red-400 py-8">
          <i class="fas fa-exclamation-circle text-3xl"></i>
          <p class="mt-2">Không thể tải dữ liệu</p>
        </div>
      </section>
    `;
  },

  async fetchPlaylists() {
    try {
      const response = await fetch(this.API_URL);
      if (!response.ok) throw new Error("Network response was not ok");
      const data = await response.json();
      console.log("API Response:", data);
      console.log("Is Array:", Array.isArray(data));
      this.playlists = Array.isArray(data) ? data : [];
      console.log("Playlists count:", this.playlists.length);
      if (this.playlists.length > 0) {
        console.log("First playlist:", this.playlists[0]);
      }
      this.hideLoading();
      this.renderPlaylists();
      this.updateNavigation();
    } catch (error) {
      console.error("Error fetching playlists:", error);
      this.showError();
    }
  },

  hideLoading() {
    const loadingEl = document.querySelector("#quick-picks-loading");
    if (loadingEl) loadingEl.classList.add("hidden");
  },

  showError() {
    const loadingEl = document.querySelector("#quick-picks-loading");
    const errorEl = document.querySelector("#quick-picks-error");
    if (loadingEl) loadingEl.classList.add("hidden");
    if (errorEl) errorEl.classList.remove("hidden");
  },

  renderPlaylists() {
    const container = document.querySelector("#quick-picks-container");
    if (!container) {
      console.error("Container not found!");
      return;
    }
    container.innerHTML = "";
    if (this.playlists.length === 0) {
      container.innerHTML = '<p class="text-white">Không có dữ liệu</p>';
      return;
    }
    const start = this.currentPage * this.ITEMS_PER_PAGE;
    const end = start + this.ITEMS_PER_PAGE;
    const pageItems = this.playlists.slice(start, end);
    console.log(
      `Rendering page ${this.currentPage + 1}, items ${start}-${end}`
    );

    pageItems.forEach((playlist) => {
      const playlistItem = document.createElement("div");
      playlistItem.className =
        "flex items-center gap-4 p-3 hover:bg-gray-800 rounded-lg transition-all duration-200 cursor-pointer group max-w-md";
      const thumbnail =
        Array.isArray(playlist.thumbnails) && playlist.thumbnails.length > 0
          ? playlist.thumbnails[0]
          : "https://via.placeholder.com/60x60?text=No+Image";
      const title = playlist.title || "Unknown Title";
      const artists =
        Array.isArray(playlist.artists) && playlist.artists.length > 0
          ? playlist.artists.join(" • ")
          : "Various Artists";
      const popularity = playlist.popularity || 0;
      playlistItem.innerHTML = `
        <div class="flex-shrink-0 w-16 h-16 relative">
          <img src="${thumbnail}" alt="${title}" class="w-full h-full object-cover rounded" onerror="this.src='https://via.placeholder.com/60x60?text=No+Image'">
          <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center rounded">
            <button class="w-8 h-8 rounded-full bg-white hover:bg-white/90 flex items-center justify-center transform scale-0 group-hover:scale-100 transition-transform duration-200">
              <i class="fas fa-play text-gray-900 text-xs ml-0.5 cursor-pointer"></i>
            </button>
          </div>
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="text-white font-medium text-base truncate">${title}</h3>
          <p class="text-gray-400 text-sm truncate">${artists} • ${popularity} lượt nghe</p>
        </div>
      `;

      container.appendChild(playlistItem);
    });
  },

  updateNavigation() {
    const prevBtn = document.querySelector("#quick-picks-prev");
    const nextBtn = document.querySelector("#quick-picks-next");
    if (!prevBtn || !nextBtn) return;
    const totalPages = Math.ceil(this.playlists.length / this.ITEMS_PER_PAGE);
    prevBtn.dataset.disabled = this.currentPage === 0;
    nextBtn.dataset.disabled = this.currentPage >= totalPages - 1;
  },

  slide(direction) {
    const totalPages = Math.ceil(this.playlists.length / this.ITEMS_PER_PAGE);
    if (direction === "next" && this.currentPage < totalPages - 1) {
      this.currentPage++;
    } else if (direction === "prev" && this.currentPage > 0) {
      this.currentPage--;
    }
    this.renderPlaylists();
    this.updateNavigation();
  },

  setupEventListeners() {
    const prevBtn = document.querySelector("#quick-picks-prev");
    const nextBtn = document.querySelector("#quick-picks-next");
    if (prevBtn) prevBtn.addEventListener("click", () => this.slide("prev"));
    if (nextBtn) nextBtn.addEventListener("click", () => this.slide("next"));
    document.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") this.slide("prev");
      if (e.key === "ArrowRight") this.slide("next");
    });
  },

  init() {
    this.setupEventListeners();
    this.fetchPlaylists();
  },
};
