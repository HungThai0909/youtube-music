export const QuickPickSection = {
  BASE_API_URL: import.meta.env.VITE_BASE_URL,
  ITEMS_PER_PAGE: 4,
  currentPage: 0,
  playlists: [],
  currentMood: null,
  router: null,
  setRouter(routerInstance) {
    this.router = routerInstance;
  },

  render() {
    return `
      <section class="mb-10">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-3xl font-bold text-white">Quick Picks</h2>
          <div class="flex gap-4">
            <button id="quick-picks-prev"
              class="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center cursor-pointer">
              <i class="fas fa-chevron-left"></i>
            </button>
            <button id="quick-picks-next"
              class="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center cursor-pointer">
              <i class="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>
        <div id="quick-picks-container"></div>
        <div id="quick-picks-loading" class="text-white text-center py-8">
          <i class="fas fa-spinner fa-spin text-3xl"></i>
          <p class="mt-2">Đang tải...</p>
        </div>
        <div id="quick-picks-error" class="hidden text-center text-red-400 py-8">
          Không thể tải dữ liệu
        </div>
      </section>
    `;
  },

  getApiUrl(mood = null) {
    let url = `${this.BASE_API_URL}/quick-picks?limit=20`;
    if (mood) url += `&mood=${mood}`;
    return url;
  },

  async fetchPlaylists(mood = null) {
    try {
      this.currentMood = mood;
      const res = await fetch(this.getApiUrl(mood));
      if (!res.ok) throw new Error("Fetch failed");
      this.playlists = await res.json();
      this.hideLoading();
      this.renderPlaylists();
      this.updateNavigation();
    } catch (err) {
      console.error(err);
      this.showError();
    }
  },

  hideLoading() {
    document.querySelector("#quick-picks-loading")?.classList.add("hidden");
  },

  showError() {
    document.querySelector("#quick-picks-loading")?.classList.add("hidden");
    document.querySelector("#quick-picks-error")?.classList.remove("hidden");
  },

  navigateToDetail(playlist) {
    const slug = playlist.slug || playlist.id || playlist._id;
    if (!slug || !this.router) return;
    const url = `/playlist/details/${slug}`;
    this.router.navigate(url);
  },

  renderPlaylists() {
    const container = document.querySelector("#quick-picks-container");
    container.innerHTML = "";
    if (!this.playlists.length) {
      container.innerHTML = `<p class="text-gray-400 text-center py-4">Không có playlist</p>`;
      return;
    }
    const start = this.currentPage * this.ITEMS_PER_PAGE;
    const end = start + this.ITEMS_PER_PAGE;
    this.playlists.slice(start, end).forEach((playlist) => {
      const item = document.createElement("div");
      item.className =
        "flex items-center gap-4 p-3 hover:bg-gray-800 rounded-lg cursor-pointer group max-w-md";
      const thumb =
        playlist.thumbnails?.[0] ||
        "https://via.placeholder.com/60x60?text=No+Image";
      item.innerHTML = `
        <div class="relative w-16 h-16">
          <img src="${thumb}" class="w-full h-full rounded object-cover">
          <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center">
            <button class="play-btn w-8 h-8 rounded-full bg-white flex items-center justify-center cursor-pointer">
              <i class="fas fa-play text-xs text-black ml-0.5"></i>
            </button>
          </div>
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="text-white font-medium truncate">
            ${playlist.title || "Unknown"}
          </h3>
          <p class="text-gray-400 text-sm truncate">
            ${(playlist.artists || []).join(" • ")} • ${
        playlist.popularity || 0
      } lượt nghe
          </p>
        </div>
      `;

      item.addEventListener("click", (e) => {
        e.stopPropagation();
        this.navigateToDetail(playlist);
      });
      container.appendChild(item);
    });
  },

  updateNavigation() {
    const prev = document.querySelector("#quick-picks-prev");
    const next = document.querySelector("#quick-picks-next");
    const total = Math.ceil(this.playlists.length / this.ITEMS_PER_PAGE);
    prev.disabled = this.currentPage === 0;
    next.disabled = this.currentPage >= total - 1;
  },

  slide(dir) {
    const total = Math.ceil(this.playlists.length / this.ITEMS_PER_PAGE);
    if (dir === "next" && this.currentPage < total - 1) this.currentPage++;
    if (dir === "prev" && this.currentPage > 0) this.currentPage--;
    this.renderPlaylists();
    this.updateNavigation();
  },

  setupEventListeners() {
    document
      .querySelector("#quick-picks-prev")
      ?.addEventListener("click", () => this.slide("prev"));
    document
      .querySelector("#quick-picks-next")
      ?.addEventListener("click", () => this.slide("next"));
  },

  init(mood = null) {
    this.currentPage = 0;
    this.setupEventListeners();
    this.fetchPlaylists(mood);
  },
};