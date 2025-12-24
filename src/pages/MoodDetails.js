import { Header } from "../components/header";
import { Sidebar } from "../components/sidebar";
import { initSidebarToggle } from "./home";
import { initSearchHandler } from "../utils/initSearchHandler";
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
      <main class="flex-1 max-w-[1400px]">
        <div id="mood-loading-overlay" class="fixed inset-0 z-[100] bg-black/60
                 flex items-center justify-center">
          <div class="w-16 h-16 border-4 border-gray-700
                   border-t-white rounded-full animate-spin"></div>
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
  initSearchHandler();
  initPage(moodSlug);
};

export const setMoodDetailRouter = (router) => {
  currentRouter = router;
};

async function initPage(slug) {
  try {
    const moodButtonsEl = document.querySelector("#mood-buttons");
    moodButtonsEl.innerHTML = MoodsSection.render();
    if (currentRouter) MoodsSection.setRouter(currentRouter);
    const quickPicksEl = document.querySelector("#quick-picks");
    quickPicksEl.innerHTML = QuickPickSection.render();
    if (currentRouter) QuickPickSection.setRouter(currentRouter);
    const moodsPromise = MoodsSection.init(slug, { hideLoading: true });
    const quickPickPromise = QuickPickSection.init(slug, { hideLoading: true });
    const moodDataPromise = fetchMoodData(slug, { hideLoading: true });
    await Promise.all([moodsPromise, quickPickPromise, moodDataPromise]);
    hidePageLoading();
  } catch (e) {
    console.error(e);
    hidePageLoading();
  }
}

async function fetchMoodData(slug, options = {}) {
  const hideLoadingFlag = options.hideLoading === true;
  const header = document.querySelector("#mood-header");
  const sections = document.querySelector("#mood-sections");
  const res = await fetch(`${import.meta.env.VITE_BASE_URL}/moods/${slug}`);
  if (!res.ok) throw new Error("Fetch mood failed");
  const data = await res.json();
  header.innerHTML = `
    <h1 class="text-5xl font-bold text-white mb-2">
      ${data.hero?.title ?? ""}
    </h1>
    <p class="text-gray-300">
      ${data.hero?.subtitle ?? ""}
    </p>
  `;
  const imgPromises = [];
  for (const s of data.sections) {
    if (s.type === "carousel") {
      const html = renderSection(s, { hideLoading: hideLoadingFlag });
      sections.insertAdjacentHTML("beforeend", html);
      const itemsPromise = setupCarousel(s.id, s.items, {
        hideLoading: hideLoadingFlag,
      });
      imgPromises.push(itemsPromise);
      setupPlaylistNavigation(s.id);
    }
  }
  await Promise.all(imgPromises);
}

function renderSection(section, options = {}) {
  if (section.type !== "carousel") return "";
  const hideLoading = options.hideLoading === true;
  return `
    <section class="mb-10" data-section="${section.id}">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-5xl font-bold text-white">${section.title}</h2>
        <div class="flex gap-4">
          <button class="prev w-10 h-10 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-full cursor-pointer flex items-center justify-center">
            <i class="fas fa-chevron-left"></i>
          </button>
          <button class="next w-10 h-10 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-full cursor-pointer flex items-center justify-center">
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>
      <div class="relative overflow-hidden viewport">
        <div class="container flex gap-4 transition-transform duration-500 ease-in-out">
          ${renderPlaceholders()}
        </div>
      </div>
      <div class="h-5 mt-4">
        <div class="track h-1 bg-gray-700 rounded-full relative cursor-pointer hidden">
          <div class="thumb absolute top-1/2 -translate-y-1/2 h-1 bg-gray-400 rounded-full transition-all duration-300 cursor-pointer w-1/5 left-0"></div>
        </div>
      </div>
    </section>
  `;
}

function renderPlaceholders() {
  return Array(5)
    .fill("")
    .map(
      () => `
    <div class="w-64 flex-shrink-0 opacity-0">
      <div class="w-full aspect-square rounded-lg bg-gray-800"></div>
      <div class="mt-2 h-5 bg-gray-800 rounded w-3/4"></div>
    </div>
  `
    )
    .join("");
}

function renderItems(items = []) {
  return items
    .map(
      (i) => `
      <div class="w-64 flex-shrink-0">
        <div class="group cursor-pointer" data-playlist-slug="${i.slug ?? ""}">
          <div class="relative">
            <img src="${
              i.thumbnails?.[0] ?? ""
            }" class="w-full aspect-square rounded-lg object-cover"/>
            <button class="play-btn absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition rounded-lg cursor-pointer">
              <div class="w-12 h-12 bg-white rounded-full flex items-center justify-center">
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

function setupPlaylistNavigation(sectionId) {
  const section = document.querySelector(`[data-section="${sectionId}"]`);
  if (!section) return;
  section.querySelectorAll("[data-playlist-slug]").forEach((card) => {
    const slug = card.dataset.playlistSlug;
    card.addEventListener("click", () => {
      if (currentRouter && slug) {
        currentRouter.navigate(`/playlist/details/${slug}`);
      }
    });
  });
  section.querySelectorAll(".play-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const card = btn.closest("[data-playlist-slug]");
      const slug = card?.dataset.playlistSlug;
      if (currentRouter && slug) {
        currentRouter.navigate(`/playlist/details/${slug}`);
      }
    });
  });
}

function setupCarousel(sectionId, items, options = {}) {
  const hideLoading = options.hideLoading === true;
  return new Promise((resolve) => {
    const section = document.querySelector(`[data-section="${sectionId}"]`);
    if (!section) return resolve();
    const container = section.querySelector(".container");
    const viewport = section.querySelector(".viewport");
    const prev = section.querySelector(".prev");
    const next = section.querySelector(".next");
    const track = section.querySelector(".track");
    const thumb = section.querySelector(".thumb");
    let index = 0;
    let isDragging = false;
    container.innerHTML = renderItems(items);
    const images = container.querySelectorAll("img");
    let loadedCount = 0;
    const totalImages = images.length;
    if (totalImages === 0) return resolve();
    images.forEach((img) => {
      const checkLoaded = () => {
        loadedCount++;
        if (loadedCount === totalImages) {
          requestAnimationFrame(() => {
            updateScrollbar();
            resolve();
          });
        }
      };
      if (img.complete) {
        checkLoaded();
      } else {
        img.onload = checkLoaded;
        img.onerror = checkLoaded;
      }
    });

    function getMetrics() {
      const firstCard = container.querySelector(".w-64");
      const gap = 16;
      const cardWidth = firstCard ? firstCard.offsetWidth : 256;
      const viewportWidth = viewport.offsetWidth;
      const perView = Math.floor(viewportWidth / (cardWidth + gap));
      return {
        cardWidth: cardWidth + gap,
        perView,
        viewportWidth,
        totalWidth: container.scrollWidth,
      };
    }

    function getMaxIndex() {
      const { perView } = getMetrics();
      return Math.max(0, items.length - perView);
    }

    function update() {
      const metrics = getMetrics();
      const max = getMaxIndex();
      index = Math.max(0, Math.min(index, max));
      const translateX =
        index === max && items.length > metrics.perView
          ? metrics.totalWidth - metrics.viewportWidth
          : index * metrics.cardWidth;
      container.style.transform = `translateX(-${translateX}px)`;
      prev.disabled = index === 0;
      next.disabled = index === max;
      prev.style.opacity = prev.disabled ? "0.4" : "1";
      next.style.opacity = next.disabled ? "0.4" : "1";
      updateScrollbar();
    }

    function updateScrollbar() {
      if (!track || !thumb || items.length === 0) {
        track.classList.add("hidden");
        return;
      }
      const metrics = getMetrics();
      const max = getMaxIndex();
      if (items.length <= metrics.perView) {
        track.classList.add("hidden");
        return;
      }
      track.classList.remove("hidden");
      const visibleRatio = metrics.perView / items.length;
      const thumbWidth = Math.max(visibleRatio * 100, 10);
      const progress = max ? index / max : 0;
      thumb.style.width = `${thumbWidth}%`;
      thumb.style.left = `${progress * (100 - thumbWidth)}%`;
    }

    function scrollToPosition(percent) {
      const max = getMaxIndex();
      index = Math.round(percent * max);
      update();
    }

    prev.onclick = () => {
      index--;
      update();
    };

    next.onclick = () => {
      index++;
      update();
    };

    track.addEventListener("click", (e) => {
      const rect = track.getBoundingClientRect();
      scrollToPosition((e.clientX - rect.left) / rect.width);
    });
    let startX = 0,
      startLeft = 0;
    thumb.addEventListener("mousedown", (e) => {
      isDragging = true;
      startX = e.clientX;
      startLeft = thumb.offsetLeft;
      e.preventDefault();
    });

    document.addEventListener("mousemove", (e) => {
      if (!isDragging) return;
      const rect = track.getBoundingClientRect();
      const thumbWidth = thumb.offsetWidth;
      const maxLeft = rect.width - thumbWidth;
      const newLeft = Math.max(
        0,
        Math.min(startLeft + e.clientX - startX, maxLeft)
      );
      const percent = newLeft / maxLeft;
      scrollToPosition(percent);
    });

    document.addEventListener("mouseup", () => {
      isDragging = false;
    });

    window.addEventListener("resize", () => update());

    update();
  });
}

function hidePageLoading() {
  document.querySelector("#mood-loading-overlay")?.remove();
}
