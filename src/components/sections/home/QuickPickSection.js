export const QuickPickSection = {
  BASE_API_URL: import.meta.env.VITE_BASE_URL,
  playlists: [],
  currentMood: null,
  router: null,
  hideInternalLoading: false,
  setRouter(routerInstance) {
    this.router = routerInstance;
  },
  render() {
    return `
      <section class="mb-10">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-5xl font-bold text-white">Quick Picks</h2>
          <div class="flex gap-4">
            <button
              id="quick-picks-prev"
              class="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700
                     text-gray-400 hover:text-white
                     flex items-center justify-center cursor-pointer
                     opacity-50"
              disabled>
              <i class="fas fa-chevron-left"></i>
            </button>
            <button
              id="quick-picks-next"
              class="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700
                     text-gray-400 hover:text-white
                     flex items-center justify-center cursor-pointer
                     opacity-50"
              disabled>
              <i class="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>
        <div id="quick-picks-wrapper" class="relative"> 
          <div id="quick-picks-container" class="space-y-1">
            ${Array(5)
              .fill("")
              .map(
                () => `
              <div class="flex items-center gap-4 p-3 rounded-lg opacity-0">
                <div class="w-16 h-16 rounded bg-gray-800"></div>
                <div class="flex-1 min-w-0">
                  <div class="h-5 bg-gray-800 rounded w-3/4 mb-2"></div>
                  <div class="h-4 bg-gray-800 rounded w-1/2"></div>
                </div>
              </div>
            `
              )
              .join("")}
          </div>
          <div
            id="quick-picks-loading"
            class="hidden absolute inset-0 flex items-center justify-center text-white bg-gray-900/80">
            <i class="fas fa-spinner fa-spin text-3xl"></i>
          </div>
          <div
            id="quick-picks-error"
            class="hidden absolute inset-0 flex items-center justify-center text-gray-400 bg-gray-900">
            Không thể tải dữ liệu
          </div>
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
      this.hideError();
      await this.renderPlaylists();
      this.updateNavigation();
    } catch (err) {
      console.error(err);
      this.showError();
    }
  },

  hideLoading() {
    document.querySelector("#quick-picks-loading")?.classList.add("hidden");
  },

  showLoading() {
    document.querySelector("#quick-picks-loading")?.classList.remove("hidden");
  },

  showError() {
    document.querySelector("#quick-picks-loading")?.classList.add("hidden");
    document.querySelector("#quick-picks-error")?.classList.remove("hidden");
  },

  hideError() {
    document.querySelector("#quick-picks-error")?.classList.add("hidden");
  },

  renderPlaylists() {
    return new Promise((resolve) => {
      const container = document.querySelector("#quick-picks-container");
      const wrapper = document.querySelector("#quick-picks-wrapper");
      if (!container || !wrapper) return resolve();
      container.innerHTML = "";
      const count = this.playlists.length;
      if (count === 0) {
        container.innerHTML = `
          <div class="flex h-full items-center justify-center text-gray-400">
          </div>
        `;
        return resolve();
      }
      let loadedImages = 0;
      this.playlists.forEach((playlist) => {
        const item = document.createElement("div");
        item.className =
          "flex items-center gap-4 p-3 rounded-lg hover:bg-gray-800 cursor-pointer";
        item.innerHTML = `
          <div class="relative group">
            <img
              src="${playlist.thumbnails?.[0] ?? ""}"
              class="w-16 h-16 rounded object-cover" />
            <button
              class="quickpick-play-btn absolute inset-0
                     flex items-center justify-center
                     bg-black/40 opacity-0
                     group-hover:opacity-100
                     transition-opacity duration-200
                     rounded cursor-pointer"
              onclick="event.stopPropagation()">
              <div
                class="w-8 h-8 bg-white rounded-full
                       flex items-center justify-center">
                <i class="fas fa-play text-gray-900 text-xs ml-0.5"></i>
              </div>
            </button>
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="text-white truncate">${playlist.title ?? ""}</h3>
            <p class="text-gray-400 text-sm truncate">${(
              playlist.artists || []
            ).join(" • ")}</p>
          </div>
        `;
        item.addEventListener("click", () => {
          const slug = playlist.slug || playlist.id;
          if (slug && this.router)
            this.router.navigate(`/playlist/details/${slug}`);
        });
        const playBtn = item.querySelector(".quickpick-play-btn");
        if (playBtn) {
          playBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            const slug = playlist.slug || playlist.id;
            if (slug && this.router)
              this.router.navigate(`/playlist/details/${slug}`);
          });
        }
        const img = item.querySelector("img");
        if (img) {
          img.onload = img.onerror = () => {
            loadedImages++;
            if (loadedImages === this.playlists.length) resolve();
          };
        }
        container.appendChild(item);
      });
      if (this.playlists.every((p) => !p.thumbnails?.[0])) resolve();
    });
  },

  updateNavigation() {
    const prevBtn = document.querySelector("#quick-picks-prev");
    const nextBtn = document.querySelector("#quick-picks-next");
    if (!prevBtn || !nextBtn) return;
    prevBtn.disabled = true;
    nextBtn.disabled = true;
    prevBtn.classList.add("opacity-40");
    nextBtn.classList.add("opacity-40");
  },

  init(mood = null, options = {}) {
    this.currentMood = mood;
    this.hideInternalLoading = options.hideLoading === true;
    return this.fetchPlaylists(mood);
  },
};
