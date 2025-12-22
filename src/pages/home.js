import { Content } from "../components/Content";
import { Header } from "../components/header";
import { Sidebar } from "../components/sidebar";
import "../assets/style/style.css";
import api from "../axios";

export const home = () => {
  const app = document.querySelector("#app");
  app.innerHTML = `
    ${Header()}
    <div class="flex pt-[64px]">
      <div class="w-22">${Sidebar()}</div> 
      <main class="flex-1 overflow-y-auto h-[calc(100vh-64px)]">
        ${Content()}
      </main>
    </div>
  `;
  initSidebarToggle();
};

function initSidebarToggle() {
  const menuToggle = document.querySelector("#menuToggle");
  const menuIcon = document.querySelector("#menuIcon");
  const extendedSidebar = document.querySelector("#extendedSidebar");
  const closeSidebarBtn = document.querySelector("#closeSidebarBtn");
  const sidebarLinks = document.querySelectorAll(".sidebar-link");
  let isOpen = false;
  menuToggle?.addEventListener("click", () => {
    openSidebar();
  });
  closeSidebarBtn?.addEventListener("click", () => {
    closeSidebar();
  });
  sidebarLinks.forEach((link) => {
    link.addEventListener("click", () => {
      closeSidebar();
    });
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isOpen) {
      closeSidebar();
    }
  });
  (function initUserMenu() {
    const userButton = document.querySelector("#userButton");
    const userMenu = document.querySelector("#userMenu");
    const logoutBtn = document.querySelector("#logoutBtn");
    if (!userButton) return;
    userButton.addEventListener("click", (ev) => {
      ev.stopPropagation();
      userMenu?.classList.toggle("hidden");
    });

    document.addEventListener("click", (ev) => {
      if (userMenu && !userMenu.classList.contains("hidden")) {
        if (!userMenu.contains(ev.target) && ev.target !== userButton) {
          userMenu.classList.add("hidden");
        }
      }
    });

    logoutBtn?.addEventListener("click", () => {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("currentUser");
      window.location.href = "/login";
    });
  })();

  (function initSidebarUserMenu() {
    const sidebarUser = document.querySelector("#sidebarUser");
    const sidebarUserMenu = document.querySelector("#sidebarUserMenu");
    const sidebarLogoutBtn = document.querySelector("#sidebarLogout");
    const extendedLogout = document.querySelector("#extendedLogout");
    if (!sidebarUser) return;
    sidebarUser.addEventListener("click", (ev) => {
      ev.stopPropagation();
      sidebarUserMenu?.classList.toggle("hidden");
    });

    document.addEventListener("click", (ev) => {
      if (sidebarUserMenu && !sidebarUserMenu.classList.contains("hidden")) {
        if (!sidebarUserMenu.contains(ev.target) && ev.target !== sidebarUser) {
          sidebarUserMenu.classList.add("hidden");
        }
      }
    });

    sidebarLogoutBtn?.addEventListener("click", () => {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("currentUser");
      window.location.href = "/login";
    });

    extendedLogout?.addEventListener("click", () => {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("currentUser");
      window.location.href = "/login";
    });
  })();

  (function initProfileModal() {
    const profileLinks = document.querySelectorAll('a[href="/profile"]');
    if (!profileLinks.length) return;

    profileLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        openProfileModal();
      });
    });

    const createNotification = (message, type = "success") => {
      const notification = document.createElement("div");
      notification.className = `fixed top-20 right-4 z-[100] p-4 rounded-lg shadow-lg transform translate-x-0 transition-all duration-300 ${
        type === "success" ? "bg-green-600" : "bg-red-600"
      }`;
      notification.innerHTML = `
        <div class="flex items-center gap-3">
          <i class="fas fa-${
            type === "success" ? "check-circle" : "exclamation-circle"
          } text-xl text-white"></i>
          <span class="font-medium text-white">${message}</span>
        </div>
      `;
      document.body.appendChild(notification);
      setTimeout(() => {
        notification.style.transform = "translateX(400px)";
        setTimeout(() => notification.remove(), 300);
      }, 2500);
    };

    async function openProfileModal() {
      const overlay = document.createElement("div");
      overlay.id = "profileModalOverlay";
      overlay.className =
        "fixed inset-0 z-[100] bg-black/60 flex items-center justify-center transition-opacity duration-500";
      overlay.innerHTML = `
        <div class="w-16 h-16 border-4 border-gray-700 border-t-white rounded-full animate-spin"></div>
      `;

      document.body.appendChild(overlay);
      let user;
      try {
        const res = await api.get("/auth/me");
        user = res.data;
      } catch (err) {
        console.error(err);
        createNotification("Không thể tải thông tin người dùng", "error");
        overlay.style.opacity = "0";
        setTimeout(() => overlay.remove(), 500);
        return;
      }
      overlay.innerHTML = `
        <div class="bg-white w-full max-w-md rounded-2xl p-6">
          <h2 class="text-lg font-medium mb-4 ">Thông tin người dùng</h2>
          <form id="profileForm" class="space-y-4">
            <div>
              <label class="block text-sm mb-1">Tên</label>
              <input id="profileName" class="w-full bg-gray-800 text-white rounded px-3 py-2" />
              <p id="profileNameError" class="text-red-500 text-sm mt-1 hidden"></p>
            </div>
            <div>
              <label class="block text-sm mb-1">Email</label>
              <input id="profileEmail" class="w-full bg-gray-800 text-white rounded px-3 py-2" />
              <p id="profileEmailError" class="text-red-500 text-sm mt-1 hidden"></p>
            </div>
            <div class="flex justify-end gap-3">
              <button type="button" id="profileCancel" class="px-4 py-2 rounded bg-gray-700 hover:bg-gray-800 text-white cursor-pointer">Hủy</button>
              <button type="submit" id="profileSave" class="px-4 py-2 rounded bg-gray-700 hover:bg-gray-800 text-white font-medium cursor-pointer">Lưu</button>
            </div>
          </form>
        </div>
      `;

      const profileName = overlay.querySelector("#profileName");
      const profileEmail = overlay.querySelector("#profileEmail");
      const profileNameError = overlay.querySelector("#profileNameError");
      const profileEmailError = overlay.querySelector("#profileEmailError");
      profileName.value = user.name || "";
      profileEmail.value = user.email || "";
      const clearErrors = () => {
        profileNameError.classList.add("hidden");
        profileEmailError.classList.add("hidden");
      };

      function close() {
        overlay.remove();
      }

      overlay.addEventListener("click", (ev) => {
        if (ev.target === overlay) close();
      });

      overlay.querySelector("#profileCancel").addEventListener("click", close);
      overlay
        .querySelector("#profileForm")
        .addEventListener("submit", async (ev) => {
          ev.preventDefault();
          clearErrors();
          const nameVal = profileName.value.trim();
          const emailVal = profileEmail.value.trim();
          let valid = true;
          const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!nameVal) {
            profileNameError.textContent = "Vui lòng nhập tên";
            profileNameError.classList.remove("hidden");
            valid = false;
          }
          if (!emailVal) {
            profileEmailError.textContent = "Vui lòng nhập email";
            profileEmailError.classList.remove("hidden");
            valid = false;
          } else if (!emailRe.test(emailVal)) {
            profileEmailError.textContent = "Email không hợp lệ";
            profileEmailError.classList.remove("hidden");
            valid = false;
          }
          if (!valid) return;

          try {
            const upd = await api.put(
              "/auth/me",
              { name: nameVal, email: emailVal },
              { headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` } }
            );
            createNotification(upd.data.message || "Cập nhật thành công", "success");
            const cur = JSON.parse(localStorage.getItem("currentUser") || "null") || {};
            cur.name = nameVal;
            cur.email = emailVal;
            localStorage.setItem("currentUser", JSON.stringify(cur));

            close();
            setTimeout(() => window.location.reload(), 700);
          } catch (err) {
            console.error('Profile update error:', err);
            console.error('Server response:', err?.response);
            const errors = err?.response?.data?.errors;
            if (errors) {
              if (errors.name) {
                profileNameError.textContent = Array.isArray(errors.name)
                  ? errors.name.join(' ')
                  : errors.name;
                profileNameError.classList.remove('hidden');
              }
              if (errors.email) {
                profileEmailError.textContent = Array.isArray(errors.email)
                  ? errors.email.join(' ')
                  : errors.email;
                profileEmailError.classList.remove('hidden');
              }
            }
            const status = err?.response?.status;
            const serverMessage = err?.response?.data?.message;
            let message = serverMessage || err?.message || 'Cập nhật thất bại';
            if (status === 401) {
              message = 'Không xác thực — vui lòng đăng nhập lại';
            }
            createNotification(`${message} (status: ${status ?? 'n/a'})`, 'error');
          }
        });
    }
  })();
  function openSidebar() {
    isOpen = true;
    extendedSidebar?.classList.remove("-translate-x-full");
    menuIcon?.classList.remove("fa-bars");
    menuIcon?.classList.add("fa-xmark");
  }

  function closeSidebar() {
    if (!isOpen) return;
    isOpen = false;
    extendedSidebar?.classList.add("-translate-x-full");
    menuIcon?.classList.remove("fa-xmark");
    menuIcon?.classList.add("fa-bars");
  }
}

export { initSidebarToggle };
