import { Header } from "../components/header";
import { Sidebar } from "../components/sidebar";
import { initSidebarToggle } from "./home";
import { MoodsSection } from "../components/sections/home/MoodsSection";
import { QuickPickSection } from "../components/sections/home/QuickPickSection";

let currentRouter = null;
export const MoodDetail = (match) => {
  const app = document.querySelector("#app");
  const moodSlug = match?.data?.id;
  app.innerHTML = `
    ${Header()}
    <div class="flex pt-[64px]">
      <div class="w-22">${Sidebar()}</div>
      <main class="flex-1 bg-gray-900 overflow-y-auto h-[calc(100vh-64px)]">
        <div id="mood-loading-overlay"
          class="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center">
          <div class="w-16 h-16 border-4 border-gray-700 border-t-white rounded-full animate-spin"></div>
        </div>
        <div class="px-6 py-8">
          <div class="pl-24">
            <div id="mood-buttons" class="mb-8"></div>
            <div id="mood-header" class="mb-12"></div>
            <div id="quick-picks" class="mt-16"></div>
            <div id="mood-sections"></div>
          </div>
        </div>
      </main>
    </div>
  `;

  initSidebarToggle();
  initPage(moodSlug);
};

export const setMoodDetailRouter = (router) => {
  currentRouter = router;
};

async function initPage(slug) {
  try {
    await Promise.all([
      initMoodButtons(slug),
      initQuickPicks(slug),
      fetchMoodData(slug),
    ]);
    hideLoading();
  } catch (e) {
    console.error(e);
    hideLoading();
  }
}

async function initMoodButtons(slug) {
  const el = document.querySelector("#mood-buttons");
  el.innerHTML = MoodsSection.render();
  if (currentRouter) {
    MoodsSection.setRouter(currentRouter);
  }

  return MoodsSection.init(slug);
}

async function initQuickPicks(slug) {
  const el = document.querySelector("#quick-picks");
  el.innerHTML = QuickPickSection.render();
  return QuickPickSection.init(slug);
}

async function fetchMoodData(slug) {
  const header = document.querySelector("#mood-header");
  const sections = document.querySelector("#mood-sections");
  const res = await fetch(`${import.meta.env.VITE_BASE_URL}/moods/${slug}`);
  const data = await res.json();
  header.innerHTML = `
    <h1 class="text-3xl font-bold text-white mb-2">${
      data.hero?.title ?? ""
    }</h1>
    <p class="text-gray-300">${data.hero?.subtitle ?? ""}</p>
  `;
  sections.innerHTML = data.sections.map(renderSection).join("");
  data.sections.forEach((s) => {
    if (s.type === "carousel") {
      setupCarousel(s.id, s.items);
      setupPlaylistNavigation(s.id);
    }
  });
}

function setupPlaylistNavigation(sectionId) {
  const section = document.querySelector(`[data-section="${sectionId}"]`);
  if (!section) return;
  const playlistCards = section.querySelectorAll("[data-playlist-slug]");
  playlistCards.forEach((card) => {
    const playlistSlug = card.dataset.playlistSlug;
    if (!playlistSlug) return;
    card.addEventListener("click", (e) => {
      if (e.target.closest(".play-btn")) return;
      if (currentRouter) {
        currentRouter.navigate(`/playlist/details/${playlistSlug}`);
      }
    });
    const playBtn = card.querySelector(".play-btn");
    if (playBtn) {
      playBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (currentRouter) {
          currentRouter.navigate(`/playlist/details/${playlistSlug}`);
        }
      });
    }
  });
}

function renderSection(section) {
  if (section.type !== "carousel") return "";
  return `
    <section class="mb-14" data-section="${section.id}">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-3xl font-bold text-white">${section.title}</h2>
        <div class="flex gap-4">
          <button class="prev w-10 h-10 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-full cursor-pointer">
            <i class="fas fa-chevron-left"></i>
          </button>
          <button class="next w-10 h-10 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-full cursor-pointer">
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>
      <div class="relative overflow-hidden">
        <div class="container flex gap-4 transition-transform duration-500">
          ${renderItems(section.items)}
        </div>
      </div>
      <div class="track mt-4 h-1 bg-gray-700 rounded-full relative cursor-pointer">
        <div class="thumb absolute h-1 bg-gray-400 rounded-full w-1/5 left-[0%]"></div>
      </div>
    </section>
  `;
}

function renderItems(items = []) {
  return items
    .map(
      (i) => `
    <div class="w-64 flex-shrink-0">
      <div class="group cursor-pointer" data-playlist-slug="${i.slug ?? ""}">
        <div class="relative">
          <img src="${i.thumbnails?.[0] ?? ""}"
               class="w-full aspect-square rounded-lg object-cover"/>
          <button
            class="play-btn absolute inset-0 flex items-center justify-center
                   bg-black/40 opacity-0 group-hover:opacity-100
                   transition-opacity duration-200 rounded-lg cursor-pointer"
            onclick="event.stopPropagation()">
            <div
              class="w-12 h-12 bg-white rounded-full
                     flex items-center justify-center transition cursor-pointer">
              <i class="fas fa-play text-gray-900 text-sm ml-0.5"></i>
            </div>
          </button>
        </div>
        <h3 class="mt-2 text-white truncate">${i.title ?? ""}</h3>
      </div>
    </div>
  `
    )
    .join("");
}

function setupCarousel(sectionId, items) {
  const section = document.querySelector(`[data-section="${sectionId}"]`);
  const container = section.querySelector(".container");
  const prev = section.querySelector(".prev");
  const next = section.querySelector(".next");
  const track = section.querySelector(".track");
  const thumb = section.querySelector(".thumb");
  const CARD_WIDTH = 280;
  const ITEMS_PER_VIEW = 5;
  let index = 0;
  let dragging = false;
  let startX = 0;
  let startLeft = 0;
  const maxIndex = Math.max(0, items.length - ITEMS_PER_VIEW);

  function updateScrollbar() {
    if (items.length <= ITEMS_PER_VIEW) {
      thumb.style.width = "100%";
      thumb.style.left = "0%";
      return;
    }
    const visibleRatio = ITEMS_PER_VIEW / items.length;
    const thumbWidth = Math.max(visibleRatio * 100, 10);
    const progress = maxIndex > 0 ? index / maxIndex : 0;
    const maxLeft = 100 - thumbWidth;
    thumb.style.width = `${thumbWidth}%`;
    thumb.style.left = `${progress * maxLeft}%`;
  }

  function update() {
    index = Math.max(0, Math.min(index, maxIndex));
    container.style.transform = `translateX(-${index * CARD_WIDTH}px)`;
    updateScrollbar();
    prev.disabled = index === 0;
    next.disabled = index >= maxIndex;
    prev.style.opacity = index === 0 ? "0.5" : "1";
    next.style.opacity = index >= maxIndex ? "0.5" : "1";
  }

  function scrollToPosition(percent) {
    index = Math.round(percent * maxIndex);
    index = Math.max(0, Math.min(index, maxIndex));
    update();
  }

  prev.onclick = () => {
    if (index > 0) {
      index--;
      update();
    }
  };

  next.onclick = () => {
    if (index < maxIndex) {
      index++;
      update();
    }
  };

  track.onclick = (e) => {
    if (e.target !== track) return;
    const rect = track.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    scrollToPosition(percent);
  };

  thumb.onmousedown = (e) => {
    dragging = true;
    startX = e.clientX;
    startLeft = thumb.offsetLeft;
    document.body.style.cursor = "pointer";
    e.preventDefault();
  };

  document.onmousemove = (e) => {
    if (!dragging) return;
    const rect = track.getBoundingClientRect();
    const percent = (startLeft + e.clientX - startX) / rect.width;
    scrollToPosition(percent);
  };

  document.onmouseup = () => {
    dragging = false;
    document.body.style.cursor = "";
  };

  update();
}

function hideLoading() {
  document.querySelector("#mood-loading-overlay")?.remove();
}
