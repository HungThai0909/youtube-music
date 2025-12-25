import { Header } from "../components/header";
import { Sidebar } from "../components/Sidebar";
import { initSidebarToggle } from "./home";
import { initSearchHandler } from "../utils/initSearchHandler";

let router = null;
export const setMetaPageRouter = (routerInstance) => {
  router = routerInstance;
};

class CarouselSection {
  constructor(title, apiEndpoint, type) {
    this.title = title;
    this.apiEndpoint = apiEndpoint;
    this.type = type; 
    this.currentIndex = 0;
    this.columns = [];
    this.isDragging = false;
    this.ITEMS_PER_COLUMN = 4;
  }
  render() {
    return `
      <section class="mb-12">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-3xl font-bold text-white">${this.title}</h2>
          <div class="flex gap-3">
            <button data-carousel="${this.type}" data-action="prev"
              class="w-9 h-9 rounded-full bg-gray-800 hover:bg-gray-700
                     text-gray-400 hover:text-white flex items-center justify-center cursor-pointer">
              <i class="fas fa-chevron-left"></i>
            </button>
            <button data-carousel="${this.type}" data-action="next"
              class="w-9 h-9 rounded-full bg-gray-800 hover:bg-gray-700
                     text-gray-400 hover:text-white flex items-center justify-center cursor-pointer">
              <i class="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>
        <div class="relative overflow-hidden" data-viewport="${this.type}">
          <div data-container="${this.type}"
            class="flex gap-6 transition-transform duration-500 ease-in-out">
            ${Array(5).fill('').map(() => `
              <div class="flex-shrink-0 w-[280px] space-y-3 opacity-0">
                ${Array(4).fill('').map(() => `
                  <div class="h-[72px] bg-gray-800 rounded-xl animate-pulse"></div>
                `).join('')}
              </div>
            `).join('')}
          </div>
        </div>
        <div class="h-5 mt-4">
          <div data-scrollbar-track="${this.type}"
            class="h-1 bg-white/10 rounded-full relative cursor-pointer hidden">
            <div data-scrollbar-thumb="${this.type}"
              class="absolute top-1/2 -translate-y-1/2
                     h-1 bg-white/40 rounded-full
                     transition-all duration-300 cursor-pointer w-1/5 left-0">
            </div>
          </div>
        </div>
      </section>
    `;
  }

  chunk(arr, size) {
    const result = [];
    for (let i = 0; i < arr.length; i += size) {
      result.push(arr.slice(i, i + size));
    }
    return result;
  }

  getCarouselMetrics() {
    const viewport = document.querySelector(`[data-viewport="${this.type}"]`);
    const container = document.querySelector(`[data-container="${this.type}"]`);
    const firstColumn = container?.querySelector(".flex-shrink-0");
    
    if (!viewport || !container) {
      return { columnWidth: 280, itemsPerView: 5, viewportWidth: 1400, totalWidth: 0 };
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
  }

  getMaxIndex() {
    const metrics = this.getCarouselMetrics();
    return Math.max(0, this.columns.length - metrics.itemsPerView);
  }

  async fetchData() {
    try {
      const res = await fetch(this.apiEndpoint);
      if (!res.ok) throw new Error("Fetch error");
      const data = await res.json();
      let items = [];
      if (this.type === 'genres') {
        items = data.items || [];
      } else {
        const allItems = data.items || [];        
        if (this.type === 'personal') {
          items = allItems.filter(item => item.type === 'genre');
        } else if (this.type === 'moments') {
          items = allItems.filter(item => item.type === 'mood' || item.type === 'other');
        }
      }
      this.columns = this.chunk(items, this.ITEMS_PER_COLUMN);
      this.renderColumns();
      requestAnimationFrame(() => {
        this.updateNavigation();
        this.updateScrollbar();
      });
      return true;
    } catch (err) {
      console.error(`Error fetching ${this.type}:`, err);
      return false;
    }
  }

  renderColumns() {
    const container = document.querySelector(`[data-container="${this.type}"]`);
    if (!container) return;
    container.innerHTML = "";
    if (this.columns.length === 0) {
      container.innerHTML = `
        <div class="flex-shrink-0 w-full text-center py-8">
          <p class="text-gray-400">Không có dữ liệu</p>
        </div>
      `;
      return;
    }
    
    this.columns.forEach((column) => {
      const colEl = document.createElement("div");
      colEl.className = "flex-shrink-0 w-[280px] space-y-3"; 
      column.forEach((item) => {
        if (!item || !item.name) {
          console.warn(`[${this.type}] Invalid item:`, item);
          return;
        }
        
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
        card.onclick = () => this.navigateToItem(item);
        colEl.appendChild(card);
      });
      if (colEl.children.length > 0) {
        container.appendChild(colEl);
      }
    });
  }

  slide(dir) {
    const maxIndex = this.getMaxIndex();
    if (dir === "next" && this.currentIndex < maxIndex) {
      this.currentIndex++;
    }
    if (dir === "prev" && this.currentIndex > 0) {
      this.currentIndex--;
    }
    this.updateSlide();
  }

  updateSlide() {
    const container = document.querySelector(`[data-container="${this.type}"]`);
    if (!container) return;
    const maxIndex = this.getMaxIndex();
    const metrics = this.getCarouselMetrics();
    this.currentIndex = Math.max(0, Math.min(this.currentIndex, maxIndex));
    const translateX = this.currentIndex === maxIndex && this.columns.length > metrics.itemsPerView
      ? metrics.totalWidth - metrics.viewportWidth
      : this.currentIndex * metrics.columnWidth;
    container.style.transform = `translateX(-${translateX}px)`;
    this.updateNavigation();
    this.updateScrollbar();
  }

  updateNavigation() {
    const maxIndex = this.getMaxIndex();
    const prevBtn = document.querySelector(`[data-carousel="${this.type}"][data-action="prev"]`);
    const nextBtn = document.querySelector(`[data-carousel="${this.type}"][data-action="next"]`);
    if (!prevBtn || !nextBtn) return;
    const isAtStart = this.currentIndex === 0;
    const isAtEnd = this.currentIndex >= maxIndex;
    prevBtn.disabled = isAtStart;
    prevBtn.style.opacity = isAtStart ? "0.5" : "1";
    nextBtn.disabled = isAtEnd;
    nextBtn.style.opacity = isAtEnd ? "0.5" : "1";
  }

  updateScrollbar() {
    const track = document.querySelector(`[data-scrollbar-track="${this.type}"]`);
    const thumb = document.querySelector(`[data-scrollbar-thumb="${this.type}"]`);
    if (!track || !thumb || !this.columns.length) return;
    const metrics = this.getCarouselMetrics();
    const maxIndex = this.getMaxIndex();
    if (this.columns.length <= metrics.itemsPerView) {
      track.classList.add("hidden");
      return;
    }
    track.classList.remove("hidden");
    const visibleRatio = metrics.itemsPerView / this.columns.length;
    const thumbWidth = Math.max(visibleRatio * 100, 10);
    const progress = maxIndex > 0 ? this.currentIndex / maxIndex : 0;
    thumb.style.width = `${thumbWidth}%`;
    thumb.style.left = `${progress * (100 - thumbWidth)}%`;
  }

  scrollToPosition(percent) {
    const maxIndex = this.getMaxIndex();
    this.currentIndex = Math.round(percent * maxIndex);
    this.currentIndex = Math.max(0, Math.min(this.currentIndex, maxIndex));
    this.updateSlide();
  }

  setupEventListeners() {
    const prevBtn = document.querySelector(`[data-carousel="${this.type}"][data-action="prev"]`);
    const nextBtn = document.querySelector(`[data-carousel="${this.type}"][data-action="next"]`);
    const track = document.querySelector(`[data-scrollbar-track="${this.type}"]`);
    const thumb = document.querySelector(`[data-scrollbar-thumb="${this.type}"]`);
    prevBtn?.addEventListener("click", () => this.slide("prev"));
    nextBtn?.addEventListener("click", () => this.slide("next"));
    track?.addEventListener("click", (e) => {
      const rect = track.getBoundingClientRect();
      this.scrollToPosition((e.clientX - rect.left) / rect.width);
    });
    
    let startX = 0, startLeft = 0;
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
      const newLeft = Math.max(0, Math.min(startLeft + e.clientX - startX, maxLeft));
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
  }

  navigateToItem(item) {
    if (!router) {
      console.error("Router not initialized!");
      return;
    }
    if (this.type === 'genres') {
      router.navigate(`/line/${item.slug}`);
    } else {
      router.navigate(`/category/${item.slug}`);
    }
  }

  async init() {
    await this.fetchData();
    this.setupEventListeners();
  }
}

const personalSection = new CarouselSection(
  "Dành cho bạn",
  `${import.meta.env.VITE_BASE_URL}/categories`,
  "personal"
);

const momentsSection = new CarouselSection(
  "Tâm trạng và khoảnh khắc",
  `${import.meta.env.VITE_BASE_URL}/categories`,
  "moments"
);

const genresSection = new CarouselSection(
  "Dòng nhạc",
  `${import.meta.env.VITE_BASE_URL}/lines`,
  "genres"
);

export const MetaPage = () => {
  const app = document.querySelector("#app");
  const html = `
    <div id="global-loading-overlay"
      class="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center
             transition-opacity duration-500">
      <div class="w-16 h-16 border-4 border-gray-700
                  border-t-white rounded-full animate-spin"></div>
    </div>
    ${Header()}
    <div class="flex pt-[64px]">
      <div class="w-22">${Sidebar()}</div>
      <main class="flex-1">
        <div class="px-6 py-8 max-w-[1400px] mx-auto">
          <div class="pl-24">
            <h1 class="text-5xl font-bold text-white mb-12 mt-8">Tâm trạng và thể loại</h1>
            ${personalSection.render()}
            ${momentsSection.render()}
            ${genresSection.render()}
          </div>
        </div>
      </main>
    </div>
  `;

  app.innerHTML = html;
  setTimeout(async () => {
    try {
      await Promise.all([
        personalSection.init(),
        momentsSection.init(),
        genresSection.init(),
      ]);
      const overlay = document.querySelector("#global-loading-overlay");
      if (overlay) {
        overlay.style.opacity = "0";
        setTimeout(() => overlay.remove(), 500);
      }
    } catch (err) {
      console.error("Moods page load error:", err);
      document.querySelector("#global-loading-overlay")?.remove();
    }
  }, 0);
  initSidebarToggle();
  initSearchHandler();
};