export const VMusicSection = {
  API_URL: `${import.meta.env.VITE_BASE_URL}/playlists/by-country?country=VN`,
  ITEMS_PER_PAGE: 4,
  currentPage: 0,
  playlists: [],
  router: null,
  setRouter(routerInstance) {
    this.router = routerInstance;
  },
  render() {
    return `
      <section class="mb-14">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-3xl font-bold text-white">Nhạc Việt</h2>
          <div class="flex gap-4">
            <button id="vmusic-prev"
              class="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700
                     text-gray-400 hover:text-white transition flex items-center justify-center cursor-pointer">
              <i class="fas fa-chevron-left"></i>
            </button>
            <button id="vmusic-next"
              class="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700
                     text-gray-400 hover:text-white transition flex items-center justify-center cursor-pointer">
              <i class="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>
        <div class="relative overflow-hidden">
          <div id="vmusic-container" class="flex gap-4 transition-transform duration-500 ease-in-out">
         </div>
        </div>
        <div id="vmusic-loading" class="text-white py-8 text-center">
          <i class="fas fa-spinner fa-spin text-3xl"></i>
          <p class="mt-2">Đang tải...</p>
        </div>
        <div id="vmusic-error"
          class="hidden text-center text-red-400 py-8">
          <p>Không thể tải dữ liệu</p>
        </div>
      </section>
    `;
  },

  async fetchPlaylists() {
    try {
      const res = await fetch(this.API_URL);
      if (!res.ok) throw new Error("Fetch failed");
      const data = await res.json();
      this.playlists = Array.isArray(data) ? data : [];
      this.hideLoading();
      this.renderPlaylists();
      this.updateNavigation();
      return true;
    } catch (err) {
      console.error(err);
      this.showError();
      return false;
    }
  },

  hideLoading() {
    document.querySelector("#vmusic-loading")?.classList.add("hidden");
  },

  showError() {
    document.querySelector("#vmusic-loading")?.classList.add("hidden");
    document.querySelector("#vmusic-error")?.classList.remove("hidden");
  },

  navigateToPlaylist(playlist) {
    const slug = playlist.slug || playlist.id || playlist._id;
    if (!slug || !this.router) return;
    this.router.navigate(`/playlist/details/${slug}`);
  },

  renderPlaylists() {
    const container = document.querySelector("#vmusic-container");
    if (!container) return;
    container.innerHTML = "";
    this.playlists.forEach((playlist) => {
      const card = document.createElement("div");
      card.className = "flex-shrink-0 w-64";
      const thumbnail =
        playlist.thumbnails?.[0] ??
        "https://via.placeholder.com/300x300?text=No+Image";
      const title = playlist.title ?? "Unknown Playlist";
      const artists = playlist.artists?.join(", ") ?? "Various Artists";
      card.innerHTML = `
        <div class="group cursor-pointer" data-playlist-slug="${
          playlist.slug || playlist.id || ""
        }">
          <div class="relative">
            <img
              src="${thumbnail}"
              alt="${title}"
              class="w-full aspect-square object-cover rounded-lg cursor-pointer"
            />
            <button
              class="vmusic-play-btn absolute inset-0 flex items-center justify-center
                     bg-black/40 opacity-0 group-hover:opacity-100
                     transition-opacity duration-200 rounded-lg cursor-pointer">
              <div
                class="w-12 h-12 bg-white rounded-full
                       flex items-center justify-center transition hover:scale-110">
                <i class="fas fa-play text-gray-900 text-sm ml-0.5"></i>
              </div>
            </button>
          </div>
          <h3 class="mt-3 text-white truncate">
            ${title}
          </h3>
          <p class="text-gray-400 text-sm truncate">
            ${artists}
          </p>
        </div>
      `;

      const playlistCard = card.querySelector("[data-playlist-slug]");
      const playBtn = card.querySelector(".vmusic-play-btn");
      if (playlistCard) {
        playlistCard.addEventListener("click", (e) => {
          if (e.target.closest(".vmusic-play-btn")) return;
          this.navigateToPlaylist(playlist);
        });
      }
      if (playBtn) {
        playBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          this.navigateToPlaylist(playlist);
        });
      }
      container.appendChild(card);
    });
  },

  updateNavigation() {
    const prevBtn = document.querySelector("#vmusic-prev");
    const nextBtn = document.querySelector("#vmusic-next");
    const totalPages = Math.ceil(this.playlists.length / this.ITEMS_PER_PAGE);
    prevBtn.dataset.disabled = this.currentPage === 0;
    nextBtn.dataset.disabled = this.currentPage >= totalPages - 1;
  },
  slide(direction) {
    const totalPages = Math.ceil(this.playlists.length / this.ITEMS_PER_PAGE);
    if (direction === "next" && this.currentPage < totalPages - 1) {
      this.currentPage++;
    }
    if (direction === "prev" && this.currentPage > 0) {
      this.currentPage--;
    }
    this.renderPlaylists();
    this.updateNavigation();
  },

  setupEventListeners() {
    document
      .querySelector("#vmusic-prev")
      ?.addEventListener("click", () => this.slide("prev"));

    document
      .querySelector("#vmusic-next")
      ?.addEventListener("click", () => this.slide("next"));
  },

  init() {
    this.setupEventListeners();
    return this.fetchPlaylists();
  },
};
