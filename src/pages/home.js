import { Content } from "../components/Content";
import { Header } from "../components/header";
import { Sidebar } from "../components/sidebar";
import { initSearchHandler } from "../utils/initSearchHandler";
import { PersonalizedSection } from "../components/sections/home/PersonalizedSection";
import "../assets/style/style.css";
import api from "../axios";

export const home = () => {
  const app = document.querySelector("#app");
  app.innerHTML = `
    ${Header()}
    <div class="flex pt-[64px]">
      <div class="w-22">${Sidebar()}</div> 
      <main class="flex-1 max-w-[1400] pb-28">
        ${Content()}
      </main>
    </div>
  `;
  initSidebarToggle();
  setTimeout(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      PersonalizedSection.init();
    } else {
      console.log("Người dùng chưa đăng nhập");
    }
  }, 100);
  (async () => {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    try {
      const res = await api.get("/auth/me");
      if (res?.data) {
        localStorage.setItem("currentUser", JSON.stringify(res.data));
        const userButton = document.querySelector("#userButton");
        if (userButton) {
          const initial =
            (res.data.name || "").split(/\s+/)[0]?.charAt(0)?.toUpperCase() ||
            "";
          userButton.textContent = initial;
        }
        const nameEls = document.querySelectorAll(".sidebar-user-name");
        nameEls.forEach((el) => {
          el.textContent = res.data.name || el.textContent;
        });
      }
    } catch (e) {
      console.warn(
        "Could not refresh /auth/me on home load",
        e?.response?.status
      );
    }
  })();
  initSearchHandler();
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
    if (!profileLinks.length) {
      return;
    }

    profileLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        const existingModal = document.querySelector("#profileModalOverlay");
        if (existingModal) {
          existingModal.remove();
        }

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
      const token = localStorage.getItem("access_token");
      if (!token) {
        createNotification("Vui lòng đăng nhập lại", "error");
        setTimeout(() => {
          window.location.href = "/login";
        }, 1500);
        return;
      }
      const overlay = document.createElement("div");
      overlay.id = "profileModalOverlay";
      overlay.className =
        "fixed inset-0 z-[100] bg-black/60 flex items-center justify-center";
      const storedUser =
        JSON.parse(localStorage.getItem("currentUser") || "null") || {};

      document.body.appendChild(overlay);
      overlay.innerHTML = `
        <div class="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl" onclick="event.stopPropagation()">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-semibold text-gray-900">Thông tin người dùng</h2>
            <button type="button" id="profileCloseBtn" class="text-gray-500 hover:text-gray-700 text-2xl leading-none">
              <i class="fas fa-times cursor-pointer"></i>
            </button>
          </div>
          <form id="profileForm" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Tên</label>
              <input 
                id="profileName" 
                type="text"
                class="w-full bg-gray-50 text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                value="${(storedUser.name || "").replace(/"/g, "&quot;")}"
              />
              <p id="profileNameError" class="text-red-500 text-sm mt-1 hidden"></p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input 
                id="profileEmail" 
                type="email"
                class="w-full bg-gray-50 text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                value="${(storedUser.email || "").replace(/"/g, "&quot;")}"
              />
              <p id="profileEmailError" class="text-red-500 text-sm mt-1 hidden"></p>
            </div>
            <div class="flex justify-end gap-3 pt-2">
              <button 
                type="button" 
                id="profileCancel" 
                class="px-5 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium 
                transition-colors cursor-pointer">
                Hủy
              </button>
              <button 
                type="submit" 
                id="profileSave" 
                class="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium 
                transition-colors cursor-pointer">
                Lưu 
              </button>
            </div>
          </form>
        </div>
      `;

      const profileName = overlay.querySelector("#profileName");
      const profileEmail = overlay.querySelector("#profileEmail");
      const profileNameError = overlay.querySelector("#profileNameError");
      const profileEmailError = overlay.querySelector("#profileEmailError");
      (async () => {
        try {
          const res = await api.get("/auth/me");
          const remote = res.data;
          if (remote) {
            if (profileName)
              profileName.value = remote.name || profileName.value || "";
            if (profileEmail)
              profileEmail.value = remote.email || profileEmail.value || "";
            const cur =
              JSON.parse(localStorage.getItem("currentUser") || "null") || {};
            cur.name = remote.name || cur.name;
            cur.email = remote.email || cur.email;
            localStorage.setItem("currentUser", JSON.stringify(cur));
          }
        } catch (err) {
          console.warn(
            "Could not refresh profile:",
            err?.response?.status,
            err?.response?.data
          );
          if (err?.response?.status === 401) {
            createNotification(
              "Không xác thực — vui lòng đăng nhập lại",
              "error"
            );
            setTimeout(() => {
              overlay.remove();
              window.location.href = "/login";
            }, 700);
          } else {
            const message =
              err?.response?.data?.message ||
              "Không thể tải thông tin mới. Vui lòng thử lại sau.";
            const text =
              window.normalizeMessage?.(
                message,
                "Không thể tải thông tin mới. Vui lòng thử lại sau."
              ) || message;
            createNotification(text, "error");
          }
        }
      })();

      const clearErrors = () => {
        profileNameError.classList.add("hidden");
        profileEmailError.classList.add("hidden");
      };

      function close() {
        overlay.remove();
      }
      let pointerStartedOnOverlay = false;
      overlay.addEventListener("pointerdown", (ev) => {
        pointerStartedOnOverlay = ev.target === overlay;
      });
      overlay.addEventListener("pointerup", (ev) => {
        if (pointerStartedOnOverlay && ev.target === overlay) {
          close();
        }
        pointerStartedOnOverlay = false;
      });
      overlay.addEventListener("pointercancel", () => {
        pointerStartedOnOverlay = false;
      });

      const closeBtn = overlay.querySelector("#profileCloseBtn");
      if (closeBtn) {
        closeBtn.addEventListener("click", close);
      }

      const cancelBtn = overlay.querySelector("#profileCancel");
      if (cancelBtn) {
        cancelBtn.addEventListener("click", close);
      }
      const handleEscape = (e) => {
        if (e.key === "Escape") {
          close();
          document.removeEventListener("keydown", handleEscape);
        }
      };
      document.addEventListener("keydown", handleEscape);
      const form = overlay.querySelector("#profileForm");
      if (form) {
        form.addEventListener("submit", async (ev) => {
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
            const upd = await api.patch("/auth/me", {
              name: nameVal,
              email: emailVal,
            });
            createNotification("Cập nhật thành công!", "success");
            const cur = JSON.parse(localStorage.getItem("currentUser") || "{}");
            cur.name = nameVal;
            cur.email = emailVal;
            localStorage.setItem("currentUser", JSON.stringify(cur));

            close();
            setTimeout(() => window.location.reload(), 1000);
          } catch (err) {
            const errors = err?.response?.data?.errors;
            if (errors) {
              if (errors.name) {
                profileNameError.textContent = Array.isArray(errors.name)
                  ? errors.name.join(" ")
                  : errors.name;
                profileNameError.classList.remove("hidden");
              }
              if (errors.email) {
                profileEmailError.textContent = Array.isArray(errors.email)
                  ? errors.email.join(" ")
                  : errors.email;
                profileEmailError.classList.remove("hidden");
              }
            }

            const message = err?.response?.data?.message || "Cập nhật thất bại";
            const text =
              window.normalizeMessage?.(message, "Cập nhật thất bại") ||
              message;
            createNotification(text, "error");
          }
        });
      }
    }
    try {
      window.openProfileModal = openProfileModal;
    } catch (e) {}
  })();

  (function initChangePasswordModal() {
    const changeLinks = document.querySelectorAll('a[href="/change-password"]');
    if (!changeLinks.length) return;

    changeLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const existing = document.querySelector("#changePasswordModalOverlay");
        if (existing) existing.remove();
        openChangePasswordModal();
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

    async function openChangePasswordModal() {
      const token = localStorage.getItem("access_token");
      if (!token) {
        createNotification("Vui lòng đăng nhập lại", "error");
        setTimeout(() => {
          window.location.href = "/login";
        }, 1200);
        return;
      }

      const overlay = document.createElement("div");
      overlay.id = "changePasswordModalOverlay";
      overlay.className =
        "fixed inset-0 z-[100] bg-black/60 flex items-center justify-center";
      overlay.innerHTML = `
        <div class="w-16 h-16 border-4 border-gray-700 border-t-white rounded-full animate-spin"></div>
      `;
      document.body.appendChild(overlay);
      overlay.innerHTML = `
        <div class="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl" onclick="event.stopPropagation()">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-semibold text-gray-900">Đổi mật khẩu</h2>
            <button type="button" id="changeCloseBtn" class="text-gray-500 hover:text-gray-700 text-2xl leading-none">
              <i class="fas fa-times cursor-pointer"></i>
            </button>
          </div>
          <form id="changeForm" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Mật khẩu cũ</label>
              <input id="oldPassword" type="password" class="w-full bg-gray-50 text-gray-900 border border-gray-300 rounded-lg px-3 py-2" />
              <p id="oldPasswordError" class="text-red-500 text-sm mt-1 hidden"></p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Mật khẩu mới</label>
              <input id="newPassword" type="password" class="w-full bg-gray-50 text-gray-900 border border-gray-300 rounded-lg px-3 py-2" />
              <p id="newPasswordError" class="text-red-500 text-sm mt-1 hidden"></p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Xác nhận mật khẩu mới</label>
              <input id="confirmPassword" type="password" class="w-full bg-gray-50 text-gray-900 border border-gray-300 rounded-lg px-3 py-2" />
              <p id="confirmPasswordError" class="text-red-500 text-sm mt-1 hidden"></p>
            </div>
            <div class="flex justify-end gap-3 pt-2">
              <button type="button" id="changeCancel" class="px-5 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium cursor-pointer">Hủy</button>
              <button type="submit" id="changeSave" class="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium cursor-pointer">Đổi mật khẩu</button>
            </div>
          </form>
        </div>
      `;

      const oldPassword = overlay.querySelector("#oldPassword");
      const newPassword = overlay.querySelector("#newPassword");
      const confirmPassword = overlay.querySelector("#confirmPassword");
      const oldErr = overlay.querySelector("#oldPasswordError");
      const newErr = overlay.querySelector("#newPasswordError");
      const confirmErr = overlay.querySelector("#confirmPasswordError");

      const clear = () => {
        oldErr.classList.add("hidden");
        newErr.classList.add("hidden");
        confirmErr.classList.add("hidden");
      };

      function close() {
        overlay.remove();
      }
      let pointerStartedOnOverlay = false;
      overlay.addEventListener("pointerdown", (ev) => {
        pointerStartedOnOverlay = ev.target === overlay;
      });
      overlay.addEventListener("pointerup", (ev) => {
        if (pointerStartedOnOverlay && ev.target === overlay) close();
        pointerStartedOnOverlay = false;
      });
      overlay.addEventListener("pointercancel", () => {
        pointerStartedOnOverlay = false;
      });

      const closeBtn = overlay.querySelector("#changeCloseBtn");
      if (closeBtn) closeBtn.addEventListener("click", close);
      const cancelBtn = overlay.querySelector("#changeCancel");
      if (cancelBtn) cancelBtn.addEventListener("click", close);
      const handleEscape = (e) => {
        if (e.key === "Escape") {
          close();
          document.removeEventListener("keydown", handleEscape);
        }
      };
      document.addEventListener("keydown", handleEscape);

      const form = overlay.querySelector("#changeForm");
      if (form) {
        form.addEventListener("submit", async (ev) => {
          ev.preventDefault();
          clear();
          let ok = true;
          if (!oldPassword.value) {
            oldErr.textContent = "Vui lòng nhập mật khẩu cũ";
            oldErr.classList.remove("hidden");
            ok = false;
          }
          if (!newPassword.value || newPassword.value.length < 6) {
            newErr.textContent = "Mật khẩu mới phải >= 6 ký tự";
            newErr.classList.remove("hidden");
            ok = false;
          }
          if (confirmPassword.value !== newPassword.value) {
            confirmErr.textContent = "Xác nhận mật khẩu không khớp";
            confirmErr.classList.remove("hidden");
            ok = false;
          }
          if (!ok) return;
          try {
            const res = await api.patch("/auth/change-password", {
              oldPassword: oldPassword.value,
              password: newPassword.value,
              confirmPassword: confirmPassword.value,
            });
            createNotification("Đổi mật khẩu thành công", "success");
            close();
          } catch (err) {
            console.error("Change password error", err);
            const status = err?.response?.status;
            if (status === 401) {
              createNotification(
                "Không xác thực — vui lòng đăng nhập lại",
                "error"
              );
              setTimeout(() => {
                window.location.href = "/login";
              }, 800);
              return;
            }
            const errors = err?.response?.data?.errors;
            if (errors) {
              if (errors.oldPassword) {
                oldErr.textContent = Array.isArray(errors.oldPassword)
                  ? errors.oldPassword.join(" ")
                  : errors.oldPassword;
                oldErr.classList.remove("hidden");
              }
              if (errors.password) {
                newErr.textContent = Array.isArray(errors.password)
                  ? errors.password.join(" ")
                  : errors.password;
                newErr.classList.remove("hidden");
              }
              if (errors.confirmPassword) {
                confirmErr.textContent = Array.isArray(errors.confirmPassword)
                  ? errors.confirmPassword.join(" ")
                  : errors.confirmPassword;
                confirmErr.classList.remove("hidden");
              }
            } else {
              const msg =
                err?.response?.data?.message || "Đổi mật khẩu thất bại";
              const text =
                window.normalizeMessage?.(msg, "Đổi mật khẩu thất bại") || msg;
              createNotification(text, "error");
            }
          }
        });
      }
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
