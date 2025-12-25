import { Header } from "../components/header";
import { AlbumSection } from "../components/sections/explore/AlbumSection";
import { CategorySection } from "../components/sections/explore/CategorySection";
import { MetaSection } from "../components/sections/explore/MetaSection";
import { VideoSection } from "../components/sections/explore/VideoSection";
import { Sidebar } from "./components/Sidebar";
import { initSidebarToggle } from "./home";
import { initSearchHandler } from "../utils/initSearchHandler";

export const explore = () => {
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

      <main class="flex-1 bg-gray-900">
        <div class="px-6 py-8 max-w-[1400px] mx-auto">
          <div class="pl-24">
            <section class="mb-24 mt-12">${CategorySection.render()}</section>
            <section class="mb-24">${AlbumSection.render()}</section>
            <section class="mb-24">${MetaSection.render()}</section>
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
        CategorySection.init(),
        AlbumSection.init(),
        MetaSection.init(),
        VideoSection.init(),
      ]);
      const overlay = document.querySelector("#global-loading-overlay");
      if (overlay) {
        overlay.style.opacity = "0";
        setTimeout(() => overlay.remove(), 500);
      }
    } catch (err) {
      console.error("Explore load error:", err);
      document.querySelector("#global-loading-overlay")?.remove();
    }
  }, 0);
  initSidebarToggle();
  initSearchHandler();
};
