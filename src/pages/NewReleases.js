import { Header } from "../components/header";
import { Sidebar } from "../components/sidebar";
import { initSidebarToggle } from "./home";
import { initSearchHandler } from "../utils/initSearchHandler";
import { AlbumSection } from "../components/sections/explore/new-releases/AblumSection";
import { VideoSection } from "../components/sections/explore/VideoSection";

export const NewReleases = () => {
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
            <section class="mb-24">${AlbumSection.render()}</section>
            <section class="mb-24">${VideoSection.render()}</section>
          </div>
        </div>
      </main>
    </div>
  `;

  app.innerHTML = html;
  setTimeout(async () => {
    try {
      await Promise.all([
        AlbumSection.init({ hideLoading: true }),
        VideoSection.init({ hideLoading: true }),
      ]);
      const overlay = document.querySelector("#global-loading-overlay");
      if (overlay) {
        overlay.style.opacity = "0";
        setTimeout(() => overlay.remove(), 500);
      }
    } catch (err) {
      console.error("New Releases load error:", err);
      document.querySelector("#global-loading-overlay")?.remove();
    }
  }, 0);
  initSidebarToggle();
  initSearchHandler();
};

export let newReleasesRouter = null;
export const setNewReleasesRouter = (routerInstance) => {
  newReleasesRouter = routerInstance;
  AlbumSection.setRouter(routerInstance);
  VideoSection.setRouter(routerInstance);
};
