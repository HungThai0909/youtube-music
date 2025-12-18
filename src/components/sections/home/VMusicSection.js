export const VMusicSection = {
  API_URL: `${import.meta.env.VITE_BASE_URL}/playlists/by-country?country=VN`,
  CARD_WIDTH: 256,
  CARD_GAP: 16,
  currentPage: 0,
  playlists: [],
  router: null,
  hideInternalLoading: false,
  setRouter(routerInstance) {
    this.router = routerInstance;
  },
  render() {
    return `
      <section class="mb-14">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-5xl font-bold text-white">Nhạc Việt</h2>
          <div class="flex gap-4">
            <button id="vmusic-prev"
              class="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700
                   text-gray-400 hover:text-white
                     flex items-center justify-center cursor-pointer">
              <i class="fas fa-chevron-left"></i>
            </button>
            <button id="vmusic-next"
              class="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700
                   text-gray-400 hover:text-white
                     flex items-center justify-center cursor-pointer">
              <i class="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>
        <div class="relative overflow-hidden">
          <div id="vmusic-container" class="flex gap-4 transition-transform duration-500">
            ${Array(5)
              .fill("")
              .map(
                () => `
              <div class="flex-shrink-0 w-64 opacity-0">
                <div class="w-full aspect-square rounded-lg bg-gray-800"></div>
                <div class="mt-2 h-5 bg-gray-800 rounded w-3/4"></div>
                <div class="mt-2 h-4 bg-gray-800 rounded w-1/2"></div>
              </div>
            `
              )
              .join("")}
          </div>
        </div>
        <div class="h-5 mt-4">
          <div id="vmusic-scrollbar-track"
            class="h-1 bg-gray-700 rounded-full relative cursor-pointer hidden">
            <div id="vmusic-scrollbar-thumb"
              class="absolute h-1 bg-gray-400 rounded-full left-0">
            </div>
          </div>
        </div>
        <div id="vmusic-loading" class="hidden py-8 text-center text-white">
          <i class="fas fa-spinner fa-spin text-3xl"></i>
        </div>
        <div id="vmusic-error"
          class="hidden py-8 text-center text-white">
          Không thể tải dữ liệu
        </div>
      </section>
    `;
  },

  hideScrollbar() {
    document.querySelector("#vmusic-scrollbar-track")?.classList.add("hidden");
  },

  showScrollbar() {
    document
      .querySelector("#vmusic-scrollbar-track")
      ?.classList.remove("hidden");
  },

  hideLoading() {
    document.querySelector("#vmusic-loading")?.classList.add("hidden");
  },

  showError() {
    this.hideLoading();
    document.querySelector("#vmusic-error")?.classList.remove("hidden");
  },

  hideError() {
    document.querySelector("#vmusic-error")?.classList.add("hidden");
  },

  getItemsPerPage() {
    const wrapper = document.querySelector("#vmusic-container")?.parentElement;
    if (!wrapper) return 1;
    return Math.max(
      Math.floor(wrapper.clientWidth / (this.CARD_WIDTH + this.CARD_GAP)),
      1
    );
  },

  getTotalPages() {
    return Math.ceil(this.playlists.length / this.getItemsPerPage());
  },

  async fetchPlaylists() {
    try {
      if (this.hideInternalLoading) {
        this.hideLoading();
      }
      const res = await fetch(this.API_URL);
      if (!res.ok) throw new Error("Fetch failed");
      this.playlists = await res.json();
      this.hideLoading();
      this.hideError();
      this.currentPage = 0;
      this.renderPlaylists();
      this.updateNavigation();
      this.updateScrollbar();
    } catch (err) {
      console.error(err);
      this.showError();
    }
  },

  renderPlaylists() {
    const container = document.querySelector("#vmusic-container");
    if (!container) return;
    container.innerHTML = "";
    const perPage = this.getItemsPerPage();
    const start = this.currentPage * perPage;
    const end = start + perPage;
    this.playlists.slice(start, end).forEach((p) => {
      const card = document.createElement("div");
      card.className = "flex-shrink-0 w-64 cursor-pointer";
      card.innerHTML = `
        <div class="relative group">
          <img src="${p.thumbnails?.[0] ?? ""}"
               class="w-full aspect-square rounded-lg object-cover" />
          <button
            class="vmusic-play-btn absolute inset-0 flex items-center justify-center
                   bg-black/40 opacity-0 group-hover:opacity-100
                   transition-opacity duration-200 rounded-lg cursor-pointer"
            onclick="event.stopPropagation()">
            <div class="w-12 h-12 bg-white rounded-full flex items-center justify-center">
              <i class="fas fa-play text-gray-900 text-sm ml-0.5"></i>
            </div>
          </button>
        </div>
        <h3 class="mt-2 text-white truncate">
          ${p.title ?? ""}
        </h3>
        <p class="text-gray-400 text-sm truncate">
          ${(p.artists || []).join(", ")}
        </p>
      `;
      card.addEventListener("click", () => {
        const slug = p.slug || p.id;
        if (slug && this.router) {
          this.router.navigate(`/playlist/details/${slug}`);
        }
      });
      const playBtn = card.querySelector(".vmusic-play-btn");
      playBtn?.addEventListener("click", (e) => {
        e.stopPropagation();
        const slug = p.slug || p.id;
        if (slug && this.router) {
          this.router.navigate(`/playlist/details/${slug}`);
        }
      });
      container.appendChild(card);
    });
  },

  updateNavigation() {
    const prev = document.querySelector("#vmusic-prev");
    const next = document.querySelector("#vmusic-next");
    const total = this.getTotalPages();
    if (!prev || !next) return;
    prev.disabled = this.currentPage === 0;
    next.disabled = this.currentPage >= total - 1;
    prev.style.opacity = prev.disabled ? "0.4" : "1";
    next.style.opacity = next.disabled ? "0.4" : "1";
  },

  updateScrollbar() {
    const track = document.querySelector("#vmusic-scrollbar-track");
    const thumb = document.querySelector("#vmusic-scrollbar-thumb");
    if (!track || !thumb || !this.playlists.length) {
      this.hideScrollbar();
      return;
    }
    const total = this.getTotalPages();
    if (total <= 1) {
      this.hideScrollbar();
      return;
    }
    this.showScrollbar();
    const width = Math.max(100 / total, 10);
    const progress = this.currentPage / (total - 1);
    thumb.style.width = `${width}%`;
    thumb.style.left = `${progress * (100 - width)}%`;
  },

  slide(dir) {
    const total = this.getTotalPages();
    if (dir === "next" && this.currentPage < total - 1) this.currentPage++;
    if (dir === "prev" && this.currentPage > 0) this.currentPage--;
    this.renderPlaylists();
    this.updateNavigation();
    this.updateScrollbar();
  },

  setupEventListeners() {
    document
      .querySelector("#vmusic-prev")
      ?.addEventListener("click", () => this.slide("prev"));

    document
      .querySelector("#vmusic-next")
      ?.addEventListener("click", () => this.slide("next"));
  },

  init(options = {}) {
    this.hideInternalLoading = options.hideLoading === true;
    this.currentPage = 0;
    this.hideScrollbar();
    if (this.hideInternalLoading) {
      this.hideLoading();
    }
    this.setupEventListeners();
    this.fetchPlaylists();
  },
};
