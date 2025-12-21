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
            class="group flex items-center gap-3 px-3 py-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all duration-300 cursor-pointer flex-1">
            <div class="w-9 h-9 rounded-full flex items-center justify-center transition-transform">
              <i class="fas fa-compact-disc text-2xl text-white"></i>
            </div>
            <span class="text-white text-lg font-bold">Bản phát hành mới</span>
          </button>
          <button
            id="category-charts"
            class="group flex items-center gap-3 px-3 py-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all duration-300 cursor-pointer flex-1">
            <div class="w-9 h-9 rounded-full flex items-center justify-center transition-transform">
              <i class="fas fa-chart-line text-2xl text-white"></i>
            </div>
            <span class="text-white text-lg font-bold">Bảng xếp hạng</span>
          </button>
          <button
            id="category-moods"
            class="group flex items-center gap-3 px-3 py-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all duration-300 cursor-pointer flex-1">
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
        if (this.router) {
          this.router.navigate("/new-releases");
        } else {
          console.error("Router not initialized!");
        }
      });
      
    document
      .querySelector("#category-charts")
      ?.addEventListener("click", () => {
        if (this.router) {
          this.router.navigate("/charts");
        } else {
          console.error("Router not initialized!");
        }
      });
      
    document
      .querySelector("#category-moods")
      ?.addEventListener("click", () => {
        if (this.router) {
          this.router.navigate("/moods");
        } else {
          console.error("Router not initialized!");
        }
      });
  },

  init() {
    if (!this.router) {
      console.warn("CategorySection: Router not set yet. Call CategorySection.setRouter(router) first!");
    }
    this.setupEventListeners();
  },
};