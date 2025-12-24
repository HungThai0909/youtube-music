import { AlbumSection } from "./sections/home/AlbumSection";
import { MoodsSection } from "./sections/home/MoodsSection";
import { PersonalizedSection } from "./sections/home/PersonalizedSection";
import { QuickPickSection } from "./sections/home/QuickPickSection";
import { TodayHitSection } from "./sections/home/TodayHitsSection";
import { VMusicSection } from "./sections/home/VMusicSection";

export const Content = () => {
  const isLoggedIn = !!localStorage.getItem("access_token");
  
  const html = `
    <div id="global-loading-overlay" class="fixed inset-0 z-[100] bg-black/60 flex flex-col items-center justify-center transition-opacity duration-500">
      <div class="relative">
        <div class="w-16 h-16 border-4 border-gray-700 border-t-white rounded-full animate-spin"></div>
      </div>
    </div>
    <div class="bg-gray-900 max-w-[1400px]">
      <div class="px-6 py-8">
        <div class="pl-24">
          <section>${MoodsSection.render()}</section>  
          ${isLoggedIn ? `<section>${PersonalizedSection.render()}</section>` : ''}
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
      const initPromises = [
        MoodsSection.init(null, { hideLoading: true }),
        QuickPickSection.init(null, { hideLoading: true }), 
        AlbumSection.init({ hideLoading: true }),
        TodayHitSection.init({ hideLoading: true }),
        VMusicSection.init({ hideLoading: true }),
      ];
      if (isLoggedIn) {
        initPromises.splice(1, 0, PersonalizedSection.init({ hideLoading: true }));
      }

      await Promise.all(initPromises);
      
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