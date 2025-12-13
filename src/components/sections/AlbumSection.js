export const AlbumSection = {
  API_URL:
    "https://youtube-music.f8team.dev/api/home/albums-for-you?country&limit=20",
  ITEMS_PER_VIEW: 5,
  CARD_WIDTH: 280,
  currentIndex: 0,
  albums: [],
  isDragging: false,

  render() {
    return `
      <section class="mb-10">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-3xl font-bold text-white">Album gợi ý cho bạn</h2>
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
        <div class="relative overflow-hidden">
          <div id="albums-container"
            class="flex gap-4 transition-transform duration-500 ease-in-out">
          </div>
        </div>
        <div id="albums-scrollbar-track"
          class="mt-4 h-1 bg-gray-700 rounded-full relative cursor-pointer">
          <div id="albums-scrollbar-thumb"
            class="absolute top-1/2 -translate-y-1/2
                   h-1 bg-gray-400 rounded-full
                   transition-all duration-300 cursor-pointer"
            style="width:20%;left:0%">
          </div>
        </div>
        <div id="albums-loading" class="text-white py-8 text-center">
          <i class="fas fa-spinner fa-spin text-3xl"></i>
          <p class="mt-2">Đang tải...</p>
        </div>
        <div id="albums-error"
          class="hidden text-center text-red-400 py-8">
          <i class="fas fa-exclamation-circle text-3xl"></i>
          <p class="mt-2">Không thể tải dữ liệu</p>
        </div>
      </section>
    `;
  },

  async fetchAlbums() {
    try {
      const res = await fetch(this.API_URL);
      if (!res.ok) throw new Error("Fetch error");
      this.albums = await res.json();
      this.hideLoading();
      this.renderAlbums();
      this.updateNavigation();
      this.updateScrollbar();
    } catch (err) {
      console.error(err);
      this.showError();
    }
  },

  hideLoading() {
    document.querySelector("#albums-loading")?.classList.add("hidden");
  },

  showError() {
    document.querySelector("#albums-loading")?.classList.add("hidden");
    document.querySelector("#albums-error")?.classList.remove("hidden");
  },

  updateScrollbar() {
    const thumb = document.querySelector("#albums-scrollbar-thumb");
    if (!thumb || !this.albums.length) return;
    const visibleRatio = this.ITEMS_PER_VIEW / this.albums.length;
    const thumbWidth = Math.max(visibleRatio * 100, 10);
    const maxIndex = this.albums.length - this.ITEMS_PER_VIEW;
    const progress = maxIndex > 0 ? this.currentIndex / maxIndex : 0;
    const maxLeft = 100 - thumbWidth;
    thumb.style.width = `${thumbWidth}%`;
    thumb.style.left = `${progress * maxLeft}%`;
  },

  renderAlbums() {
    const container = document.querySelector("#albums-container");
    if (!container) return;
    container.innerHTML = "";
    this.albums.forEach((album) => {
      const card = document.createElement("div");
      card.className = "flex-shrink-0 w-64";
      card.innerHTML = `
      <div class="group cursor-pointer">
        <div class="relative">
          <img
            src="${album.thumbnails?.[0] ?? ""}"
            class="w-full aspect-square rounded-lg object-cover"
          />
          <button
            class="absolute inset-0 flex items-center justify-center
                   bg-black/40 opacity-0
                   group-hover:opacity-100
                   transition-opacity duration-200 rounded-lg cursor-pointer"
            onclick="event.stopPropagation()">
            <div
              class="w-12 h-12 bg-white rounded-full
                     flex items-center justify-center transition cursor-pointer">
              <i class="fas fa-play text-gray-900 text-sm ml-0.5"></i>
            </div>
          </button>
        </div>
        <h3 class="mt-3 text-white truncate">
          ${album.title}
        </h3>
        <p class="text-gray-400 text-sm truncate">
          ${album.artists?.join(", ") ?? ""}
        </p>
      </div>
    `;
      container.appendChild(card);
    });
  },

  updateNavigation() {
    document
      .querySelector("#albums-prev")
      ?.toggleAttribute("disabled", this.currentIndex === 0);
    document
      .querySelector("#albums-next")
      ?.toggleAttribute(
        "disabled",
        this.currentIndex >= this.albums.length - this.ITEMS_PER_VIEW
      );
  },

  slide(dir) {
    const maxIndex = this.albums.length - this.ITEMS_PER_VIEW;
    if (dir === "next" && this.currentIndex < maxIndex) this.currentIndex++;
    if (dir === "prev" && this.currentIndex > 0) this.currentIndex--;
    document.querySelector(
      "#albums-container"
    ).style.transform = `translateX(-${this.currentIndex * this.CARD_WIDTH}px)`;
    this.updateNavigation();
    this.updateScrollbar();
  },

  scrollToPosition(percent) {
    const maxIndex = this.albums.length - this.ITEMS_PER_VIEW;
    this.currentIndex = Math.round(percent * maxIndex);
    this.currentIndex = Math.max(0, Math.min(this.currentIndex, maxIndex));
    document.querySelector(
      "#albums-container"
    ).style.transform = `translateX(-${this.currentIndex * this.CARD_WIDTH}px)`;
    this.updateNavigation();
    this.updateScrollbar();
  },

  setupEventListeners() {
    const prev = document.querySelector("#albums-prev");
    const next = document.querySelector("#albums-next");
    const track = document.querySelector("#albums-scrollbar-track");
    const thumb = document.querySelector("#albums-scrollbar-thumb");
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
    this.fetchAlbums();
  },
};
