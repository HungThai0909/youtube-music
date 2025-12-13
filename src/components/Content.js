import { AlbumSection } from "./sections/AlbumSection";
import { MoodsSection } from "./sections/MoodsSection";
import { QuickPickSection } from "./sections/QuickPickSection";
import { TodayHitSection } from "./sections/TodayHits";
import { VMusicSection } from "./sections/VMusicSection";

export const Content = () => {
  const html = `
    <div class="bg-gray-900 min-h-screen">
      <div class="px-6 py-8">
        <div class="pl-24">
          <section class="mt-20">${MoodsSection.render()}</section>  
          <section class="mt-20">${QuickPickSection.render()}</section>
          <section class="mt-20">${AlbumSection.render()}</section>
          <section class="mt-20">${TodayHitSection.render()}</section>
          <section class="mt-20">${VMusicSection.render()}</section>
        </div>
      </div>
    </div>
  `;

  setTimeout(() => {
    MoodsSection.init();
    QuickPickSection.init();
    AlbumSection.init();
    TodayHitSection.init();
    VMusicSection.init();
  });

  return html;
};
