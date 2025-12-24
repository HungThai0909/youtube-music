import { Header } from "../components/header";
import { Sidebar } from "../components/sidebar";
import { initSidebarToggle } from "./home";
import { initSearchHandler } from "../utils/initSearchHandler";
import { LineSongSection } from "../components/sections/line/SongSection";
import { LinePlaylistSection } from "../components/sections/line/PlaylistSection";
import { LineVideoSection } from "../components/sections/line/VideoSection";
import { LineAlbumSection } from "../components/sections/line/AlbumSection";

let router = null;
export const setLineDetailRouter = (routerInstance) => {
  router = routerInstance;
  LineSongSection.setRouter(router);
  LinePlaylistSection.setRouter(router);
  LineVideoSection.setRouter(router);
  LineAlbumSection.setRouter(router);
};

export const LineDetail = (match) => {
  const app = document.querySelector("#app");
  const lineSlug = match?.data?.id;
  LineSongSection.setLineSlug(lineSlug);
  LinePlaylistSection.setLineSlug(lineSlug);
  LineVideoSection.setLineSlug(lineSlug);
  LineAlbumSection.setLineSlug(lineSlug);
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
            <section class="mb-24 mt-30">${LineSongSection.render()}</section>
            <section class="mb-24">${LinePlaylistSection.render()}</section>
            <section class="mb-24">${LineVideoSection.render()}</section>
            <section class="mb-24">${LineAlbumSection.render()}</section>
          </div>
        </div>
      </main>
    </div>
  `;

  app.innerHTML = html;
  initSidebarToggle();
  initSearchHandler();
  setTimeout(async () => {
    try {
      await Promise.all([
        LineSongSection.init({ hideLoading: true }),
        LinePlaylistSection.init({ hideLoading: true }),
        LineVideoSection.init({ hideLoading: true }),
        LineAlbumSection.init({ hideLoading: true }),
      ]);
      const overlay = document.querySelector("#global-loading-overlay");
      if (overlay) {
        overlay.style.opacity = "0";
        setTimeout(() => overlay.remove(), 500);
      }
    } catch (err) {
      console.error("Line detail load error:", err);
      document.querySelector("#global-loading-overlay")?.remove();
    }
  }, 0);
};