export const MetaSection = {
  API_URL: `${import.meta.env.VITE_BASE_URL}/explore/meta`,

  ITEMS_PER_COLUMN: 4,
  COLUMN_WIDTH: 280,

  currentIndex: 0,
  columns: [],
  router: null,

  setRouter(routerInstance) {
    this.router = routerInstance;
  },

  render() {
    return `
      <section class="mb-12">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-3xl font-bold text-white">
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
        <div class="relative overflow-hidden">
          <div id="meta-container"
            class="flex gap-6 transition-transform duration-500 ease-in-out">
          </div>
        </div>
        <div id="meta-scrollbar-track"
          class="mt-4 h-1 bg-white/10 rounded-full relative">
          <div id="meta-scrollbar-thumb"
            class="absolute h-1 bg-white/40 rounded-full transition-all duration-300"
            style="width:20%">
          </div>
        </div>
        <div id="meta-loading"
          class="text-white py-10 text-center">
          <i class="fas fa-spinner fa-spin text-3xl"></i>
        </div>
        <div id="meta-error"
          class="hidden text-center text-red-400 py-8">
          Không thể tải dữ liệu
        </div>
      </section>
    `;
  },

  async fetchMeta() {
    try {
      const res = await fetch(this.API_URL);
      if (!res.ok) throw new Error("Fetch error");
      const data = await res.json();
      const metas = [...(data.categories ?? []), ...(data.lines ?? [])];
      this.columns = this.chunk(metas, this.ITEMS_PER_COLUMN);
      this.hideLoading();
      this.renderColumns();
      this.updateScrollbar();
      this.updateNavigation();
    } catch (e) {
      console.error(e);
      this.showError();
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
    const maxIndex = this.columns.length - 1;
    if (dir === "next" && this.currentIndex < maxIndex) this.currentIndex++;
    if (dir === "prev" && this.currentIndex > 0) this.currentIndex--;
    document.querySelector("#meta-container").style.transform = `translateX(-${
      this.currentIndex * this.COLUMN_WIDTH
    }px)`;
    this.updateNavigation();
    this.updateScrollbar();
  },

  updateNavigation() {
    document
      .querySelector("#meta-prev")
      ?.toggleAttribute("disabled", this.currentIndex === 0);
    document
      .querySelector("#meta-next")
      ?.toggleAttribute(
        "disabled",
        this.currentIndex >= this.columns.length - 1
      );
  },

  updateScrollbar() {
    const thumb = document.querySelector("#meta-scrollbar-thumb");
    if (!thumb) return;
    const ratio = 1 / this.columns.length;
    const progress = this.currentIndex / (this.columns.length - 1 || 1);
    thumb.style.width = `${Math.max(ratio * 100, 10)}%`;
    thumb.style.left = `${progress * (100 - ratio * 100)}%`;
  },

  navigateToMeta(item) {
    this.router?.navigate(`/explore?meta=${item.slug}`);
  },

  hideLoading() {
    document.querySelector("#meta-loading")?.classList.add("hidden");
  },

  showError() {
    document.querySelector("#meta-loading")?.classList.add("hidden");
    document.querySelector("#meta-error")?.classList.remove("hidden");
  },

  init() {
    document
      .querySelector("#meta-prev")
      ?.addEventListener("click", () => this.slide("prev"));

    document
      .querySelector("#meta-next")
      ?.addEventListener("click", () => this.slide("next"));

    return this.fetchMeta();
  },
};
