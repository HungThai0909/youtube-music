export const AlbumSection = {
  API_URL: `${import.meta.env.VITE_BASE_URL}/home/albums-for-you`,
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
      <section class="mb-10"> 
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-5xl font-bold text-white">Album gợi ý cho bạn</h2>
          <div class="flex gap-4">
            <button id="albums-prev"
              class="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700
                     text-gray-400 hover:text-white transition-all duration-300
                     flex items-center justify-center cursor-pointer">
              <i class="fas fa-chevron-left"></i>
            </button>
            <button id="albums-next"
              class="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700
                     text-gray-400 hover:text-white transition-all duration-300
                     flex items-center justify-center cursor-pointer">
              <i class="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>
        <div class="relative overflow-hidden" id="albums-viewport"> 
          <div id="albums-container" class="flex gap-4 transition-transform duration-500 ease-in-out">
            ${Array(5)
              .fill("")
              .map(
                () => `
              <div class="flex-shrink-0 w-64 opacity-0">
                <div class="w-full aspect-square rounded-lg bg-gray-800"></div>
                <div class="mt-3 h-5 bg-gray-800 rounded w-3/4"></div>
                <div class="mt-2 h-4 bg-gray-800 rounded w-1/2"></div>
              </div>
            `
              )
              .join("")}
          </div>
        </div>
        <div class="h-5 mt-4"> 
          <div id="albums-scrollbar-track"
            class="h-1 bg-gray-700 rounded-full relative cursor-pointer hidden">
            <div id="albums-scrollbar-thumb"
              class="absolute top-1/2 -translate-y-1/2
                     h-1 bg-gray-400 rounded-full
                     transition-all duration-300 cursor-pointer w-1/5 left-0">
            </div>
          </div>
        </div>
        <div id="albums-loading" class="hidden text-white py-8 text-center">
          <i class="fas fa-spinner fa-spin text-3xl"></i>
          <p class="mt-2">Đang tải...</p>
        </div>
        <div id="albums-error"
          class="hidden text-center text-white py-8">
          <i class="fas fa-exclamation-circle text-3xl"></i>
          <p class="mt-2">Không thể tải dữ liệu</p>
        </div>
      </section>
    `;
  },

  hideScrollbar() {
    document.querySelector("#albums-scrollbar-track")?.classList.add("hidden");
  },

  showScrollbar() {
    document
      .querySelector("#albums-scrollbar-track")
      ?.classList.remove("hidden");
  },

  getCarouselMetrics() {
    const viewport = document.querySelector("#albums-viewport");
    const container = document.querySelector("#albums-container");
    const firstCard = container?.querySelector(".w-64");
    if (!viewport || !container) {
      return {
        cardWidth: 272,
        itemsPerView: 5,
        viewportWidth: 1360,
        totalWidth: 0,
      };
    }
    const viewportWidth = viewport.offsetWidth;
    const gap = parseFloat(getComputedStyle(container).gap) || 16;
    const cardWidth = firstCard ? firstCard.offsetWidth : 256;
    return {
      cardWidth: cardWidth + gap,
      itemsPerView: Math.floor(viewportWidth / (cardWidth + gap)),
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
      this.albums = await res.json();
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

  navigateToAlbum(album) {
    const slug = album.slug || album.id || album._id;
    if (slug && this.router) {
      this.router.navigate(`/album/details/${slug}`);
    }
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
        card.className = "flex-shrink-0 w-64";
        card.innerHTML = `
          <div class="group cursor-pointer">
            <div class="relative">
              <img src="${album.thumbnails?.[0] ?? ""}"
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
            <h3 class="mt-3 text-white truncate">${album.title}</h3>
            <p class="text-gray-400 text-sm truncate">
              ${album.artists?.join(", ") ?? ""}
            </p>
          </div>
        `;
        card.onclick = () => this.navigateToAlbum(album);
        const img = card.querySelector("img");
        if (img) img.onload = img.onerror = checkAllLoaded;
        container.appendChild(card);
      });
      if (this.albums.every((a) => !a.thumbnails?.[0])) resolve();
    });
  },

  updateNavigation() {
    const maxIndex = this.getMaxIndex();
    const prev = document.querySelector("#albums-prev");
    const next = document.querySelector("#albums-next");
    if (!prev || !next) return;
    prev.disabled = this.currentIndex === 0;
    next.disabled = this.currentIndex >= maxIndex;
    prev.style.opacity = prev.disabled ? "0.4" : "1";
    next.style.opacity = next.disabled ? "0.4" : "1";
  },

  slide(dir) {
    const maxIndex = this.getMaxIndex();
    if (dir === "next" && this.currentIndex < maxIndex) this.currentIndex++;
    if (dir === "prev" && this.currentIndex > 0) this.currentIndex--;
    this.updateSlide();
  },

  updateSlide() {
    const container = document.querySelector("#albums-container");
    if (!container) return;
    const metrics = this.getCarouselMetrics();
    const maxIndex = this.getMaxIndex();
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
    const progress = maxIndex ? this.currentIndex / maxIndex : 0;
    thumb.style.width = `${thumbWidth}%`;
    thumb.style.left = `${progress * (100 - thumbWidth)}%`;
  },

  scrollToPosition(percent) {
    const maxIndex = this.getMaxIndex();
    this.currentIndex = Math.round(percent * maxIndex);
    this.updateSlide();
  },

  setupEventListeners() {
    document
      .querySelector("#albums-prev")
      ?.addEventListener("click", () => this.slide("prev"));
    document
      .querySelector("#albums-next")
      ?.addEventListener("click", () => this.slide("next"));
    const track = document.querySelector("#albums-scrollbar-track");
    const thumb = document.querySelector("#albums-scrollbar-thumb");
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
    window.addEventListener("resize", () => this.updateSlide());
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
