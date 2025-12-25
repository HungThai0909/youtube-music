export const PersonalizedSection = {
  BASE_API_URL: import.meta.env.VITE_BASE_URL,
  playlists: [],
  router: null,
  hideInternalLoading: false,
  currentIndex: 0,
  isDragging: false,
  setRouter(routerInstance) {
    this.router = routerInstance;
  },
  render() {
    return `
      <section class="mb-12">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-5xl font-bold text-white">Nghe gần đây</h2>
          <div class="flex gap-3">
            <button
              id="personalized-prev"
              class="w-9 h-9 rounded-full bg-gray-800 hover:bg-gray-700
                     text-gray-400 hover:text-white
                     flex items-center justify-center cursor-pointer">
              <i class="fas fa-chevron-left"></i>
            </button>
            <button
              id="personalized-next"
              class="w-9 h-9 rounded-full bg-gray-800 hover:bg-gray-700
                     text-gray-400 hover:text-white
                     flex items-center justify-center cursor-pointer">
              <i class="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>
        <div class="relative overflow-hidden" id="personalized-viewport">
          <div id="personalized-container"
            class="flex gap-4 transition-transform duration-300 ease-out">
            ${Array(3)
              .fill("")
              .map(
                () => `
              <div class="flex flex-col gap-3 shrink-0" style="width: calc(33.333% - 11px);">
                ${Array(4)
                  .fill("")
                  .map(
                    () => `
                  <div class="opacity-0">
                    <div class="flex items-center gap-4 p-4 bg-gray-800 rounded-lg">
                      <div class="w-16 h-16 bg-gray-700 rounded"></div>
                      <div class="flex-1">
                        <div class="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                        <div class="h-3 bg-gray-700 rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
                `
                  )
                  .join("")}
              </div>
            `
              )
              .join("")}
          </div>
        </div>
        <div class="h-5 mt-4">
          <div id="personalized-scrollbar-track"
            class="h-1 bg-white/10 rounded-full relative cursor-pointer hidden">
            <div id="personalized-scrollbar-thumb"
              class="absolute top-1/2 -translate-y-1/2 h-1 bg-white/40 rounded-full
                     transition-all duration-300 cursor-pointer w-1/5 left-0">
            </div>
          </div>
        </div>
      </section>
    `;
  },

  getApiUrl() {
    return `${this.BASE_API_URL}/home/personalized?limit=12`;
  },

  getCarouselMetrics() {
    const viewport = document.querySelector("#personalized-viewport");
    const container = document.querySelector("#personalized-container");
    if (!viewport || !container) {
      return {
        colWidth: 424,
        colsPerView: 3,
        viewportWidth: 1272,
        totalWidth: 0,
      };
    }
    const viewportWidth = viewport.offsetWidth;
    const gap = 16;
    const colWidth = 400 + gap;
    const colsPerView = Math.floor(viewportWidth / colWidth);
    const totalCols = Math.ceil(this.playlists.length / 4);
    const totalWidth = totalCols * colWidth - gap;
    return {
      colWidth,
      colsPerView,
      viewportWidth,
      totalWidth,
      totalCols,
    };
  },

  getMaxIndex() {
    const metrics = this.getCarouselMetrics();
    return Math.max(0, metrics.totalCols - metrics.colsPerView);
  },

  async fetchPlaylists() {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        const section = document.querySelector("#personalized-viewport");
        if (section) {
          section.closest("section").style.display = "none";
        }
        return;
      }
      const res = await fetch(this.getApiUrl(), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!res.ok) {
        throw new Error("Fetch failed");
      }   
      this.playlists = await res.json();
      const section = document.querySelector("#personalized-viewport");
      if (section) {
        section.closest("section").style.display = "block";
      }
      await this.renderPlaylists();
      requestAnimationFrame(() => {
        this.updateNavigation();
        this.updateScrollbar();
      });
    } catch (err) {
      console.error("Error fetching personalized playlists:", err);
    }
  },

  async refresh() {
    this.currentIndex = 0;
    await this.fetchPlaylists();
  },

  renderPlaylists() {
    return new Promise((resolve) => {
      const container = document.querySelector("#personalized-container");
      if (!container) return resolve();
      container.innerHTML = "";
      const count = this.playlists.length;
      if (count === 0) {
        container.innerHTML = `
          <div class="flex h-full items-center justify-center text-gray-400">
          </div>
        `;
        return resolve();
      }

      const formatViews = (views) => {
        if (!views) return "0 N lượt xem";
        if (views >= 1000000000)
          return `${(views / 1000000000).toFixed(1)} B lượt xem`;
        if (views >= 1000000)
          return `${(views / 1000000).toFixed(1)} M lượt xem`;
        if (views >= 1000) return `${(views / 1000).toFixed(1)} N lượt xem`;
        return `${views} lượt xem`;
      };
      const itemsPerColumn = 4;
      const totalColumns = Math.ceil(this.playlists.length / itemsPerColumn);
      let loadedImages = 0;
      const checkAllLoaded = () => {
        loadedImages++;
        if (loadedImages === this.playlists.length) resolve();
      };

      for (let colIndex = 0; colIndex < totalColumns; colIndex++) {
        const column = document.createElement("div");
        column.className = "flex flex-col gap-3 shrink-0";
        column.style.width = "calc(33.333% - 11px)";

        const startIdx = colIndex * itemsPerColumn;
        const endIdx = Math.min(startIdx + itemsPerColumn, this.playlists.length);

        for (let i = startIdx; i < endIdx; i++) {
          const playlist = this.playlists[i];
          const item = document.createElement("div");
          item.className = "cursor-pointer";
          item.dataset.playlistSlug = playlist.slug || playlist.id;

          item.innerHTML = `
            <div class="group">
              <div class="flex items-center gap-4 p-3 hover:bg-gray-700
                          rounded-lg transition cursor-pointer">
                <div class="relative flex-shrink-0 cursor-pointer">
                  <img
                    src="${playlist.thumbnails?.[0] ?? ""}"
                    alt="${playlist.title ?? ""}"
                    class="w-16 h-16 rounded object-cover cursor-pointer" />
                  <button class="absolute inset-0 flex items-center justify-center
                                 bg-black/40 opacity-0 group-hover:opacity-100
                                 transition-opacity duration-200 rounded cursor-pointer">
                    <div class="w-8 h-8 bg-white rounded-full
                               flex items-center justify-center">
                      <i class="fas fa-play text-gray-900 text-xs ml-0.5"></i>
                    </div>
                  </button>
                </div>
                <div class="flex-1 min-w-0">
                  <h3 class="text-white font-semibold truncate">
                    ${playlist.title ?? ""}
                  </h3>
                  <p class="text-gray-400 text-sm truncate">
                    ${formatViews(playlist.views || playlist.popularity)} &bull; ${
            (playlist.artists || []).join(", ") || "Various Artists"
          }
                  </p>
                </div>
              </div>
            </div>
          `;

          const img = item.querySelector("img");
          if (img) img.onload = img.onerror = checkAllLoaded;

          item.addEventListener("click", (e) => {
            e.preventDefault();
            const slug = playlist.slug || playlist.id;
            if (!slug || !this.router) return;
            const type = (playlist.type || "playlist").toLowerCase();
            if (type === "album") {
              this.router.navigate(`/album/details/${slug}`);
            } else if (type === "playlist") {
              this.router.navigate(`/playlist/details/${slug}`);
            } else if (type === "category") {
              this.router.navigate(`/category/${slug}`);
            } else {
              // default fallback
              this.router.navigate(`/playlist/details/${slug}`);
            }
          });

          column.appendChild(item);
        }

        container.appendChild(column);
      }

      if (this.playlists.every((p) => !p.thumbnails?.[0])) resolve();
    });
  },

  updateNavigation() {
    const maxIndex = this.getMaxIndex();
    const prevBtn = document.querySelector("#personalized-prev");
    const nextBtn = document.querySelector("#personalized-next");
    if (!prevBtn || !nextBtn) return;
    prevBtn.disabled = this.currentIndex === 0;
    nextBtn.disabled = this.currentIndex >= maxIndex;
    prevBtn.style.opacity = prevBtn.disabled ? "0.5" : "1";
    nextBtn.style.opacity = nextBtn.disabled ? "0.5" : "1";
  },

  slide(dir) {
    const maxIndex = this.getMaxIndex();
    if (dir === "next" && this.currentIndex < maxIndex) this.currentIndex++;
    if (dir === "prev" && this.currentIndex > 0) this.currentIndex--;
    this.updateSlide();
  },

  updateSlide() {
    const container = document.querySelector("#personalized-container");
    if (!container) return;
    const maxIndex = this.getMaxIndex();
    const metrics = this.getCarouselMetrics();
    this.currentIndex = Math.max(0, Math.min(this.currentIndex, maxIndex));
    const translateX =
      this.currentIndex === maxIndex && metrics.totalCols > metrics.colsPerView
        ? metrics.totalWidth - metrics.viewportWidth
        : this.currentIndex * metrics.colWidth;
    container.style.transform = `translateX(-${translateX}px)`;
    this.updateNavigation();
    this.updateScrollbar();
  },

  updateScrollbar() {
    const track = document.querySelector("#personalized-scrollbar-track");
    const thumb = document.querySelector("#personalized-scrollbar-thumb");
    if (!track || !thumb || !this.playlists.length) {
      track?.classList.add("hidden");
      return;
    }
    const metrics = this.getCarouselMetrics();
    const maxIndex = this.getMaxIndex();
    if (metrics.totalCols <= metrics.colsPerView) {
      track.classList.add("hidden");
      return;
    }
    track.classList.remove("hidden");
    const visibleRatio = metrics.colsPerView / metrics.totalCols;
    const thumbWidth = Math.max(visibleRatio * 100, 10);
    const progress = maxIndex > 0 ? this.currentIndex / maxIndex : 0;
    thumb.style.width = `${thumbWidth}%`;
    thumb.style.left = `${progress * (100 - thumbWidth)}%`;
  },

  scrollToPosition(percent) {
    const maxIndex = this.getMaxIndex();
    this.currentIndex = Math.round(percent * maxIndex);
    this.currentIndex = Math.max(0, Math.min(this.currentIndex, maxIndex));
    this.updateSlide();
  },

  setupEventListeners() {
    const prev = document.querySelector("#personalized-prev");
    const next = document.querySelector("#personalized-next");
    const track = document.querySelector("#personalized-scrollbar-track");
    const thumb = document.querySelector("#personalized-scrollbar-thumb");
    
    prev?.addEventListener("click", () => this.slide("prev"));
    next?.addEventListener("click", () => this.slide("next"));
    
    track?.addEventListener("click", (e) => {
      const rect = track.getBoundingClientRect();
      this.scrollToPosition((e.clientX - rect.left) / rect.width);
    });

    let startX = 0,
      startLeft = 0;
    thumb?.addEventListener("mousedown", (e) => {
      this.isDragging = true;
      startX = e.clientX;
      startLeft = thumb.offsetLeft;
      e.preventDefault();
    });

    document.addEventListener("mousemove", (e) => {
      if (!this.isDragging) return;
      const rect = track.getBoundingClientRect();
      const thumbWidth = thumb.offsetWidth;
      const maxLeft = rect.width - thumbWidth;
      const newLeft = Math.max(
        0,
        Math.min(startLeft + e.clientX - startX, maxLeft)
      );
      const percent = newLeft / maxLeft;
      this.scrollToPosition(percent);
    });

    document.addEventListener("mouseup", () => {
      this.isDragging = false;
    });

    let resizeTimeout;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => this.updateSlide(), 150);
    });
  },

  init(options = {}) {
    this.hideInternalLoading = options.hideLoading === true;
    this.setupEventListeners();
    window.refreshPersonalizedSection = () => this.refresh();
    return this.fetchPlaylists();
  },
};