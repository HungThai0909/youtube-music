export const MoodsSection = {
  API_URL: "https://youtube-music.f8team.dev/api/moods?limit=20",
  ITEMS_PER_VIEW: 5,
  CARD_WIDTH: 208,
  currentIndex: 0,
  moods: [],

  render() {
    return `
      <section class="mb-10">
        <div class="flex justify-end gap-4 mb-6">
          <button id="moods-prev" class="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-all duration-300 flex items-center justify-center cursor-pointer">
            <i class="fas fa-chevron-left"></i>
          </button>
          <button id="moods-next" class="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-all duration-300 flex items-center justify-center cursor-pointer">
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
        <div class="relative overflow-hidden">
          <div id="moods-container" class="flex gap-4 transition-transform duration-500 ease-in-out">
          </div>
        </div>
        <div id="moods-loading" class="text-white py-4 text-center">
          <i class="fas fa-spinner fa-spin text-3xl"></i>
          <p class="mt-2">Đang tải...</p>
        </div>
        <div id="moods-error" class="hidden text-center text-red-400 py-8">
          <i class="fas fa-exclamation-circle text-3xl"></i>
          <p class="mt-2">Không thể tải dữ liệu</p>
        </div>
      </section>
    `;
  },

  async fetchMoods() {
    try {
      const response = await fetch(this.API_URL);
      if (!response.ok) throw new Error("Network response was not ok");
      const data = await response.json();
      this.moods = data.items || [];
      this.hideLoading();
      this.renderMoods();
      this.updateNavigation();
    } catch (error) {
      console.error("Error fetching moods:", error);
      this.showError();
    }
  },

  hideLoading() {
    const loadingEl = document.querySelector("#moods-loading");
    if (loadingEl) loadingEl.classList.add("hidden");
  },

  showError() {
    const loadingEl = document.querySelector("#moods-loading");
    const errorEl = document.querySelector("#moods-error");
    if (loadingEl) loadingEl.classList.add("hidden");
    if (errorEl) errorEl.classList.remove("hidden");
  },

  renderMoods() {
    const container = document.querySelector("#moods-container");
    if (!container) return;
    container.innerHTML = "";
    this.moods.forEach((mood) => {
      const moodCard = document.createElement("div");
      moodCard.className = "flex-shrink-0";
      moodCard.innerHTML = `
        <button class="px-3 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-all duration-300 transform border border-gray-800">
          ${mood.name}
        </button>
      `;
      container.appendChild(moodCard);
    });
  },

  updateNavigation() {
    const prevBtn = document.querySelector("#moods-prev");
    const nextBtn = document.querySelector("#moods-next");
    if (!prevBtn || !nextBtn) return;
    prevBtn.dataset.disabled = this.currentIndex === 0;
    nextBtn.dataset.disabled =
      this.currentIndex >= this.moods.length - this.ITEMS_PER_VIEW;
  },

  slide(direction) {
    const container = document.querySelector("#moods-container");
    if (!container) return;
    if (
      direction === "next" &&
      this.currentIndex < this.moods.length - this.ITEMS_PER_VIEW
    ) {
      this.currentIndex++;
    } else if (direction === "prev" && this.currentIndex > 0) {
      this.currentIndex--;
    }
    container.style.transform = `translateX(-${
      this.currentIndex * this.CARD_WIDTH
    }px)`;
    this.updateNavigation();
  },

  setupEventListeners() {
    const prevBtn = document.querySelector("#moods-prev");
    const nextBtn = document.querySelector("#moods-next");
    if (prevBtn) prevBtn.addEventListener("click", () => this.slide("prev"));
    if (nextBtn) nextBtn.addEventListener("click", () => this.slide("next"));
    document.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") this.slide("prev");
      if (e.key === "ArrowRight") this.slide("next");
    });
  },

  init() {
    this.setupEventListeners();
    this.fetchMoods();
  },
};
