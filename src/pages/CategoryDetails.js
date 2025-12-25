import { Header } from "../components/header";
import { Sidebar } from "../components/Sidebar";
import { initSidebarToggle } from "./home";
import { initSearchHandler } from "../utils/initSearchHandler";

let currentRouter = null;
export const CategoryDetail = (match) => {
  const app = document.querySelector("#app");
  const categorySlug = match?.data?.id;
  app.innerHTML = `
    ${Header()}
    <div class="flex pt-[64px]">
      <div class="w-22">${Sidebar()}</div>
      <main class="flex-1">
        <div id="category-loading-overlay"
          class="fixed inset-0 z-[100] bg-black/60 flex flex-col items-center justify-center transition-opacity duration-300">
          <div class="w-16 h-16 border-4 border-gray-700 border-t-white rounded-full animate-spin"></div>
        </div>
        <div class="px-6 py-8 max-w-[1400px] mx-auto">
        <div class="pl-24">
        <div id="category-header" class="mb-8"></div>
        <div id="category-subcategories" class="min-h-[360px]"></div>
        </div>
        </div>
      </main>
    </div>
  `;

  initSidebarToggle();
  initSearchHandler();
  loadCategoryDetail(categorySlug);
};

export const setCategoryDetailRouter = (router) => {
  currentRouter = router;
};

async function loadCategoryDetail(slug) {
  const container = document.querySelector("#category-subcategories");
  try {
    const data = await fetchCategory(slug);
    renderHeader(data);
    renderSubcategories(data);
    await waitForImagesToLoad(container);
    await new Promise(resolve => {
      requestAnimationFrame(() => {
        requestAnimationFrame(resolve);
      });
    });
    if (container) {
      container.style.minHeight = '';
    }
    hideLoading();
  } catch (err) {
    console.error(err);
    showError();
    hideLoading();
  }
}

async function waitForImagesToLoad(container) {
  if (!container) return;
  const images = container.querySelectorAll('img');
  if (images.length === 0) return;
  const imagePromises = Array.from(images).map(img => {
    return new Promise((resolve) => {
      if (img.complete) {
        resolve();
      } else {
        img.onload = resolve;
        img.onerror = resolve; 
      }
    });
  });
  await Promise.all(imagePromises);
}

async function fetchCategory(slug) {
  const url = `${import.meta.env.VITE_BASE_URL}/categories/${slug}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Fetch failed");
  return res.json();
}

function renderHeader(data) {
  const header = document.querySelector("#category-header");
  if (!header) return;
  header.innerHTML = `
    <div class="flex items-center gap-6">
      <div>
        <h1 class="text-5xl font-bold text-white mb-10 mt-12">${data.name}</h1>
      </div>
    </div>
  `;
}

function renderSubcategories(data) {
  const container = document.querySelector("#category-subcategories");
  if (!container) return;
  const subcategories = data.subcategories || [];
  if (subcategories.length === 0) {
    container.innerHTML = `
      <p class="text-gray-400 text-center py-12"></p>
    `;
    return;
  }

  container.innerHTML = subcategories
    .map((subcat, index) => {
      const sectionId = `subcat-${index}`;
      return renderSubcategorySection(subcat, sectionId);
    })
    .join("");
  subcategories.forEach((subcat, index) => {
    const sectionId = `subcat-${index}`;
    initSubcategorySection(subcat, sectionId, index);
  });
}

function renderSubcategorySection(subcat, sectionId) {
  return `
    <section class="mb-10">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-5xl font-bold text-white">${subcat.name}</h2>
        <div class="flex gap-4">
          <button id="${sectionId}-prev"
            class="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700
                   text-gray-400 hover:text-white transition-all duration-300
                   flex items-center justify-center cursor-pointer">
            <i class="fas fa-chevron-left"></i>
          </button>
          <button id="${sectionId}-next"
            class="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700
                   text-gray-400 hover:text-white transition-all duration-300
                   flex items-center justify-center cursor-pointer">
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>
      <div class="relative overflow-hidden" id="${sectionId}-viewport">
        <div id="${sectionId}-container" 
          class="flex gap-4 transition-transform duration-500 ease-in-out">
        </div>
      </div>
      <div class="h-5 mt-4">
        <div id="${sectionId}-scrollbar-track"
          class="h-1 bg-gray-700 rounded-full relative cursor-pointer hidden">
          <div id="${sectionId}-scrollbar-thumb"
            class="absolute top-1/2 -translate-y-1/2
                   h-1 bg-gray-400 rounded-full
                   transition-all duration-300 cursor-pointer w-1/5 left-0">
          </div>
        </div>
      </div>
    </section>
  `;
}

function initSubcategorySection(subcat, sectionId, index) {
  const playlists = subcat.playlists || [];
  const state = {
    currentIndex: 0,
    isDragging: false,
    playlists: playlists,
  };

  renderPlaylists(sectionId, playlists);

  requestAnimationFrame(() => {
    updateNavigation(sectionId, state);
    updateScrollbar(sectionId, state);
    const metrics = getCarouselMetrics(sectionId);
    if (playlists.length > metrics.itemsPerView) {
      showScrollbar(sectionId);
    }
  });

  setupEventListeners(sectionId, state);
}

function renderPlaylists(sectionId, playlists) {
  const container = document.querySelector(`#${sectionId}-container`);
  if (!container) return;

  container.innerHTML = "";

  playlists.forEach((playlist) => {
    const card = document.createElement("div");
    card.className = "flex-shrink-0 w-64";
    card.innerHTML = `
      <div class="group cursor-pointer">
        <div class="relative">
          <img src="${playlist.thumbnails?.[0] || ""}"
               class="w-full aspect-square rounded-lg object-cover"
               loading="eager"/>
          <div class="absolute inset-0 bg-black/40 opacity-0
                      group-hover:opacity-100 transition
                      flex items-center justify-center rounded-lg">
            <div class="w-12 h-12 bg-white rounded-full
                        flex items-center justify-center">
              <i class="fas fa-play text-gray-900 ml-0.5"></i>
            </div>
          </div>
        </div>
        <h3 class="mt-3 text-white truncate">${playlist.title}</h3>
        <p class="text-gray-400 text-sm truncate">
          ${playlist.artists?.join(", ") || "Various Artists"}
        </p>
      </div>
    `;
    card.onclick = () => navigateToPlaylist(playlist);
    container.appendChild(card);
  });
}

function navigateToPlaylist(playlist) {
  const slug = playlist.slug || playlist.id || playlist._id;
  if (slug && currentRouter) {
    currentRouter.navigate(`/playlist/details/${slug}`);
  }
}

function getCarouselMetrics(sectionId) {
  const viewport = document.querySelector(`#${sectionId}-viewport`);
  const container = document.querySelector(`#${sectionId}-container`);
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
}

function getMaxIndex(sectionId, state) {
  const metrics = getCarouselMetrics(sectionId);
  return Math.max(0, state.playlists.length - metrics.itemsPerView);
}

function updateNavigation(sectionId, state) {
  const maxIndex = getMaxIndex(sectionId, state);
  const prev = document.querySelector(`#${sectionId}-prev`);
  const next = document.querySelector(`#${sectionId}-next`);
  if (!prev || !next) return;
  prev.disabled = state.currentIndex === 0;
  next.disabled = state.currentIndex >= maxIndex;
  prev.style.opacity = prev.disabled ? "0.4" : "1";
  next.style.opacity = next.disabled ? "0.4" : "1";
}

function updateScrollbar(sectionId, state) {
  const track = document.querySelector(`#${sectionId}-scrollbar-track`);
  const thumb = document.querySelector(`#${sectionId}-scrollbar-thumb`);
  if (!track || !thumb || !state.playlists.length) {
    hideScrollbar(sectionId);
    return;
  }
  const metrics = getCarouselMetrics(sectionId);
  const maxIndex = getMaxIndex(sectionId, state);
  if (state.playlists.length <= metrics.itemsPerView) {
    hideScrollbar(sectionId);
    return;
  }
  showScrollbar(sectionId);
  const visibleRatio = metrics.itemsPerView / state.playlists.length;
  const thumbWidth = Math.max(visibleRatio * 100, 10);
  const progress = maxIndex ? state.currentIndex / maxIndex : 0;

  thumb.style.width = `${thumbWidth}%`;
  thumb.style.left = `${progress * (100 - thumbWidth)}%`;
}

function updateSlide(sectionId, state) {
  const container = document.querySelector(`#${sectionId}-container`);
  if (!container) return;
  const metrics = getCarouselMetrics(sectionId);
  const maxIndex = getMaxIndex(sectionId, state);
  state.currentIndex = Math.max(0, Math.min(state.currentIndex, maxIndex));
  const translateX =
    state.currentIndex === maxIndex &&
    state.playlists.length > metrics.itemsPerView
      ? metrics.totalWidth - metrics.viewportWidth
      : state.currentIndex * metrics.cardWidth;
  container.style.transform = `translateX(-${translateX}px)`;
  updateNavigation(sectionId, state);
  updateScrollbar(sectionId, state);
}

function slide(sectionId, state, dir) {
  const maxIndex = getMaxIndex(sectionId, state);
  if (dir === "next" && state.currentIndex < maxIndex) {
    state.currentIndex++;
  }
  if (dir === "prev" && state.currentIndex > 0) {
    state.currentIndex--;
  }
  updateSlide(sectionId, state);
}

function scrollToPosition(sectionId, state, percent) {
  const maxIndex = getMaxIndex(sectionId, state);
  state.currentIndex = Math.round(percent * maxIndex);
  updateSlide(sectionId, state);
}

function hideScrollbar(sectionId) {
  document
    .querySelector(`#${sectionId}-scrollbar-track`)
    ?.classList.add("hidden");
}

function showScrollbar(sectionId) {
  document
    .querySelector(`#${sectionId}-scrollbar-track`)
    ?.classList.remove("hidden");
}

function setupEventListeners(sectionId, state) {
  const prev = document.querySelector(`#${sectionId}-prev`);
  const next = document.querySelector(`#${sectionId}-next`);
  const track = document.querySelector(`#${sectionId}-scrollbar-track`);
  const thumb = document.querySelector(`#${sectionId}-scrollbar-thumb`);
  prev?.addEventListener("click", () => slide(sectionId, state, "prev"));
  next?.addEventListener("click", () => slide(sectionId, state, "next"));
  track?.addEventListener("click", (e) => {
    const rect = track.getBoundingClientRect();
    scrollToPosition(sectionId, state, (e.clientX - rect.left) / rect.width);
  });
  let startX = 0,
    startLeft = 0;
  thumb?.addEventListener("mousedown", (e) => {
    state.isDragging = true;
    startX = e.clientX;
    startLeft = thumb.offsetLeft;
    e.preventDefault();
  });

  document.addEventListener("mousemove", (e) => {
    if (!state.isDragging) return;
    const rect = track.getBoundingClientRect();
    const thumbWidth = thumb.offsetWidth;
    const maxLeft = rect.width - thumbWidth;
    const newLeft = Math.max(
      0,
      Math.min(startLeft + e.clientX - startX, maxLeft)
    );
    const percent = newLeft / maxLeft;
    scrollToPosition(sectionId, state, percent);
  });

  document.addEventListener("mouseup", () => {
    state.isDragging = false;
  });
  window.addEventListener("resize", () => updateSlide(sectionId, state));
}

function hideLoading() {
  const overlay = document.querySelector("#category-loading-overlay");
  if (overlay) {
    overlay.style.opacity = "0";
    setTimeout(() => overlay.remove(), 300);
  }
}

function showError() {
  const overlay = document.querySelector("#category-loading-overlay");
  if (overlay) {
    overlay.innerHTML = `
      <i class="fas fa-exclamation-circle text-white text-5xl mb-4"></i>
      <p class="text-white text-lg">Không thể tải dữ liệu</p>
    `;
  }
}