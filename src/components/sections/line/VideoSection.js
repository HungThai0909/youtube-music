export const LineVideoSection = {
  currentIndex: 0,
  videos: [],
  isDragging: false,
  router: null,
  lineSlug: null,
  hideInternalLoading: false,
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
          <h2 class="text-5xl font-bold text-white">Video nhạc</h2>
          <div class="flex gap-3">
            <button id="line-videos-prev"
              class="w-9 h-9 rounded-full bg-gray-800 hover:bg-gray-700
                     text-gray-400 hover:text-white flex items-center justify-center cursor-pointer">
              <i class="fas fa-chevron-left"></i>
            </button>
            <button id="line-videos-next"
              class="w-9 h-9 rounded-full bg-gray-800 hover:bg-gray-700
                     text-gray-400 hover:text-white flex items-center justify-center cursor-pointer">
              <i class="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>
        <div class="relative overflow-hidden" id="line-videos-viewport">
          <div id="line-videos-container"
            class="flex gap-6 transition-transform duration-500 ease-in-out">
            ${Array(5).fill('').map(() => `
              <div class="flex-shrink-0 w-80 opacity-0">
                <div class="w-full aspect-video rounded-xl bg-gray-800"></div>
                <div class="mt-3 h-6 bg-gray-800 rounded w-3/4"></div>
                <div class="mt-2 h-4 bg-gray-800 rounded w-1/2"></div>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="h-5 mt-4">
          <div id="line-videos-scrollbar-track"
            class="h-1 bg-white/10 rounded-full relative cursor-pointer hidden">
            <div id="line-videos-scrollbar-thumb"
              class="absolute top-1/2 -translate-y-1/2
                     h-1 bg-white/40 rounded-full
                     transition-all duration-300 cursor-pointer w-1/5 left-0">
            </div>
          </div>
        </div>
        <div id="line-videos-loading"
          class="hidden text-white py-10 text-center">
          <i class="fas fa-spinner fa-spin text-3xl"></i>
        </div>
        <div id="line-videos-error"
          class="hidden text-center text-white py-8">
          Không thể tải dữ liệu
        </div>
      </section>
    `;
  },

  hideScrollbar() {
    document.querySelector("#line-videos-scrollbar-track")?.classList.add("hidden");
  },

  showScrollbar() {
    document.querySelector("#line-videos-scrollbar-track")?.classList.remove("hidden");
  },

  getCarouselMetrics() {
    const viewport = document.querySelector("#line-videos-viewport");
    const container = document.querySelector("#line-videos-container");
    const firstCard = container?.querySelector(".w-80");
    if (!viewport || !container) {
      return { cardWidth: 320, itemsPerView: 5, viewportWidth: 1600, totalWidth: 0 };
    }
    const viewportWidth = viewport.offsetWidth;
    const gap = parseFloat(getComputedStyle(container).gap) || 24;
    const cardWidth = firstCard ? firstCard.offsetWidth : 320;
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
    return Math.max(0, this.videos.length - metrics.itemsPerView);
  },

  async fetchVideos() {
    try {
      const res = await fetch(`${import.meta.env.VITE_BASE_URL}/lines/${this.lineSlug}/videos`);
      if (!res.ok) throw new Error("Fetch error");
      const data = await res.json();
      this.videos = data?.items ?? [];
      if (!this.videos.length) {
        throw new Error("Empty data");
      }
      this.hideError();
      await this.renderVideos();
      requestAnimationFrame(() => {
        this.updateNavigation();
        this.updateScrollbar();
        if (this.hideInternalLoading) {
          this.hideInternalLoading = false;
          const metrics = this.getCarouselMetrics();
          if (this.videos.length > metrics.itemsPerView) {
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
    document.querySelector("#line-videos-loading")?.classList.add("hidden");
  },

  showError() {
    document.querySelector("#line-videos-loading")?.classList.add("hidden");
    document.querySelector("#line-videos-error")?.classList.remove("hidden");
  },

  hideError() {
    document.querySelector("#line-videos-error")?.classList.add("hidden");
  },

  renderVideos() {
    return new Promise((resolve) => {
      const container = document.querySelector("#line-videos-container");
      if (!container) return resolve();
      container.innerHTML = "";
      if (this.videos.length === 0) return resolve();
      let loadedImages = 0;
      const checkAllLoaded = () => {
        loadedImages++;
        if (loadedImages === this.videos.length) resolve();
      };
      this.videos.forEach((video) => {
        const card = document.createElement("div");
        card.className = "flex-shrink-0 w-80 cursor-pointer";
        card.innerHTML = `
          <div class="group">
            <div class="relative">
              <img src="${video.thumb || video.thumbnails?.[0] || ''}"
                   class="w-full aspect-video rounded-xl object-cover transition"/>
              <div class="absolute inset-0 flex items-center justify-center
                          opacity-0 group-hover:opacity-100
                          bg-black/40 transition rounded-xl">
                <div class="w-12 h-12 bg-white rounded-full
                            flex items-center justify-center">
                  <i class="fas fa-play text-gray-900 ml-0.5"></i>
                </div>
              </div>
            </div>
            <h3 class="mt-3 text-white font-semibold line-clamp-2">
              ${video.name || video.title}
            </h3>
            <p class="text-gray-400 text-sm">
              ${video.views ? video.views.toLocaleString() + " lượt xem" : "Video"}
            </p>
          </div>
        `;
        card.addEventListener("click", () => {
          this.navigateToVideo(video);
        });
        const img = card.querySelector("img");
        if (img) img.onload = img.onerror = checkAllLoaded;
        container.appendChild(card);
      });
      if (this.videos.every((v) => !v.thumb && !v.thumbnails?.[0])) resolve();
    });
  },

  navigateToVideo(video) {
    const slug = video.slug || video.id || video._id;
    if (!slug || !this.router) return;
    this.router.navigate(`/video/details/${slug}`);
  },

  updateNavigation() {
    const maxIndex = this.getMaxIndex();
    const prevBtn = document.querySelector("#line-videos-prev");
    const nextBtn = document.querySelector("#line-videos-next");
    if (!prevBtn || !nextBtn) return;
    const isAtStart = this.currentIndex === 0;
    const isAtEnd = this.currentIndex >= maxIndex;
    prevBtn.disabled = isAtStart;
    prevBtn.style.opacity = isAtStart ? "0.5" : "1";
    prevBtn.style.pointerEvents = isAtStart ? "none" : "auto";
    nextBtn.disabled = isAtEnd;
    nextBtn.style.opacity = isAtEnd ? "0.5" : "1";
    nextBtn.style.pointerEvents = isAtEnd ? "none" : "auto";
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
    const container = document.querySelector("#line-videos-container");
    if (!container) return;
    const maxIndex = this.getMaxIndex();
    const metrics = this.getCarouselMetrics();
    this.currentIndex = Math.max(0, Math.min(this.currentIndex, maxIndex));
    const translateX = this.currentIndex === maxIndex && this.videos.length > metrics.itemsPerView
      ? metrics.totalWidth - metrics.viewportWidth
      : this.currentIndex * metrics.cardWidth;
    container.style.transform = `translateX(-${translateX}px)`;
    this.updateNavigation();
    this.updateScrollbar();
  },

  updateScrollbar() {
    const track = document.querySelector("#line-videos-scrollbar-track");
    const thumb = document.querySelector("#line-videos-scrollbar-thumb");
    if (!track || !thumb || !this.videos.length) {
      this.hideScrollbar();
      return;
    }
    const metrics = this.getCarouselMetrics();
    const maxIndex = this.getMaxIndex();
    if (this.videos.length <= metrics.itemsPerView) {
      this.hideScrollbar();
      return;
    }
    this.showScrollbar();
    const visibleRatio = metrics.itemsPerView / this.videos.length;
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
    const prev = document.querySelector("#line-videos-prev");
    const next = document.querySelector("#line-videos-next");
    const track = document.querySelector("#line-videos-scrollbar-track");
    const thumb = document.querySelector("#line-videos-scrollbar-thumb");
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
    return this.fetchVideos();
  },
};