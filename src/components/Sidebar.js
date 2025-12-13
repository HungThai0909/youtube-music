export const Sidebar = () => {
  return `
        <div class="fixed top-[64px] left-0 w-22 bg-black flex flex-col items-center py-6 h-[calc(100vh-64px)] z-40">
            <div class="flex flex-col">
                <div class="flex flex-col items-center hover:bg-zinc-800 rounded-2xl px-3 py-2 cursor-pointer">
                    <div class="w-10 h-10 rounded-xl flex items-center justify-center">
                        <i class="fa-regular fa-house text-xl text-white"></i>
                    </div>
                    <span class="text-white text-xs font-medium">Trang chủ</span>
                </div>
                <div class="flex flex-col items-center hover:bg-zinc-800 rounded-2xl px-3 py-2 cursor-pointer transition-colors">
                    <div class="w-10 h-10 flex items-center justify-center">
                        <i class="fa-regular fa-compass text-xl text-white"></i>
                    </div>
                    <span class="text-white text-xs font-medium">Khám phá</span>
                </div>
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
    `;
};
