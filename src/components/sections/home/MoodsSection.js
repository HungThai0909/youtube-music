export const MoodsSection = {
  API_URL: `${import.meta.env.VITE_BASE_URL}/moods`,
  currentIndex: 0,
  moods: [],
  isDragging: false,
  router: null,
  activeMoodSlug: null,
  hideInternalLoading: false,
  setRouter(routerInstance) {
    this.router = routerInstance;
  },
  render() {
    return `
      <section class="mb-10"> 
        <div class="flex justify-end gap-4 mb-6">
          <button id="moods-prev"
            class="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700
                   text-gray-400 hover:text-white transition-all
                   flex items-center justify-center cursor-pointer
                   opacity-50"
            disabled>
            <i class="fas fa-chevron-left"></i>
          </button>
          <button id="moods-next"
            class="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700
                   text-gray-400 hover:text-white transition-all
                   flex items-center justify-center cursor-pointer
                   opacity-50"
            disabled>
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
        <div class="relative overflow-hidden h-12" id="moods-viewport" >
          <div id="moods-container" class="flex gap-4 transition-transform duration-500 ease-in-out">
            ${Array(8)
              .fill("")
              .map(
                () => `
              <div class="flex-shrink-0 opacity-0">
                <button class="px-4 py-3 rounded-lg border bg-gray-800 border-gray-800"></button>
              </div>
            `
              )
              .join("")}
          </div>
        </div>
        <div class="h-5 mt-4">
          <div id="moods-scrollbar-track"
            class="h-1 bg-gray-700 rounded-full relative cursor-pointer hidden">
            <div id="moods-scrollbar-thumb"
              class="absolute top-1/2 -translate-y-1/2
                     h-1 bg-gray-400 rounded-full
                     transition-all duration-300 w-1/5 left-0">
            </div>
          </div>
        </div>
        <div id="moods-loading" class="hidden text-white py-4 text-center">
          <i class="fas fa-spinner fa-spin text-3xl"></i>
        </div>
        <div id="moods-error" class="hidden text-center text-white py-8">
          Không thể tải dữ liệu
        </div>
      </section>
    `;
  },

  hideScrollbar() {
    document.querySelector("#moods-scrollbar-track")?.classList.add("hidden");
  },
  showScrollbar() {
    document
      .querySelector("#moods-scrollbar-track")
      ?.classList.remove("hidden");
  },
  hideLoading() {
    document.querySelector("#moods-loading")?.classList.add("hidden");
  },
  showLoading() {
    document.querySelector("#moods-loading")?.classList.remove("hidden");
  },
  showError() {
    this.hideLoading();
    document.querySelector("#moods-error")?.classList.remove("hidden");
  },
  hideError() {
    document.querySelector("#moods-error")?.classList.add("hidden");
  },

  getCarouselMetrics() {
    const viewport = document.querySelector("#moods-viewport");
    const container = document.querySelector("#moods-container");
    const firstCard = container?.querySelector(".mood-card");
    if (!viewport || !container)
      return {
        cardWidth: 224,
        itemsPerView: 5,
        viewportWidth: 1120,
        totalWidth: 0,
      };
    const viewportWidth = viewport.offsetWidth;
    const gap = parseFloat(getComputedStyle(container).gap) || 16;
    const cardWidth = firstCard ? firstCard.offsetWidth : 208;
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
    return Math.max(0, this.moods.length - metrics.itemsPerView);
  },

  async fetchMoods() {
    try {
      if (this.hideInternalLoading) {
        this.hideLoading();
      }
      const res = await fetch(this.API_URL);
      if (!res.ok) throw new Error("Fetch error");
      const data = await res.json();
      this.moods = data.items || [];
      this.hideError();
      await this.renderMoodsAsync();
      requestAnimationFrame(() => {
        this.updateNavigation();
        this.updateScrollbar();
      });
    } catch (err) {
      console.error(err);
      this.showError();
    }
  },

  renderMoodsAsync() {
    return new Promise((resolve) => {
      const container = document.querySelector("#moods-container");
      if (!container) return resolve();
      container.innerHTML = "";
      if (this.moods.length === 0) return resolve();
      let loadedCount = 0;
      this.moods.forEach((mood) => {
        const card = document.createElement("div");
        card.className = "flex-shrink-0 mood-card";
        const active = this.activeMoodSlug === mood.slug;
        card.innerHTML = `
          <button class="px-4 py-3 rounded-lg border transition-all cursor-pointer
            ${
              active
                ? "bg-white text-gray-900 border-white font-semibold"
                : "bg-gray-800 text-white border-gray-800 hover:bg-gray-700"
            }"
            data-mood="${mood.slug}">
            ${mood.name}
          </button>
        `;
        card.querySelector("button").addEventListener("click", () => {
          this.router?.navigate(`/mood/${mood.slug}`);
        });
        container.appendChild(card);
        loadedCount++;
        if (loadedCount === this.moods.length) resolve();
      });
    });
  },

  slide(dir) {
    const maxIndex = this.getMaxIndex();
    if (dir === "next" && this.currentIndex < maxIndex) this.currentIndex++;
    if (dir === "prev" && this.currentIndex > 0) this.currentIndex--;
    this.updateSlide();
  },

  updateSlide() {
    const container = document.querySelector("#moods-container");
    if (!container) return;
    const metrics = this.getCarouselMetrics();
    const maxIndex = this.getMaxIndex();
    this.currentIndex = Math.max(0, Math.min(this.currentIndex, maxIndex));
    const translateX =
      this.currentIndex === maxIndex && this.moods.length > metrics.itemsPerView
        ? metrics.totalWidth - metrics.viewportWidth
        : this.currentIndex * metrics.cardWidth;
    container.style.transform = `translateX(-${translateX}px)`;
    this.updateNavigation();
    this.updateScrollbar();
  },

  updateNavigation() {
    const maxIndex = this.getMaxIndex();
    const prevBtn = document.querySelector("#moods-prev");
    const nextBtn = document.querySelector("#moods-next");
    if (!prevBtn || !nextBtn) return;
    if (this.hideInternalLoading) return;
    prevBtn.disabled = this.currentIndex === 0;
    nextBtn.disabled = this.currentIndex >= maxIndex;
    if (prevBtn.disabled) {
      prevBtn.classList.add("opacity-40");
    } else {
      prevBtn.classList.remove("opacity-40");
    }
    if (nextBtn.disabled) {
      nextBtn.classList.add("opacity-40");
    } else {
      nextBtn.classList.remove("opacity-40");
    }
  },

  updateScrollbar() {
    const track = document.querySelector("#moods-scrollbar-track");
    const thumb = document.querySelector("#moods-scrollbar-thumb");
    if (!track || !thumb || this.moods.length === 0) {
      this.hideScrollbar();
      return;
    }
    const metrics = this.getCarouselMetrics();
    const maxIndex = this.getMaxIndex();
    if (this.moods.length <= metrics.itemsPerView) {
      this.hideScrollbar();
      return;
    }
    this.showScrollbar();
    const ratio = metrics.itemsPerView / this.moods.length;
    const width = Math.max(ratio * 100, 10);
    const progress = maxIndex ? this.currentIndex / maxIndex : 0;
    thumb.style.width = `${width}%`;
    thumb.style.left = `${progress * (100 - width)}%`;
  },

  scrollToPosition(percent) {
    const maxIndex = this.getMaxIndex();
    this.currentIndex = Math.round(percent * maxIndex);
    this.updateSlide();
  },

  setupEventListeners() {
    const prev = document.querySelector("#moods-prev");
    const next = document.querySelector("#moods-next");
    const track = document.querySelector("#moods-scrollbar-track");
    const thumb = document.querySelector("#moods-scrollbar-thumb");
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
      this.scrollToPosition((startLeft + e.clientX - startX) / rect.width);
    });

    document.addEventListener("mouseup", () => {
      this.isDragging = false;
    });
    window.addEventListener("resize", () => this.updateSlide());
  },

  init(activeMoodSlug = null, options = {}) {
    this.activeMoodSlug = activeMoodSlug;
    this.currentIndex = 0;
    this.hideInternalLoading = options.hideLoading === true;
    this.hideScrollbar();
    if (this.hideInternalLoading) {
      this.hideLoading();
    }
    this.setupEventListeners();
    return this.fetchMoods();
  },
};
