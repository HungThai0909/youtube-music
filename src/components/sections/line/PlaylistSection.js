export const LinePlaylistSection = {
  currentIndex: 0,
  playlists: [],
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
          <h2 class="text-5xl font-bold text-white">Danh sách phát nổi bật</h2>
          <div class="flex gap-3">
            <button id="line-playlists-prev"
              class="w-9 h-9 rounded-full bg-gray-800 hover:bg-gray-700
                     text-gray-400 hover:text-white flex items-center justify-center cursor-pointer">
              <i class="fas fa-chevron-left"></i>
            </button>
            <button id="line-playlists-next"
              class="w-9 h-9 rounded-full bg-gray-800 hover:bg-gray-700
                     text-gray-400 hover:text-white flex items-center justify-center cursor-pointer">
              <i class="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>
        <div class="relative overflow-hidden" id="line-playlists-viewport">
          <div id="line-playlists-container"
            class="flex gap-6 transition-transform duration-500 ease-in-out">
            ${Array(5).fill('').map(() => `
              <div class="flex-shrink-0 w-56 opacity-0">
                <div class="w-full aspect-square rounded-lg bg-gray-800"></div>
                <div class="mt-3 h-6 bg-gray-800 rounded w-3/4"></div>
                <div class="mt-2 h-4 bg-gray-800 rounded w-1/2"></div>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="h-5 mt-4">
          <div id="line-playlists-scrollbar-track"
            class="h-1 bg-white/10 rounded-full relative cursor-pointer hidden">
            <div id="line-playlists-scrollbar-thumb"
              class="absolute top-1/2 -translate-y-1/2 h-1 bg-white/40 rounded-full
                     transition-all duration-300 cursor-pointer w-1/5 left-0">
            </div>
          </div>
        </div>
      </section>
    `;
  },

  getCarouselMetrics() {
    const viewport = document.querySelector("#line-playlists-viewport");
    const container = document.querySelector("#line-playlists-container");
    const firstCard = container?.querySelector(".w-56");
    if (!viewport || !container) {
      return { cardWidth: 240, itemsPerView: 5, viewportWidth: 1200, totalWidth: 0 };
    }
    const viewportWidth = viewport.offsetWidth;
    const gap = parseFloat(getComputedStyle(container).gap) || 24;
    const cardWidth = firstCard ? firstCard.offsetWidth : 224;
    const cardWithGap = cardWidth + gap;
    const itemsPerView = Math.floor(viewportWidth / cardWithGap);
    return {
      cardWidth: cardWithGap,
      itemsPerView,
      viewportWidth,
      totalWidth: container.scrollWidth,
    };
  },

  getMaxIndex() {
    const metrics = this.getCarouselMetrics();
    return Math.max(0, this.playlists.length - metrics.itemsPerView);
  },

  async fetchPlaylists() {
    try {
      const res = await fetch(`${import.meta.env.VITE_BASE_URL}/lines/${this.lineSlug}/playlists`);
      if (!res.ok) throw new Error("Fetch error");
      const data = await res.json();
      this.playlists = data?.items ?? [];
      await this.renderPlaylists();
      requestAnimationFrame(() => {
        this.updateNavigation();
        this.updateScrollbar();
      });
      return true;
    } catch (err) {
      console.error("Error fetching line playlists:", err);
      return false;
    }
  },

  renderPlaylists() {
    return new Promise((resolve) => {
      const container = document.querySelector("#line-playlists-container");
      if (!container) return resolve();
      container.innerHTML = "";
      if (this.playlists.length === 0) return resolve();
      let loadedImages = 0;
      const checkAllLoaded = () => {
        loadedImages++;
        if (loadedImages === this.playlists.length) resolve();
      };
      this.playlists.forEach((playlist) => {
        const card = document.createElement("div");
        card.className = "flex-shrink-0 w-56 cursor-pointer";
        card.innerHTML = `
          <div class="group">
            <div class="relative">
              <img src="${playlist.thumb || playlist.thumbnails?.[0] || ''}"
                   class="w-full aspect-square rounded-lg object-cover"/>
              <div class="absolute inset-0 bg-black/40 opacity-0
                          group-hover:opacity-100 transition
                          flex items-center justify-center rounded-lg">
                <div class="w-12 h-12 bg-white rounded-full
                            flex items-center justify-center">
                  <i class="fas fa-play text-gray-900 ml-0.5"></i>
                </div>
              </div>
            </div>
            <h3 class="mt-3 text-white font-semibold truncate">
              ${playlist.name || playlist.title}
            </h3>
            <p class="text-gray-400 text-sm truncate">
              ${(playlist.artists || []).join(", ") || "Playlist"}
            </p>
          </div>
        `;
        card.addEventListener("click", () => this.navigateToPlaylist(playlist));
        const img = card.querySelector("img");
        if (img) img.onload = img.onerror = checkAllLoaded;
        container.appendChild(card);
      });

      if (this.playlists.every((p) => !p.thumb && !p.thumbnails?.[0])) resolve();
    });
  },

  navigateToPlaylist(playlist) {
    const slug = playlist.slug || playlist.id || playlist._id;
    if (!slug || !this.router) return;
    this.router.navigate(`/playlist/details/${slug}`);
  },

  updateNavigation() {
    const maxIndex = this.getMaxIndex();
    const prevBtn = document.querySelector("#line-playlists-prev");
    const nextBtn = document.querySelector("#line-playlists-next");
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
    const container = document.querySelector("#line-playlists-container");
    if (!container) return;
    const maxIndex = this.getMaxIndex();
    const metrics = this.getCarouselMetrics();
    this.currentIndex = Math.max(0, Math.min(this.currentIndex, maxIndex));
    const translateX = this.currentIndex === maxIndex && this.playlists.length > metrics.itemsPerView
      ? metrics.totalWidth - metrics.viewportWidth
      : this.currentIndex * metrics.cardWidth;
    container.style.transform = `translateX(-${translateX}px)`;
    this.updateNavigation();
    this.updateScrollbar();
  },

  updateScrollbar() {
    const track = document.querySelector("#line-playlists-scrollbar-track");
    const thumb = document.querySelector("#line-playlists-scrollbar-thumb");
    if (!track || !thumb || !this.playlists.length) {
      track?.classList.add("hidden");
      return;
    }
    const metrics = this.getCarouselMetrics();
    const maxIndex = this.getMaxIndex();
    if (this.playlists.length <= metrics.itemsPerView) {
      track.classList.add("hidden");
      return;
    }
    track.classList.remove("hidden");
    const visibleRatio = metrics.itemsPerView / this.playlists.length;
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
    const prev = document.querySelector("#line-playlists-prev");
    const next = document.querySelector("#line-playlists-next");
    const track = document.querySelector("#line-playlists-scrollbar-track");
    const thumb = document.querySelector("#line-playlists-scrollbar-thumb");
    
    prev?.addEventListener("click", () => this.slide("prev"));
    next?.addEventListener("click", () => this.slide("next"));
    
    track?.addEventListener("click", (e) => {
      const rect = track.getBoundingClientRect();
      this.scrollToPosition((e.clientX - rect.left) / rect.width);
    });
    
    let startX = 0, startLeft = 0;
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
      const newLeft = Math.max(0, Math.min(startLeft + e.clientX - startX, maxLeft));
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
    return this.fetchPlaylists();
  },
};