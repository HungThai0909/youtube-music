export const Sidebar = () => {
  return `
    <div class="fixed top-[64px] left-0 w-22 bg-black flex flex-col items-center py-6 h-[calc(100vh-64px)] z-40">
      <div class="flex flex-col">
        <a href="/" data-navigo class="flex flex-col items-center hover:bg-zinc-800 rounded-2xl px-3 py-2 cursor-pointer">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center">
            <i class="fa-regular fa-house text-xl text-white"></i>
          </div>
          <span class="text-white text-xs font-medium">Trang chủ</span>
        </a>
        <a href="/explore" data-navigo class="flex flex-col items-center hover:bg-zinc-800 rounded-2xl px-3 py-2 cursor-pointer transition-colors">
          <div class="w-10 h-10 flex items-center justify-center">
            <i class="fa-regular fa-compass text-xl text-white"></i>
          </div>
          <span class="text-white text-xs font-medium">Khám phá</span>
        </a>
        <div class="flex flex-col items-center hover:bg-zinc-800 rounded-2xl px-3 py-2 cursor-pointer transition-colors">
          <div class="w-10 h-10 flex items-center justify-center">
            <i class="fa-regular fa-bookmark text-xl text-white"></i>
          </div>
          <span class="text-white text-xs font-medium">Thư viện</span>
        </div>
      </div>
      <div class="w-16 h-px bg-zinc-700 my-3"></div>
      <div class="flex flex-col items-center hover:bg-zinc-800 rounded-2xl px-3 py-2 cursor-pointer transition-colors">
        <div class="w-10 h-10 flex items-center justify-center">
          <i class="fa-regular fa-user text-xl text-white"></i>
        </div>
        <span class="text-white text-xs font-medium">Đăng nhập</span>
      </div>
    </div>

    <aside id="extendedSidebar" class="fixed top-0 left-0 w-[266px] bg-[#030303] h-screen z-[60] transform -translate-x-full transition-transform duration-300 overflow-y-auto">
      <div class="flex items-center gap-3 px-4 py-5">
        <button id="closeSidebarBtn" class="p-2 hover:bg-zinc-800 rounded-full transition-colors cursor-pointer">
          <i class="fas fa-xmark text-2xl text-white"></i>
        </button>
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
            <i class="fas fa-play text-white text-sm"></i>
          </div>
          <span class="text-xl font-medium text-white">Music</span>
        </div>
      </div>
      
      <nav class="px-3 mt-2">
        <a href="/" data-navigo class="sidebar-link flex items-center gap-5 px-4 py-3 text-white hover:bg-zinc-800 transition-colors rounded-full mb-1">
          <i class="fa-regular fa-house text-xl text-white"></i>
          <span class="font-medium text-base">Trang chủ</span>
        </a>
        <a href="/explore" data-navigo class="sidebar-link flex items-center gap-5 px-4 py-3 text-white hover:bg-zinc-800 transition-colors rounded-full mb-1">
          <i class="fa-regular fa-compass text-xl text-white"></i>
          <span class="font-medium text-base">Khám phá</span>
        </a>
        <a href="#" class="sidebar-link flex items-center gap-5 px-4 py-3 text-white hover:bg-zinc-800 transition-colors rounded-full mb-1">
          <i class="fa-regular fa-bookmark text-xl text-white"></i>
          <span class="font-medium text-base">Thư viện</span>
        </a>
        <div class="h-px bg-zinc-800 my-3 mx-2"></div>
        <a href="#" class="sidebar-link flex items-center gap-5 px-4 py-3 text-white hover:bg-zinc-800 transition-colors rounded-full mb-1">
          <i class="fas fa-crown text-2xl"></i>
          <span class="font-medium text-base">Nâng cấp</span>
        </a>
      </nav>
      <div class="px-5 mt-6">
        <button class="w-full bg-white text-black font-medium py-2.5 rounded-full hover:bg-gray-200 transition-colors text-sm mb-3">
          Đăng nhập
        </button>
        <p class="text-white text-xs leading-relaxed px-2">
          Đăng nhập để tạo và chia sẻ danh sách phát, nhận nội dung đề xuất dành riêng cho bạn.
        </p>
      </div>
    </aside>
  `;
};