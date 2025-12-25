export const MetaSection = {
  API_URL: `${import.meta.env.VITE_BASE_URL}/explore/meta`,
  ITEMS_PER_COLUMN: 4,
  currentIndex: 0,
  columns: [],
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
            Tâm trạng và thể loại
          </h2>
          <div class="flex gap-3">
            <button id="meta-prev"
              class="w-9 h-9 rounded-full bg-gray-800 hover:bg-gray-700
                     text-gray-400 hover:text-white flex items-center justify-center cursor-pointer">
              <i class="fas fa-chevron-left"></i>
            </button>
            <button id="meta-next"
              class="w-9 h-9 rounded-full bg-gray-800 hover:bg-gray-700
                     text-gray-400 hover:text-white flex items-center justify-center cursor-pointer">
              <i class="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>
        <div class="relative overflow-hidden" id="meta-viewport">
          <div id="meta-container"
            class="flex gap-6 transition-transform duration-500 ease-in-out">
            ${Array(5)
              .fill("")
              .map(
                () => `
              <div class="flex-shrink-0 w-[280px] space-y-3 opacity-0">
                ${Array(4)
                  .fill("")
                  .map(
                    () => `
                  <div class="h-[72px] bg-gray-800 rounded-xl"></div>
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
          <div id="meta-scrollbar-track"
            class="h-1 bg-white/10 rounded-full relative cursor-pointer hidden">
            <div id="meta-scrollbar-thumb"
              class="absolute top-1/2 -translate-y-1/2
                     h-1 bg-white/40 rounded-full
                     transition-all duration-300 cursor-pointer w-1/5 left-0">
            </div>
          </div>
        </div>
        <div id="meta-loading"
          class="hidden text-white py-10 text-center">
          <i class="fas fa-spinner fa-spin text-3xl"></i>
        </div>
        <div id="meta-error"
          class="hidden text-center text-white py-8">
          Không thể tải dữ liệu
        </div>
      </section>
    `;
  },

  hideScrollbar() {
    document.querySelector("#meta-scrollbar-track")?.classList.add("hidden");
  },

  showScrollbar() {
    document.querySelector("#meta-scrollbar-track")?.classList.remove("hidden");
  },

  getCarouselMetrics() {
    const viewport = document.querySelector("#meta-viewport");
    const container = document.querySelector("#meta-container");
    const firstColumn = container?.querySelector(".flex-shrink-0");
    if (!viewport || !container) {
      return {
        columnWidth: 280,
        itemsPerView: 5,
        viewportWidth: 1400,
        totalWidth: 0,
      };
    }
    const viewportWidth = viewport.offsetWidth;
    const gap = parseFloat(getComputedStyle(container).gap) || 24;
    const columnWidth = firstColumn ? firstColumn.offsetWidth : 280;
    const columnWithGap = columnWidth + gap;
    const itemsPerView = Math.floor(viewportWidth / columnWithGap);
    return {
      columnWidth: columnWithGap,
      itemsPerView,
      viewportWidth,
      totalWidth: container.scrollWidth,
    };
  },

  getMaxIndex() {
    const metrics = this.getCarouselMetrics();
    return Math.max(0, this.columns.length - metrics.itemsPerView);
  },

  async fetchMeta() {
    try {
      const res = await fetch(this.API_URL);
      if (!res.ok) throw new Error("Fetch error");
      const data = await res.json();
      const categories = (data.categories ?? []).map((c) => ({
        ...c,
        metaType: "category",
      }));
      const lines = (data.lines ?? []).map((l) => ({ ...l, metaType: "line" }));
      const metas = [...categories, ...lines];
      this.columns = this.chunk(metas, this.ITEMS_PER_COLUMN);
      this.hideError();
      this.renderColumns();
      requestAnimationFrame(() => {
        this.updateNavigation();
        this.updateScrollbar();
        if (this.hideInternalLoading) {
          this.hideInternalLoading = false;
          const metrics = this.getCarouselMetrics();
          if (this.columns.length > metrics.itemsPerView) {
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

  chunk(arr, size) {
    const result = [];
    for (let i = 0; i < arr.length; i += size) {
      result.push(arr.slice(i, i + size));
    }
    return result;
  },

  renderColumns() {
    const container = document.querySelector("#meta-container");
    if (!container) return;
    container.innerHTML = "";
    this.columns.forEach((column) => {
      const colEl = document.createElement("div");
      colEl.className = "flex-shrink-0 w-[280px] space-y-3";
      column.forEach((item) => {
        const card = document.createElement("div");
        card.className =
          "flex items-center gap-4 px-4 py-4 bg-[#2a2a2a] rounded-xl hover:bg-[#333] cursor-pointer transition";
        card.innerHTML = `
          <div class="w-1 h-10 rounded-full"
               style="background:${item.color || "#3b82f6"}"></div>
          <span class="text-white font-semibold truncate">
            ${item.name}
          </span>
        `;
        card.onclick = () => this.navigateToMeta(item);
        colEl.appendChild(card);
      });
      container.appendChild(colEl);
    });
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
    const container = document.querySelector("#meta-container");
    if (!container) return;
    const maxIndex = this.getMaxIndex();
    const metrics = this.getCarouselMetrics();
    this.currentIndex = Math.max(0, Math.min(this.currentIndex, maxIndex));
    const translateX =
      this.currentIndex === maxIndex &&
      this.columns.length > metrics.itemsPerView
        ? metrics.totalWidth - metrics.viewportWidth
        : this.currentIndex * metrics.columnWidth;
    container.style.transform = `translateX(-${translateX}px)`;
    this.updateNavigation();
    this.updateScrollbar();
  },

  updateNavigation() {
    const maxIndex = this.getMaxIndex();
    const prevBtn = document.querySelector("#meta-prev");
    const nextBtn = document.querySelector("#meta-next");
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

  updateScrollbar() {
    const track = document.querySelector("#meta-scrollbar-track");
    const thumb = document.querySelector("#meta-scrollbar-thumb");
    if (!track || !thumb || !this.columns.length) {
      this.hideScrollbar();
      return;
    }
    const metrics = this.getCarouselMetrics();
    const maxIndex = this.getMaxIndex();
    if (this.columns.length <= metrics.itemsPerView) {
      this.hideScrollbar();
      return;
    }
    this.showScrollbar();
    const visibleRatio = metrics.itemsPerView / this.columns.length;
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
    const prev = document.querySelector("#meta-prev");
    const next = document.querySelector("#meta-next");
    const track = document.querySelector("#meta-scrollbar-track");
    const thumb = document.querySelector("#meta-scrollbar-thumb");
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
    this.setupEventListeners();
    return this.fetchMeta();
  },

  hideLoading() {
    document.querySelector("#meta-loading")?.classList.add("hidden");
  },

  showError() {
    document.querySelector("#meta-loading")?.classList.add("hidden");
    document.querySelector("#meta-error")?.classList.remove("hidden");
  },

  hideError() {
    document.querySelector("#meta-error")?.classList.add("hidden");
  },

  navigateToMeta(item) {
    if (!this.router) {
      console.error("Router not initialized!");
      return;
    }

    const type = item?.metaType || item?.type || "category";
    if (type === "line") {
      this.router.navigate(`/line/${item.slug}`);
    } else {
      this.router.navigate(`/category/${item.slug}`);
    }
  },
};
