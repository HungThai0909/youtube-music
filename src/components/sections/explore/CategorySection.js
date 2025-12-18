export const CategorySection = {
  router: null,
  setRouter(routerInstance) {
    this.router = routerInstance;
  },
  render() {
    return `
      <section class="mb-10">
        <div class="flex gap-4">
          <button
            id="category-new-releases"
            class="group flex items-center gap-3 px-3 py-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all duration-300 cursor-pointer flex-1"
          >
            <div class="w-9 h-9 rounded-full flex items-center justify-center transition-transform">
              <i class="fas fa-compact-disc text-2xl text-white"></i>
            </div>
            <span class="text-white text-lg font-bold">Bản phát hành mới</span>
          </button>
          <button
            id="category-charts"
            class="group flex items-center gap-3 px-3 py-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all duration-300 cursor-pointer flex-1"
          >
            <div class="w-9 h-9 rounded-full flex items-center justify-center transition-transform">
              <i class="fas fa-chart-line text-2xl text-white"></i>
            </div>
            <span class="text-white text-lg font-bold">Bảng xếp hạng</span>
          </button>
          <button
            id="category-moods"
            class="group flex items-center gap-3 px-3 py-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all duration-300 cursor-pointer flex-1"
          >
            <div class="w-9 h-9 rounded-full flex items-center justify-center transition-transform">
              <i class="fa-regular fa-face-smile text-2xl text-white"></i>
            </div>
            <span class="text-white text-lg font-bold">Tâm trạng và thể loại</span>
          </button>
        </div>
      </section>
    `;
  },

  setupEventListeners() {
    document
      .querySelector("#category-new-releases")
      ?.addEventListener("click", () => {
        this.router?.navigate("/explore?category=new-releases");
      });
    document
      .querySelector("#category-charts")
      ?.addEventListener("click", () => {
        this.router?.navigate("/explore?category=charts");
      });
    document.querySelector("#category-moods")?.addEventListener("click", () => {
      this.router?.navigate("/explore?category=moods");
    });
  },

  init() {
    this.setupEventListeners();
  },
};
