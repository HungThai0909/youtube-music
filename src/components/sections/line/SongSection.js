export const LineSongSection = {
  currentIndex: 0,
  songs: [],
  isDragging: false,
  router: null,
  lineSlug: null,
  setRouter(routerInstance) {
    this.router = routerInstance;
  },
  setLineSlug(slug) {
    this.lineSlug = slug;
  },
  render() {
    return `
      <section class="mb-12">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-5xl font-bold text-white">Bài hát</h2>
          <div class="flex gap-3">
            <button id="line-songs-prev"
              class="w-9 h-9 rounded-full bg-gray-800 hover:bg-gray-700
                     text-gray-400 hover:text-white flex items-center justify-center cursor-pointer">
              <i class="fas fa-chevron-left"></i>
            </button>
            <button id="line-songs-next"
              class="w-9 h-9 rounded-full bg-gray-800 hover:bg-gray-700
                     text-gray-400 hover:text-white flex items-center justify-center cursor-pointer">
              <i class="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>
        <div class="relative overflow-hidden" id="line-songs-viewport">
          <div id="line-songs-container"
            class="grid grid-rows-4 gap-4 transition-transform duration-500 ease-in-out"
            style="grid-auto-flow: column; grid-auto-columns: minmax(400px, 1fr);">
            ${Array(12)
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
        </div>
        <div class="h-5 mt-4">
          <div id="line-songs-scrollbar-track"
            class="h-1 bg-white/10 rounded-full relative cursor-pointer hidden">
            <div id="line-songs-scrollbar-thumb"
              class="absolute top-1/2 -translate-y-1/2 h-1 bg-white/40 rounded-full
                     transition-all duration-300 cursor-pointer w-1/5 left-0">
            </div>
          </div>
        </div>
      </section>
    `;
  },

  getCarouselMetrics() {
    const viewport = document.querySelector("#line-songs-viewport");
    const container = document.querySelector("#line-songs-container");
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
    const totalCols = Math.ceil(this.songs.length / 4); 
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
  formatViews(views) {
    if (!views) return "0 N lượt xem";
    if (views >= 1000000000)
      return `${(views / 1000000000).toFixed(1)} B lượt xem`;
    if (views >= 1000000)
      return `${(views / 1000000).toFixed(1)} M lượt xem`;
    if (views >= 1000) 
      return `${(views / 1000).toFixed(1)} N lượt xem`;
    return `${views} lượt xem`;
  },

  async fetchSongs() {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BASE_URL}/lines/${this.lineSlug}/songs`
      );
      if (!res.ok) throw new Error("Fetch error");
      const data = await res.json();
      this.songs = data?.items ?? [];
      await this.renderSongs();
      requestAnimationFrame(() => {
        this.updateNavigation();
        this.updateScrollbar();
      });
      return true;
    } catch (err) {
      console.error("Error fetching line songs:", err);
      return false;
    }
  },

  renderSongs() {
    return new Promise((resolve) => {
      const container = document.querySelector("#line-songs-container");
      if (!container) return resolve();
      container.innerHTML = "";
      if (this.songs.length === 0) return resolve();

      let loadedImages = 0;
      const checkAllLoaded = () => {
        loadedImages++;
        if (loadedImages === this.songs.length) resolve();
      };
      this.songs.forEach((song) => {
        const card = document.createElement("div");
        card.className = "cursor-pointer";
        card.dataset.songId = song.id;
        card.innerHTML = `
          <div class="group">
            <div class="flex items-center gap-4 p-3 hover:bg-gray-700
                        rounded-lg transition cursor-pointer">
              <div class="relative flex-shrink-0 cursor-pointer">
                <img src="${song.thumb || song.thumbnails?.[0] || ""}"
                     alt="${song.name || song.title}"
                     class="w-16 h-16 rounded object-cover cursor-pointer"/>
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
                  ${song.name || song.title}
                </h3>
                <p class="text-gray-400 text-sm truncate">
                  ${this.formatViews(song.views)}${song.albumName ? ` &bull; ${song.albumName}` : ''}
                </p>
              </div>
            </div>
          </div>`;
        
        const img = card.querySelector("img");
        if (img) img.onload = img.onerror = checkAllLoaded;
        
        card.addEventListener('click', (e) => {
          e.preventDefault();
          if (this.router && song.id) {
            this.router.navigate(`/song/details/${song.id}`);
          }
        });
        
        container.appendChild(card);
      });

      if (this.songs.every((s) => !s.thumb && !s.thumbnails?.[0])) resolve();
    });
  },

  updateNavigation() {
    const maxIndex = this.getMaxIndex();
    const prevBtn = document.querySelector("#line-songs-prev");
    const nextBtn = document.querySelector("#line-songs-next");
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
    const container = document.querySelector("#line-songs-container");
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
    const track = document.querySelector("#line-songs-scrollbar-track");
    const thumb = document.querySelector("#line-songs-scrollbar-thumb");
    if (!track || !thumb || !this.songs.length) {
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
    const prev = document.querySelector("#line-songs-prev");
    const next = document.querySelector("#line-songs-next");
    const track = document.querySelector("#line-songs-scrollbar-track");
    const thumb = document.querySelector("#line-songs-scrollbar-thumb");
    
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

  init() {
    this.setupEventListeners();
    return this.fetchSongs();
  },
};