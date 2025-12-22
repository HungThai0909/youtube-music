export const Header = () => {
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
  const getInitial = (name) => {
    if (!name) return "";
    const parts = name.trim().split(/\s+/);
    return parts[0].charAt(0).toUpperCase();
  };

  const userButton = currentUser
    ? `<div class="relative inline-block">
        <button id="userButton" class="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-sm font-medium">${getInitial(
          currentUser.name
        )}</button>
        <div id="userMenu" class="hidden absolute right-0 mt-2 w-48 bg-gray-900 rounded-lg shadow-lg overflow-hidden text-sm z-50">
          <a href="/profile" data-navigo class="block px-4 py-3 text-white hover:bg-gray-800">Thông tin người dùng</a>
          <a href="/change-password" data-navigo class="block px-4 py-3 text-white hover:bg-gray-800">Đổi mật khẩu</a>
          <button id="logoutBtn" class="w-full text-left px-4 py-3 text-red-500 hover:bg-gray-800 cursor-pointer">Đăng xuất</button>
        </div>
      </div>`
    : `<a href="/login" data-navigo class="bg-white text-black px-5 py-1.5 rounded-full font-medium hover:bg-gray-200 transition-colors text-sm cursor-pointer">Đăng nhập</a>`;

  return `
    <header class="fixed top-0 left-0 right-0 z-50 bg-black text-white px-4 py-3 flex items-center gap-4">
      <button id="menuToggle" class="p-2 hover:bg-gray-800 rounded-full transition-colors cursor-pointer">
        <i id="menuIcon" class="fas fa-bars text-xl transition-all duration-300"></i>
      </button>
      <a href="/" data-navigo class="flex items-center gap-2 cursor-pointer">
        <div class="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
          <i class="fas fa-play text-white text-sm"></i>
        </div>
        <span class="text-xl font-medium">Music</span>
      </a>
      <div class="flex-1 max-w-2xl mx-auto">
        <div class="relative">
          <i class="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input
            type="text"
            placeholder="Tìm bài hát, địa nhạc, nghệ sĩ"
            class="w-full bg-gray-800 text-white placeholder-gray-400 py-3 pl-12 pr-4 rounded focus:outline-none focus:bg-gray-700 transition-colors"
          />
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button class="p-2.5 hover:bg-gray-800 rounded-full transition-colors cursor-pointer">
          <i class="fa-brands fa-chromecast text-lg"></i>
        </button>
        <button class="p-2.5 hover:bg-gray-800 rounded-full transition-colors cursor-pointer">
          <i class="fas fa-ellipsis-v text-lg"></i>
        </button>
        ${userButton}
      </div>
    </header>
  `;
};
