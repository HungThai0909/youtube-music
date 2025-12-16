export const VideoSection = {
  API_URL: `${import.meta.env.VITE_BASE_URL}/explore/videos`,
  ITEMS_PER_VIEW: 5,
  CARD_WIDTH: 320,
  currentIndex: 0,
  videos: [],
  isDragging: false,
  router: null,

  setRouter(routerInstance) {
    this.router = routerInstance;
  },

  render() {
    return `
      <section class="mb-12">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-3xl font-bold text-white">
            Video nhạc mới
          </h2>
          <div class="flex gap-3">
            <button id="videos-prev"
              class="w-9 h-9 rounded-full bg-gray-800 hover:bg-gray-700
                     text-gray-400 hover:text-white flex items-center justify-center cursor-pointer">
              <i class="fas fa-chevron-left"></i>
            </button>
            <button id="videos-next"
              class="w-9 h-9 rounded-full bg-gray-800 hover:bg-gray-700
                     text-gray-400 hover:text-white flex items-center justify-center cursor-pointer">
              <i class="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>
        <div class="relative overflow-hidden">
          <div id="videos-container"
            class="flex gap-6 transition-transform duration-500 ease-in-out">
          </div>
        </div>
        <div id="videos-scrollbar-track"
          class="mt-4 h-1 bg-white/10 rounded-full relative cursor-pointer">
          <div id="videos-scrollbar-thumb"
            class="absolute top-1/2 -translate-y-1/2
                   h-1 bg-white/40 rounded-full
                   transition-all duration-300 w-1/5 left-0">
          </div>
        </div>
        <div id="videos-loading"
          class="text-white py-10 text-center">
          <i class="fas fa-spinner fa-spin text-3xl"></i>
        </div>
        <div id="videos-error"
          class="hidden text-center text-red-400 py-8">
          Không thể tải dữ liệu
        </div>
      </section>
    `;
  },

  async fetchVideos() {
    try {
      const res = await fetch(this.API_URL);
      if (!res.ok) throw new Error("Fetch error");
      const data = await res.json();
      this.videos = data?.items ?? [];
      if (!this.videos.length) {
        throw new Error("Empty data");
      }
      this.hideLoading();
      this.hideError();
      this.renderVideos();
      this.updateNavigation();
      this.updateScrollbar();
    } catch (err) {
      console.error(err);
      this.showError();
    }
  },

  hideLoading() {
    document.querySelector("#videos-loading")?.classList.add("hidden");
  },

  showError() {
    document.querySelector("#videos-loading")?.classList.add("hidden");
    document.querySelector("#videos-error")?.classList.remove("hidden");
  },

  hideError() {
    document.querySelector("#videos-error")?.classList.add("hidden");
  },

  renderVideos() {
    const container = document.querySelector("#videos-container");
    if (!container) return;
    container.innerHTML = "";
    this.videos.forEach((video) => {
      const card = document.createElement("div");
      card.className = "flex-shrink-0 w-80 cursor-pointer";
      card.innerHTML = `
        <div class="group">
          <div class="relative">
            <img
              src="${video.thumb}"
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
            ${video.name}
          </h3>
          <p class="text-gray-400 text-sm">
            ${video.views.toLocaleString()} lượt xem
          </p>
        </div>
      `;
      card.addEventListener("click", () => {
        this.navigateToVideo(video);
      });
      container.appendChild(card);
    });
  },

  navigateToVideo(video) {
    const slug = video.slug || video.id;
    if (!slug || !this.router) return;
    this.router.navigate(`/video/details/${slug}`);
  },

  updateNavigation() {
    const maxIndex = this.videos.length - this.ITEMS_PER_VIEW;
    document
      .querySelector("#videos-prev")
      ?.toggleAttribute("disabled", this.currentIndex === 0);
    document
      .querySelector("#videos-next")
      ?.toggleAttribute("disabled", this.currentIndex >= maxIndex);
  },

  slide(dir) {
    const maxIndex = this.videos.length - this.ITEMS_PER_VIEW;
    if (dir === "next" && this.currentIndex < maxIndex) this.currentIndex++;
    if (dir === "prev" && this.currentIndex > 0) this.currentIndex--;
    document.querySelector(
      "#videos-container"
    ).style.transform = `translateX(-${this.currentIndex * this.CARD_WIDTH}px)`;
    this.updateNavigation();
    this.updateScrollbar();
  },

  updateScrollbar() {
    const thumb = document.querySelector("#videos-scrollbar-thumb");
    if (!thumb || !this.videos.length) return;
    const visibleRatio = this.ITEMS_PER_VIEW / this.videos.length;
    const thumbWidth = Math.max(visibleRatio * 100, 10);
    const maxIndex = this.videos.length - this.ITEMS_PER_VIEW;
    const progress = maxIndex > 0 ? this.currentIndex / maxIndex : 0;
    const maxLeft = 100 - thumbWidth;
    thumb.style.width = `${thumbWidth}%`;
    thumb.style.left = `${progress * maxLeft}%`;
  },

  scrollToPosition(percent) {
    const maxIndex = this.videos.length - this.ITEMS_PER_VIEW;
    this.currentIndex = Math.round(percent * maxIndex);
    this.currentIndex = Math.max(0, Math.min(this.currentIndex, maxIndex));
    document.querySelector(
      "#videos-container"
    ).style.transform = `translateX(-${this.currentIndex * this.CARD_WIDTH}px)`;
    this.updateNavigation();
    this.updateScrollbar();
  },

  setupEventListeners() {
    const prev = document.querySelector("#videos-prev");
    const next = document.querySelector("#videos-next");
    const track = document.querySelector("#videos-scrollbar-track");
    const thumb = document.querySelector("#videos-scrollbar-thumb");
    prev?.addEventListener("click", () => this.slide("prev"));
    next?.addEventListener("click", () => this.slide("next"));
    track?.addEventListener("click", (e) => {
      if (e.target !== track) return;
      const rect = track.getBoundingClientRect();
      this.scrollToPosition((e.clientX - rect.left) / rect.width);
    });
    let startX = 0;
    let startLeft = 0;
    thumb?.addEventListener("mousedown", (e) => {
      this.isDragging = true;
      startX = e.clientX;
      startLeft = thumb.offsetLeft;
      document.body.style.cursor = "pointer";
      e.preventDefault();
    });

    document.addEventListener("mousemove", (e) => {
      if (!this.isDragging) return;
      const rect = track.getBoundingClientRect();
      const percent = (startLeft + e.clientX - startX) / rect.width;
      this.scrollToPosition(percent);
    });

    document.addEventListener("mouseup", () => {
      this.isDragging = false;
      document.body.style.cursor = "";
    });
  },

  init() {
    this.setupEventListeners();
    return this.fetchVideos();
  },
};
