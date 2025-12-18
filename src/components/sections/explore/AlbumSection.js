export const AlbumSection = {
  API_URL: `${import.meta.env.VITE_BASE_URL}/explore/albums`,
  currentIndex: 0,
  albums: [],
  isDragging: false,
  router: null,
  hideInternalLoading: false,
  setRouter(routerInstance) {
    this.router = routerInstance;
  },
  render() {
    return `
      <section class="mb-12">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-5xl font-bold text-white">
            Khám phá Albums mới
          </h2>
          <div class="flex gap-3">
            <button id="albums-prev"
              class="w-9 h-9 rounded-full bg-gray-800 hover:bg-gray-700
                     text-gray-400 hover:text-white flex items-center justify-center cursor-pointer">
              <i class="fas fa-chevron-left"></i>
            </button>
            <button id="albums-next"
              class="w-9 h-9 rounded-full bg-gray-800 hover:bg-gray-700
                     text-gray-400 hover:text-white flex items-center justify-center cursor-pointer">
              <i class="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>
        <div class="relative overflow-hidden" id="albums-viewport">
          <div id="albums-container"
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
        <div id="albums-scrollbar-track"
          class="mt-4 h-1 bg-white/10 rounded-full relative cursor-pointer hidden">
          <div id="albums-scrollbar-thumb"
            class="absolute top-1/2 -translate-y-1/2 h-1 bg-white/40 rounded-full
                   transition-all duration-300 cursor-pointer w-1/5 left-0">
          </div>
        </div>
        <div id="albums-loading"
          class="hidden text-white py-10 text-center">
          <i class="fas fa-spinner fa-spin text-3xl"></i>
        </div>
        <div id="albums-error"
          class="hidden text-center text-white py-8">
          Không thể tải dữ liệu
        </div>
      </section>
    `;
  },

  hideScrollbar() {
    document.querySelector("#albums-scrollbar-track")?.classList.add("hidden");
  },

  showScrollbar() {
    document.querySelector("#albums-scrollbar-track")?.classList.remove("hidden");
  },

  getCarouselMetrics() {
    const viewport = document.querySelector("#albums-viewport");
    const container = document.querySelector("#albums-container");
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
    return Math.max(0, this.albums.length - metrics.itemsPerView);
  },

  async fetchAlbums() {
    try {
      const res = await fetch(this.API_URL);
      if (!res.ok) throw new Error("Fetch error");
      const data = await res.json();
      this.albums = data?.items ?? [];
      if (!this.albums.length) {
        throw new Error("Empty data");
      }
      this.hideError();
      await this.renderAlbums();
      requestAnimationFrame(() => {
        this.updateNavigation();
        this.updateScrollbar();
        if (this.hideInternalLoading) {
          this.hideInternalLoading = false;
          const metrics = this.getCarouselMetrics();
          if (this.albums.length > metrics.itemsPerView) {
            this.showScrollbar();
          }
        }
      });
      return true;
    } catch (err) {
      console.error(err);
      this.showError();
      return false;
    }
  },

  hideLoading() {
    document.querySelector("#albums-loading")?.classList.add("hidden");
  },

  showError() {
    document.querySelector("#albums-loading")?.classList.add("hidden");
    document.querySelector("#albums-error")?.classList.remove("hidden");
  },

  hideError() {
    document.querySelector("#albums-error")?.classList.add("hidden");
  },

  renderAlbums() {
    return new Promise((resolve) => {
      const container = document.querySelector("#albums-container");
      if (!container) return resolve();
      container.innerHTML = "";
      if (this.albums.length === 0) return resolve();
      let loadedImages = 0;
      const checkAllLoaded = () => {
        loadedImages++;
        if (loadedImages === this.albums.length) resolve();
      };
      this.albums.forEach((album) => {
        const card = document.createElement("div");
        card.className = "flex-shrink-0 w-56 cursor-pointer";
        card.innerHTML = `
          <div class="group cursor-pointer">
            <div class="relative">
                <img src="${album.thumb}"
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
              ${album.name}
            </h3>
            <p class="text-gray-400 text-sm">
              ${album.albumType}
            </p>
          </div>
        `;
        const groupDiv = card.querySelector('.group');
        if (groupDiv) {
          groupDiv.addEventListener("click", () => {
            this.navigateToAlbum(album);
          });
        }
        const img = card.querySelector("img");
        if (img) img.onload = img.onerror = checkAllLoaded;
        container.appendChild(card);
      });
      if (this.albums.every((a) => !a.thumb)) resolve();
    });
  },

  navigateToAlbum(album) {
    const slug = album.slug || album.id;
    if (!slug || !this.router) return;
    this.router.navigate(`/album/details/${slug}`);
  },

  updateNavigation() {
    const maxIndex = this.getMaxIndex();
    const prevBtn = document.querySelector("#albums-prev");
    const nextBtn = document.querySelector("#albums-next");
    if (!prevBtn || !nextBtn) return;
    prevBtn.disabled = this.currentIndex === 0;
    nextBtn.disabled = this.currentIndex >= maxIndex;
    prevBtn.style.opacity = prevBtn.disabled ? "0.5" : "1";
    nextBtn.style.opacity = nextBtn.disabled ? "0.5" : "1";
  },

  slide(dir) {
    const maxIndex = this.getMaxIndex();
    if (dir === "next" && this.currentIndex < maxIndex) {
      this.currentIndex++;
    }
    if (dir === "prev" && this.currentIndex > 0) {
      this.currentIndex--;
    }
    this.updateSlide();
  },

  updateSlide() {
    const container = document.querySelector("#albums-container");
    if (!container) return;
    const maxIndex = this.getMaxIndex();
    const metrics = this.getCarouselMetrics();
    this.currentIndex = Math.max(0, Math.min(this.currentIndex, maxIndex));
    const translateX = this.currentIndex === maxIndex && this.albums.length > metrics.itemsPerView
      ? metrics.totalWidth - metrics.viewportWidth
      : this.currentIndex * metrics.cardWidth;
    container.style.transform = `translateX(-${translateX}px)`;
    this.updateNavigation();
    this.updateScrollbar();
  },

  updateScrollbar() {
    const track = document.querySelector("#albums-scrollbar-track");
    const thumb = document.querySelector("#albums-scrollbar-thumb");
    if (!track || !thumb || !this.albums.length) {
      this.hideScrollbar();
      return;
    }
    const metrics = this.getCarouselMetrics();
    const maxIndex = this.getMaxIndex();
    if (this.albums.length <= metrics.itemsPerView) {
      this.hideScrollbar();
      return;
    }
    this.showScrollbar();
    const visibleRatio = metrics.itemsPerView / this.albums.length;
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
    const prev = document.querySelector("#albums-prev");
    const next = document.querySelector("#albums-next");
    const track = document.querySelector("#albums-scrollbar-track");
    const thumb = document.querySelector("#albums-scrollbar-thumb");
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
      resizeTimeout = setTimeout(() => {
        this.updateSlide();
      }, 150);
    });
  },

  init(options = {}) {
    this.hideInternalLoading = options.hideLoading === true;
    this.hideScrollbar();
    if (this.hideInternalLoading) {
      this.hideLoading();
    }
    this.setupEventListeners();
    return this.fetchAlbums();
  },
};