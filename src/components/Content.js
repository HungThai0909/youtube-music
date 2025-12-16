import { AlbumSection } from "./sections/home/AlbumSection";
import { MoodsSection } from "./sections/home/MoodsSection";
import { QuickPickSection } from "./sections/home/QuickPickSection";
import { TodayHitSection } from "./sections/home/TodayHitsSection";
import { VMusicSection } from "./sections/home/VMusicSection";

export const Content = () => {
  const html = `
    <div id="global-loading-overlay" class="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center transition-opacity duration-500">
      <div class="relative">
        <div class="w-16 h-16 border-4 border-gray-700 border-t-white rounded-full animate-spin"></div>
      </div>
    </div>
    <div class="bg-gray-900 min-h-screen">
      <div class="px-6 py-8">
        <div class="pl-24">
          <section>${MoodsSection.render()}</section>  
          <section>${QuickPickSection.render()}</section>
          <section>${AlbumSection.render()}</section>
          <section>${TodayHitSection.render()}</section>
          <section>${VMusicSection.render()}</section>
        </div>
      </div>
    </div>
  `;

  setTimeout(async () => {
    try {
      await Promise.all([
        MoodsSection.init(),
        QuickPickSection.init(),
        AlbumSection.init(),
        TodayHitSection.init(),
        VMusicSection.init(),
      ]);
      const overlay = document.querySelector("#global-loading-overlay");
      if (overlay) {
        overlay.style.opacity = "0";
        setTimeout(() => overlay.remove(), 500);
      }
    } catch (error) {
      console.error("Có lỗi khi tải dữ liệu trang chủ:", error);
      const overlay = document.querySelector("#global-loading-overlay");
      if (overlay) overlay.remove();
    }
  }, 0);
  return html;
};
