import { Header } from "../components/header";
import { Sidebar } from "../components/sidebar";
import { initSidebarToggle } from "./home";

let chartsRouter = null;
export const setChartsRouter = (router) => {
  chartsRouter = router;
};

const BASE_URL =
  import.meta.env.VITE_BASE_URL;

let currentCountry = "GLOBAL";
let countries = [];
let videoCharts = [];
let topArtists = [];
let videoCurrentIndex = 0;
let videoIsDragging = false;
let artistsCurrentIndex = 0;
let artistsIsDragging = false;
const fetchCountries = async () => {
  try {
    const response = await fetch(`${BASE_URL}/charts/countries`);
    const data = await response.json();
    return data.countries || [];
  } catch (error) {
    console.error("Error fetching countries:", error);
    return [];
  }
};

const fetchVideoCharts = async (country = "GLOBAL") => {
  try {
    const response = await fetch(
      `${BASE_URL}/charts/videos?country=${country}`
    );
    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error("Error fetching video charts:", error);
    return [];
  }
};

const fetchTopArtists = async (country = "GLOBAL") => {
  try {
    const response = await fetch(
      `${BASE_URL}/charts/top-artists?country=${country}`
    );
    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error("Error fetching top artists:", error);
    return [];
  }
};

const formatViews = (views) => {
  if (!views) return "0 views";
  if (views >= 1000000) {
    return `${(views / 1000000).toFixed(1)} Tr lượt xem`;
  } else if (views >= 1000) {
    return `${(views / 1000).toFixed(0)} N lượt xem`;
  }
  return `${views} lượt xem`;
};

const getVideoCarouselMetrics = () => {
  const viewport = document.querySelector("#video-charts-viewport");
  const container = document.querySelector("#video-charts-container");
  const firstCard = container?.querySelector(".w-80");
  if (!viewport || !container) {
    return { cardWidth: 320, itemsPerView: 5, viewportWidth: 1600, totalWidth: 0 };
  }
  const viewportWidth = viewport.offsetWidth;
  const gap = parseFloat(getComputedStyle(container).gap) || 24;
  const cardWidth = firstCard ? firstCard.offsetWidth : 320;
  const cardWithGap = cardWidth + gap;
  const itemsPerView = Math.floor(viewportWidth / cardWithGap);
  return {
    cardWidth: cardWithGap,
    itemsPerView,
    viewportWidth,
    totalWidth: container.scrollWidth,
  };
};

const getVideoMaxIndex = () => {
  const metrics = getVideoCarouselMetrics();
  return Math.max(0, videoCharts.length - metrics.itemsPerView);
};

const updateVideoNavigation = () => {
  const maxIndex = getVideoMaxIndex();
  const prevBtn = document.querySelector("#video-charts-prev");
  const nextBtn = document.querySelector("#video-charts-next");
  if (!prevBtn || !nextBtn) return;
  const isAtStart = videoCurrentIndex === 0;
  const isAtEnd = videoCurrentIndex >= maxIndex;
  prevBtn.disabled = isAtStart;
  prevBtn.style.opacity = isAtStart ? "0.4" : "1";
  nextBtn.disabled = isAtEnd;
  nextBtn.style.opacity = isAtEnd ? "0.4" : "1";
};

const updateVideoSlide = () => {
  const container = document.querySelector("#video-charts-container");
  if (!container) return;
  const maxIndex = getVideoMaxIndex();
  const metrics = getVideoCarouselMetrics();
  videoCurrentIndex = Math.max(0, Math.min(videoCurrentIndex, maxIndex));
  const translateX = videoCurrentIndex === maxIndex && videoCharts.length > metrics.itemsPerView
    ? metrics.totalWidth - metrics.viewportWidth
    : videoCurrentIndex * metrics.cardWidth; 
  container.style.transform = `translateX(-${translateX}px)`;
  updateVideoNavigation();
  updateVideoScrollbar();
};

const slideVideo = (dir) => {
  const maxIndex = getVideoMaxIndex();
  if (dir === "next" && videoCurrentIndex < maxIndex) {
    videoCurrentIndex++;
  }
  if (dir === "prev" && videoCurrentIndex > 0) {
    videoCurrentIndex--;
  }
  updateVideoSlide();
};

const updateVideoScrollbar = () => {
  const track = document.querySelector("#video-scrollbar-track");
  const thumb = document.querySelector("#video-scrollbar-thumb");
  if (!track || !thumb || !videoCharts.length) {
    track?.classList.add("hidden");
    return;
  }
  const metrics = getVideoCarouselMetrics();
  const maxIndex = getVideoMaxIndex();
  if (videoCharts.length <= metrics.itemsPerView) {
    track.classList.add("hidden");
    return;
  }
  track.classList.remove("hidden");
  const visibleRatio = metrics.itemsPerView / videoCharts.length;
  const thumbWidth = Math.max(visibleRatio * 100, 10);
  const progress = maxIndex > 0 ? videoCurrentIndex / maxIndex : 0;
  thumb.style.width = `${thumbWidth}%`;
  thumb.style.left = `${progress * (100 - thumbWidth)}%`;
};

const scrollVideoToPosition = (percent) => {
  const maxIndex = getVideoMaxIndex();
  videoCurrentIndex = Math.round(percent * maxIndex);
  videoCurrentIndex = Math.max(0, Math.min(videoCurrentIndex, maxIndex));
  updateVideoSlide();
};

const renderVideoCharts = () => {
  return new Promise((resolve) => {
    const container = document.querySelector("#video-charts-container");
    if (!container) return resolve();
    container.innerHTML = "";
    if (videoCharts.length === 0) return resolve();
    let loadedImages = 0;
    const checkAllLoaded = () => {
      loadedImages++;
      if (loadedImages === videoCharts.length) resolve();
    };
    videoCharts.forEach((video) => {
      const card = document.createElement("div");
      card.className = "flex-shrink-0 w-80 cursor-pointer";
      card.innerHTML = `
        <div class="group">
          <div class="relative">
            <img
              src="${video.thumb || 'https://via.placeholder.com/400x225'}"
              alt="${video.title}"
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
            ${video.title}
          </h3>
          <p class="text-gray-400 text-sm">
            ${formatViews(video.views)}
          </p>
        </div>
      `;
      card.addEventListener("click", () => {
        if (chartsRouter) {
          chartsRouter.navigate(`/video/details/${video.videoId}`);
        }
      });
      const img = card.querySelector("img");
      if (img) {
        img.onload = checkAllLoaded;
        img.onerror = checkAllLoaded;
      }
      container.appendChild(card);
    });
    if (videoCharts.every((v) => !v.thumb)) resolve();
  });
};

const setupVideoCarouselListeners = () => {
  const prev = document.querySelector("#video-charts-prev");
  const next = document.querySelector("#video-charts-next");
  const track = document.querySelector("#video-scrollbar-track");
  const thumb = document.querySelector("#video-scrollbar-thumb");
  prev?.addEventListener("click", () => slideVideo("prev"));
  next?.addEventListener("click", () => slideVideo("next"));
  track?.addEventListener("click", (e) => {
    const rect = track.getBoundingClientRect();
    scrollVideoToPosition((e.clientX - rect.left) / rect.width);
  });
  let startX = 0, startLeft = 0;
  thumb?.addEventListener("mousedown", (e) => {
    videoIsDragging = true;
    startX = e.clientX;
    startLeft = thumb.offsetLeft;
    e.preventDefault();
  });
  
  document.addEventListener("mousemove", (e) => {
    if (!videoIsDragging) return;
    const rect = track.getBoundingClientRect();
    const thumbWidth = thumb.offsetWidth;
    const maxLeft = rect.width - thumbWidth;
    const newLeft = Math.max(0, Math.min(startLeft + e.clientX - startX, maxLeft));
    const percent = newLeft / maxLeft;
    scrollVideoToPosition(percent);
  });
  
  document.addEventListener("mouseup", () => {
    videoIsDragging = false;
  });
  
  let resizeTimeout;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      updateVideoSlide();
      updateArtistsSlide();
    }, 150);
  });
};

const getArtistsCarouselMetrics = () => {
  const viewport = document.querySelector("#artists-charts-viewport");
  const container = document.querySelector("#artists-charts-container");
  const firstCard = container?.querySelector(".artist-card");
  if (!viewport || !container) {
    return { cardHeight: 76, itemsPerView: 5, viewportHeight: 380, totalHeight: 0 };
  }
  const viewportHeight = viewport.offsetHeight;
  const gap = parseFloat(getComputedStyle(container).gap) || 8;
  const cardHeight = firstCard ? firstCard.offsetHeight : 76;
  const cardWithGap = cardHeight + gap;
  const itemsPerView = Math.floor(viewportHeight / cardWithGap);
  return {
    cardHeight: cardWithGap,
    itemsPerView,
    viewportHeight,
    totalHeight: container.scrollHeight,
  };
};

const getArtistsMaxIndex = () => {
  const metrics = getArtistsCarouselMetrics();
  return Math.max(0, topArtists.length - metrics.itemsPerView);
};

const updateArtistsNavigation = () => {
  const maxIndex = getArtistsMaxIndex();
  const prevBtn = document.querySelector("#artists-charts-prev");
  const nextBtn = document.querySelector("#artists-charts-next");
  if (!prevBtn || !nextBtn) return;
  const isAtStart = artistsCurrentIndex === 0;
  const isAtEnd = artistsCurrentIndex >= maxIndex;
  prevBtn.disabled = isAtStart;
  prevBtn.style.opacity = isAtStart ? "0.4" : "1"; 
  nextBtn.disabled = isAtEnd;
  nextBtn.style.opacity = isAtEnd ? "0.4" : "1";
};

const updateArtistsSlide = () => {
  const container = document.querySelector("#artists-charts-container");
  if (!container) return;
  const maxIndex = getArtistsMaxIndex();
  const metrics = getArtistsCarouselMetrics();
  artistsCurrentIndex = Math.max(0, Math.min(artistsCurrentIndex, maxIndex));
  const translateY = artistsCurrentIndex === maxIndex && topArtists.length > metrics.itemsPerView
    ? metrics.totalHeight - metrics.viewportHeight
    : artistsCurrentIndex * metrics.cardHeight;
  container.style.transform = `translateY(-${translateY}px)`;
  updateArtistsNavigation();
  updateArtistsScrollbar();
};

const slideArtists = (dir) => {
  const maxIndex = getArtistsMaxIndex();
  if (dir === "next" && artistsCurrentIndex < maxIndex) {
    artistsCurrentIndex++;
  }
  if (dir === "prev" && artistsCurrentIndex > 0) {
    artistsCurrentIndex--;
  }
  updateArtistsSlide();
};

const updateArtistsScrollbar = () => {
  const track = document.querySelector("#artists-scrollbar-track");
  const thumb = document.querySelector("#artists-scrollbar-thumb");
  if (!track || !thumb || !topArtists.length) {
    track?.classList.add("hidden");
    return;
  }
  const metrics = getArtistsCarouselMetrics();
  const maxIndex = getArtistsMaxIndex();
  if (topArtists.length <= metrics.itemsPerView) {
    track.classList.add("hidden");
    return;
  }
  track.classList.remove("hidden");
  const visibleRatio = metrics.itemsPerView / topArtists.length;
  const thumbHeight = Math.max(visibleRatio * 100, 10);
  const progress = maxIndex > 0 ? artistsCurrentIndex / maxIndex : 0;
  thumb.style.height = `${thumbHeight}%`;
  thumb.style.top = `${progress * (100 - thumbHeight)}%`;
};

const scrollArtistsToPosition = (percent) => {
  const maxIndex = getArtistsMaxIndex();
  artistsCurrentIndex = Math.round(percent * maxIndex);
  artistsCurrentIndex = Math.max(0, Math.min(artistsCurrentIndex, maxIndex));
  updateArtistsSlide();
};

const renderTopArtists = () => {
  if (!topArtists || topArtists.length === 0) {
    return '<div class="text-center text-gray-400 py-8">Không có dữ liệu</div>';
  }
  const getChangeIcon = (trend, delta) => {
    if (trend === "up" || delta > 0) {
      return '<i class="fas fa-caret-up text-green-500"></i>';
    }
    if (trend === "down" || delta < 0) {
      return '<i class="fas fa-caret-down text-red-500"></i>';
    }
    return '<span class="text-gray-500"></span>';
  };

  const formatArtistViews = (views) => {
    if (!views) return "0 views";
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)} Tr views`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(0)} N views`;
    }
    return `${views} views`;
  };

  return topArtists
    .map(
      (artist) => `
    <div class="artist-card flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group"
         data-artist-id="${artist.artistId}">
      <div class="flex items-center gap-4 flex-1">
        <span class="text-white font-bold text-xl w-8 text-center">${
          artist.rank
        }</span>
        <div class="w-2">${getChangeIcon(artist.trend, artist.delta)}</div>
        <div class="flex items-center justify-center text-white font-bold text-lg">
        </div>
        <div class="flex-1">
          <h4 class="text-white font-semibold transition-colors">
            ${artist.name}
          </h4>
          <p class="text-gray-400 text-sm">${formatArtistViews(
            artist.totalViews
          )}</p>
        </div>
      </div>
    </div>
  `
    )
    .join("");
};

const setupArtistsCarouselListeners = () => {
  const prev = document.querySelector("#artists-charts-prev");
  const next = document.querySelector("#artists-charts-next");
  const track = document.querySelector("#artists-scrollbar-track");
  const thumb = document.querySelector("#artists-scrollbar-thumb");
  prev?.addEventListener("click", () => slideArtists("prev"));
  next?.addEventListener("click", () => slideArtists("next"));
  track?.addEventListener("click", (e) => {
    const rect = track.getBoundingClientRect();
    scrollArtistsToPosition((e.clientY - rect.top) / rect.height);
  });
  
  let startY = 0, startTop = 0;
  thumb?.addEventListener("mousedown", (e) => {
    artistsIsDragging = true;
    startY = e.clientY;
    startTop = thumb.offsetTop;
    e.preventDefault();
  });
  
  document.addEventListener("mousemove", (e) => {
    if (!artistsIsDragging) return;
    const rect = track.getBoundingClientRect();
    const thumbHeight = thumb.offsetHeight;
    const maxTop = rect.height - thumbHeight;
    const newTop = Math.max(0, Math.min(startTop + e.clientY - startY, maxTop));
    const percent = newTop / maxTop;
    scrollArtistsToPosition(percent);
  });
  
  document.addEventListener("mouseup", () => {
    artistsIsDragging = false;
  });
};

const renderCountriesDropdown = () => {
  if (!countries || countries.length === 0) {
    return '<button class="w-full px-4 py-2 text-left text-white hover:bg-white/10 transition-colors">Global</button>';
  }
  return countries
    .map(
      (country) => `
    <button 
      class="w-full px-4 py-2 text-left text-white hover:bg-white/10 transition-colors country-option cursor-pointer"
      data-country-code="${country.code}"
    >
      ${country.name}
    </button>
  `
    )
    .join("");
};

export const Charts = () => {
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
      <main class="flex-1 bg-gray-900 overflow-y-auto h-[calc(100vh-64px)]">
        <div class="px-6 py-8 max-w-[1800px] mx-auto">
          <div class="pl-24">
            <div class="mb-6">
              <h1 class="text-white text-5xl font-bold">Bảng xếp hạng</h1>
            </div>
            <div class="mb-12 relative">
              <button 
                id="region-dropdown-btn"
                class="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors cursor-pointer">
                <span class="text-white font-medium text-sm" id="current-region">Global</span>
                <i class="fas fa-chevron-down text-white text-xs"></i>
              </button>
              <div 
                id="region-dropdown-menu"
                class="hidden absolute left-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-xl overflow-hidden z-10 max-h-96 overflow-y-auto">
                <div class="py-1" id="countries-list">
                  <div class="px-4 py-8 text-center text-gray-400">
                    <i class="fas fa-spinner fa-spin"></i> Loading...
                  </div>
                </div>
              </div>
            </div>
            <section class="mb-16">
              <div class="flex items-center justify-between mb-6">
                <h2 class="text-white text-5xl font-bold">Bảng xếp hạng video</h2>
                <div class="flex gap-3">
                  <button id="video-charts-prev"
                    class="w-9 h-9 rounded-full bg-gray-800 hover:bg-gray-700
                           text-gray-400 hover:text-white flex items-center justify-center cursor-pointer">
                    <i class="fas fa-chevron-left"></i>
                  </button>
                  <button id="video-charts-next"
                    class="w-9 h-9 rounded-full bg-gray-800 hover:bg-gray-700
                           text-gray-400 hover:text-white flex items-center justify-center cursor-pointer">
                    <i class="fas fa-chevron-right"></i>
                  </button>
                </div>
              </div>
              <div class="relative overflow-hidden h-[245px]" id="video-charts-viewport">
                <div id="video-charts-container"
                  class="flex gap-6 transition-transform duration-500 ease-in-out">
                </div>
              </div>
              <div class="h-5 mt-4">
                <div id="video-scrollbar-track"
                  class="h-1 bg-white/10 rounded-full relative cursor-pointer hidden">
                  <div id="video-scrollbar-thumb"
                    class="absolute top-1/2 -translate-y-1/2
                           h-1 bg-white/40 rounded-full
                           transition-all duration-300 cursor-pointer w-1/5 left-0">
                  </div>
                </div>
              </div>
            </section>
            <section class="mb-12">
              <div class="flex items-center justify-between mb-6">
                <h2 class="text-white text-5xl font-bold">Nghệ sĩ hàng đầu</h2>
                <div class="flex gap-3">
                  <button id="artists-charts-prev"
                    class="w-9 h-9 rounded-full bg-gray-800 hover:bg-gray-700
                           text-gray-400 hover:text-white flex items-center justify-center cursor-pointer">
                    <i class="fas fa-chevron-up"></i>
                  </button>
                  <button id="artists-charts-next"
                    class="w-9 h-9 rounded-full bg-gray-800 hover:bg-gray-700
                           text-gray-400 hover:text-white flex items-center justify-center cursor-pointer">
                    <i class="fas fa-chevron-down"></i>
                  </button>
                </div>
              </div>
              <div class="flex gap-4 h-[500px]">
                <div class="flex-1 relative overflow-hidden" id="artists-charts-viewport">
                  <div id="artists-charts-container"
                    class="flex flex-col gap-2 transition-transform duration-500 ease-in-out">
                  </div>
                </div>
                <div class="w-5">
                  <div id="artists-scrollbar-track"
                    class="w-1 bg-white/10 rounded-full relative cursor-pointer hidden h-full">
                    <div id="artists-scrollbar-thumb"
                      class="absolute left-1/2 -translate-x-1/2
                             w-1 bg-white/40 rounded-full
                             transition-all duration-300 cursor-pointer h-1/5 top-0">
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  `;

  app.innerHTML = html;
  setTimeout(async () => {
    await initializePage();
    initSidebarToggle();
  }, 0);
};

const initializePage = async () => {
  try {
    countries = await fetchCountries();
    const currentCountryData = countries.find((c) => c.code === currentCountry);
    const currentRegionEl = document.querySelector("#current-region");
    if (currentRegionEl && currentCountryData) {
      currentRegionEl.textContent = currentCountryData.name;
    }
    setupDropdownButton();
    await loadChartsData(currentCountry, true);
    setupVideoCarouselListeners();
    setupArtistsCarouselListeners();
  } catch (error) {
    console.error("Error initializing page:", error);
    const overlay = document.querySelector("#global-loading-overlay");
    if (overlay) {
      overlay.style.opacity = "0";
      setTimeout(() => overlay.remove(), 500);
    }
  }
};

const setupDropdownButton = () => {
  const dropdownBtn = document.querySelector("#region-dropdown-btn");
  const dropdownMenu = document.querySelector("#region-dropdown-menu");
  if (!dropdownBtn || !dropdownMenu) return;
  const countriesList = document.querySelector("#countries-list");
  if (countriesList && countries.length > 0) {
    countriesList.innerHTML = renderCountriesDropdown();
    setupCountrySelection(dropdownMenu);
  }
  dropdownBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdownMenu.classList.toggle("hidden");
  });

  document.addEventListener("click", (e) => {
    if (!dropdownMenu.contains(e.target) && !dropdownBtn.contains(e.target)) {
      dropdownMenu.classList.add("hidden");
    }
  });
};

const setupCountrySelection = (dropdownMenu) => {
  const handleCountryClick = async (e) => {
    const btn = e.target.closest(".country-option");
    if (!btn) return;
    const countryCode = btn.dataset.countryCode;
    const countryName = btn.textContent.trim();
    const currentRegionEl = document.querySelector("#current-region");
    if (currentRegionEl) {
      currentRegionEl.textContent = countryName;
    }
    dropdownMenu.classList.add("hidden");
    currentCountry = countryCode;
    videoCurrentIndex = 0;
    artistsCurrentIndex = 0;
    await loadChartsData(countryCode, false);
  };

  const countriesList = document.querySelector("#countries-list");
  if (countriesList) {
    countriesList.addEventListener("click", handleCountryClick);
  }
};

const loadChartsData = async (country, isInitialLoad = false) => {
  const videoContainer = document.querySelector("#video-charts-container");
  const artistsContainer = document.querySelector("#artists-charts-container");
  if (!isInitialLoad) {
    if (videoContainer) {
      videoContainer.innerHTML = `
        <div class="col-span-full flex justify-center py-12 w-full">
          <div class="w-12 h-12 border-4 border-gray-700 border-t-white rounded-full animate-spin"></div>
        </div>
      `;
    }
    if (artistsContainer) {
      artistsContainer.innerHTML = `
        <div class="flex justify-center py-12">
          <div class="w-12 h-12 border-4 border-gray-700 border-t-white rounded-full animate-spin"></div>
        </div>
      `;
    }
  }

  try {
    const [videos, artists] = await Promise.all([
      fetchVideoCharts(country),
      fetchTopArtists(country),
    ]);
    videoCharts = videos;
    topArtists = artists;
    if (videoContainer) {
      await renderVideoCharts();
      requestAnimationFrame(() => {
        updateVideoNavigation();
        updateVideoScrollbar();
      });
    }
    if (artistsContainer) {
      artistsContainer.innerHTML = renderTopArtists();
      requestAnimationFrame(() => {
        updateArtistsNavigation();
        updateArtistsScrollbar();
      });
    }
    if (isInitialLoad) {
      const overlay = document.querySelector("#global-loading-overlay");
      if (overlay) {
        overlay.style.opacity = "0";
        setTimeout(() => overlay.remove(), 500);
      }
    }
  } catch (error) {
    console.error("Error loading charts data:", error);
    if (videoContainer) {
      videoContainer.innerHTML =
        '<div class="col-span-full text-center text-red-400 py-8">Lỗi tải dữ liệu</div>';
    }
    if (artistsContainer) {
      artistsContainer.innerHTML =
        '<div class="text-center text-red-400 py-8">Lỗi tải dữ liệu</div>';
    }

    if (isInitialLoad) {
      const overlay = document.querySelector("#global-loading-overlay");
      if (overlay) {
        overlay.style.opacity = "0";
        setTimeout(() => overlay.remove(), 500);
      }
    }
  }
};