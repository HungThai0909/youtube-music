export const LineAlbumSection = {
  currentIndex: 0,
  albums: [],
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
          <h2 class="text-5xl font-bold text-white">Đĩa nhạc</h2>
          <div class="flex gap-3">
            <button id="line-albums-prev"
              class="w-9 h-9 rounded-full bg-gray-800 hover:bg-gray-700
                     text-gray-400 hover:text-white flex items-center justify-center cursor-pointer">
              <i class="fas fa-chevron-left"></i>
            </button>
            <button id="line-albums-next"
              class="w-9 h-9 rounded-full bg-gray-800 hover:bg-gray-700
                     text-gray-400 hover:text-white flex items-center justify-center cursor-pointer">
              <i class="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>
        <div class="relative overflow-hidden" id="line-albums-viewport">
          <div id="line-albums-container"
            class="flex gap-6 transition-transform duration-500 ease-in-out">
            ${Array(5)
              .fill("")
              .map(
                () => `
              <div class="flex-shrink-0 w-56 opacity-0">
                <div class="w-full aspect-square rounded-lg bg-gray-800"></div>
                <div class="mt-3 h-6 bg-gray-800 rounded w-3/4"></div>
                <div class="mt-2 h-4 bg-gray-800 rounded w-1/2"></div>
              </div>`
              )
              .join("")}
          </div>
        </div>
        <div class="h-5 mt-4">
          <div id="line-albums-scrollbar-track"
            class="h-1 bg-white/10 rounded-full relative cursor-pointer hidden">
            <div id="line-albums-scrollbar-thumb"
              class="absolute top-1/2 -translate-y-1/2 h-1 bg-white/40 rounded-full
                     transition-all duration-300 cursor-pointer w-1/5 left-0">
            </div>
          </div>
        </div>
        <div id="line-albums-loading"
          class="hidden text-white py-10 text-center">
          <i class="fas fa-spinner fa-spin text-3xl"></i>
        </div>
        <div id="line-albums-error"
          class="hidden text-center text-white py-8">
          Không thể tải dữ liệu
        </div>
      </section>
    `;
  },

  hideScrollbar() {
    document
      .querySelector("#line-albums-scrollbar-track")
      ?.classList.add("hidden");
  },

  showScrollbar() {
    document
      .querySelector("#line-albums-scrollbar-track")
      ?.classList.remove("hidden");
  },

  getCarouselMetrics() {
    const viewport = document.querySelector("#line-albums-viewport");
    const container = document.querySelector("#line-albums-container");
    const firstCard = container?.querySelector(".w-56");
    if (!viewport || !container) {
      return {
        cardWidth: 240,
        itemsPerView: 5,
        viewportWidth: 1200,
        totalWidth: 0,
      };
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
      const res = await fetch(
        `${import.meta.env.VITE_BASE_URL}/lines/${this.lineSlug}/albums`
      );
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
    document.querySelector("#line-albums-loading")?.classList.add("hidden");
  },

  showError() {
    document.querySelector("#line-albums-loading")?.classList.add("hidden");
    document.querySelector("#line-albums-error")?.classList.remove("hidden");
  },

  hideError() {
    document.querySelector("#line-albums-error")?.classList.add("hidden");
  },

  renderAlbums() {
    return new Promise((resolve) => {
      const container = document.querySelector("#line-albums-container");
      if (!container) {
        console.error("Line albums container not found");
        return resolve();
      }
      container.innerHTML = "";
      if (this.albums.length === 0) return resolve();
      console.log("Rendering line albums:", this.albums.length);
      console.log("Router available:", !!this.router);
      let loadedImages = 0;
      const checkAllLoaded = () => {
        loadedImages++;
        if (loadedImages === this.albums.length) resolve();
      };
      this.albums.forEach((album) => {
        const card = document.createElement("div");
        card.className = "flex-shrink-0 w-56 cursor-pointer";
        card.innerHTML = `
          <div class="group">
            <div class="relative">
              <img src="${album.thumb || album.thumbnails?.[0] || ""}"
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
              ${album.name || album.title}
            </h3>
            <p class="text-gray-400 text-sm">
              ${album.albumType || "Album"}
            </p>
          </div>
        `;
        card.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log("Line album card clicked:", album.name || album.title);
          this.navigateToAlbum(album);
        });
        const img = card.querySelector("img");
        if (img) img.onload = img.onerror = checkAllLoaded;
        container.appendChild(card);
      });
      if (this.albums.every((a) => !a.thumb && !a.thumbnails?.[0])) resolve();
    });
  },

  navigateToAlbum(album) {
    console.log("navigateToAlbum called with:", album);
    console.log("Router:", this.router);
    const slug = album.slug || album.id || album._id;
    if (!slug) {
      console.error("No slug found for album:", album);
      return;
    }
    if (!this.router) {
      console.error(
        "Router not initialized! Please call LineAlbumSection.setRouter(router) first"
      );
      return;
    }
    const url = `/album/details/${slug}`;
    console.log("Navigating to:", url);
    try {
      this.router.navigate(url);
      console.log("Navigation completed");
    } catch (error) {
      console.error("Navigation error:", error);
    }
  },

  updateNavigation() {
    const maxIndex = this.getMaxIndex();
    const prevBtn = document.querySelector("#line-albums-prev");
    const nextBtn = document.querySelector("#line-albums-next");
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
    const container = document.querySelector("#line-albums-container");
    if (!container) return;
    const maxIndex = this.getMaxIndex();
    const metrics = this.getCarouselMetrics();
    this.currentIndex = Math.max(0, Math.min(this.currentIndex, maxIndex));
    const translateX =
      this.currentIndex === maxIndex &&
      this.albums.length > metrics.itemsPerView
        ? metrics.totalWidth - metrics.viewportWidth
        : this.currentIndex * metrics.cardWidth;
    container.style.transform = `translateX(-${translateX}px)`;
    this.updateNavigation();
    this.updateScrollbar();
  },

  updateScrollbar() {
    const track = document.querySelector("#line-albums-scrollbar-track");
    const thumb = document.querySelector("#line-albums-scrollbar-thumb");
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
    const prev = document.querySelector("#line-albums-prev");
    const next = document.querySelector("#line-albums-next");
    const track = document.querySelector("#line-albums-scrollbar-track");
    const thumb = document.querySelector("#line-albums-scrollbar-thumb");

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
    if (!this.router) {
      console.warn(
        "LineAlbumSection: Router not set yet. Call LineAlbumSection.setRouter(router) first!"
      );
    }
    this.setupEventListeners();
    return this.fetchAlbums();
  },
};
