import { Header } from "../components/header";
import { Sidebar } from "../components/Sidebar";
import { initSidebarToggle } from "./home";
import api from "../axios";

export const Login = () => {
  const app = document.querySelector("#app");
  app.innerHTML = `
    ${Header()}
    <div class="flex pt-[64px]">
      <div class="w-22">${Sidebar()}</div>
      <main class="flex-1 overflow-y-auto h-[calc(100vh-64px)] bg-black">
        <div class="min-h-full text-white flex items-center justify-center relative overflow-hidden p-4 bg-[url('/src/assets/image/background.jpg')] bg-cover bg-center">
          <div class="relative z-10 w-full max-w-md">
            <div class="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-gray-700/50">
              <h1 class="text-3xl font-bold text-center mb-8">ĐĂNG NHẬP</h1>
              <form id="loginForm" class="space-y-6">
                <div>
                  <label class="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    id="loginEmail"
                    placeholder="Email của bạn"
                    class="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500 transition-colors text-white"
                    required
                  />
                  <p class="text-red-500 text-sm mt-1 hidden" id="emailError"></p>
                </div>
                <div>
                  <label class="block text-sm font-medium mb-2">Mật khẩu</label>
                  <input
                    type="password"
                    id="loginPassword"
                    placeholder="Mật khẩu"
                    class="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500 transition-colors text-white"
                    required
                  />
                  <p class="text-red-500 text-sm mt-1 hidden" id="passwordError"></p>
                </div>
                <button
                  type="submit"
                  class="w-full bg-white text-black font-semibold py-3 rounded-full hover:bg-gray-200 
                  transition-colors cursor-pointer">
                  Đăng nhập
                </button>
              </form>
              <p class="text-center text-sm mt-6 text-gray-400">
                Bạn chưa có tài khoản? 
                <a href="/register" data-navigo class="text-white font-semibold hover:underline cursor-pointer">Đăng ký</a>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  `;

  initSidebarToggle();
  initLoginPage();
};

function initLoginPage() {
  const form = document.querySelector("#loginForm");
  const emailInput = document.querySelector("#loginEmail");
  const passwordInput = document.querySelector("#loginPassword");
  const emailError = document.querySelector("#emailError");
  const passwordError = document.querySelector("#passwordError");
  
  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const showError = (element, message) => {
    element.textContent = message;
    element.classList.remove("hidden");
    element.parentElement
      .querySelector("input")
      .classList.add("border-red-500");
  };

  const hideError = (element) => {
    element.classList.add("hidden");
    element.parentElement
      .querySelector("input")
      .classList.remove("border-red-500");
  };

  const showNotification = (message, type = "success") => {
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
    }, 3000);
  };
  const updateHeaderAfterLogin = (userData) => {
    const getInitial = (name) => {
      if (!name) return "";
      const parts = name.trim().split(/\s+/);
      return parts[0].charAt(0).toUpperCase();
    };
    const headerRight = document.querySelector("header .flex.items-center.gap-2");
    if (!headerRight) return;
    const userButtonHTML = `
      <div class="relative inline-block">
        <button id="userButton" class="w-8 h-8 bg-gray-700 hover:bg-gray-800 rounded-full flex items-center justify-center text-sm font-medium cursor-pointer">
          ${getInitial(userData.name)}
        </button>
        <div id="userMenu" class="hidden absolute right-0 mt-2 w-48 bg-gray-900 rounded-lg shadow-lg overflow-hidden text-sm z-50">
          <a href="/profile" data-navigo class="block px-4 py-3 text-white hover:bg-gray-800">Thông tin người dùng</a>
          <a href="/change-password" data-navigo class="block px-4 py-3 text-white hover:bg-gray-800">Đổi mật khẩu</a>
          <button id="logoutBtn" class="w-full text-left px-4 py-3 text-red-500 hover:bg-gray-800 cursor-pointer">Đăng xuất</button>
        </div>
      </div>
    `;
    const loginButton = headerRight.querySelector('a[href="/login"]');
    if (loginButton) {
      loginButton.remove();
    }
    headerRight.insertAdjacentHTML("beforeend", userButtonHTML);
    const userButton = document.querySelector("#userButton");
    const userMenu = document.querySelector("#userMenu");
    const logoutBtn = document.querySelector("#logoutBtn");

    if (userButton && userMenu) {
      userButton.addEventListener("click", (ev) => {
        ev.stopPropagation();
        userMenu.classList.toggle("hidden");
      });

      document.addEventListener("click", (ev) => {
        if (userMenu && !userMenu.classList.contains("hidden")) {
          if (!userMenu.contains(ev.target) && ev.target !== userButton) {
            userMenu.classList.add("hidden");
          }
        }
      });
    }

    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("currentUser");
        window.location.href = "/login";
      });
    }
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    let isValid = true;
    hideError(emailError);
    hideError(passwordError);

    if (!emailInput.value) {
      showError(emailError, "Vui lòng nhập email");
      isValid = false;
    } else if (!validateEmail(emailInput.value)) {
      showError(emailError, "Email không hợp lệ");
      isValid = false;
    }

    if (!passwordInput.value) {
      showError(passwordError, "Vui lòng nhập mật khẩu");
      isValid = false;
    } else if (passwordInput.value.length < 6) {
      showError(passwordError, "Mật khẩu phải có ít nhất 6 ký tự");
      isValid = false;
    }

    if (!isValid) return;
    
    try {
      const response = await api.post("/auth/login", {
        email: emailInput.value,
        password: passwordInput.value,
      });

      const data = response.data;
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      
      let userData = null;
      try {
        const me = await api.get("/auth/me");
        if (me?.data) {
          userData = me.data;
          localStorage.setItem("currentUser", JSON.stringify(me.data));
        } else if (data.user) {
          userData = data.user;
          localStorage.setItem("currentUser", JSON.stringify(data.user));
        }
      } catch (e) {
        console.warn(
          "Could not fetch /auth/me after login",
          e?.response?.status,
          e?.response?.data
        );
        if (data.user) {
          userData = data.user;
          localStorage.setItem("currentUser", JSON.stringify(data.user));
        }
      }

      showNotification("Đăng nhập thành công!", "success");
      if (userData) {
        updateHeaderAfterLogin(userData);
      }
      
      setTimeout(() => {
        window.location.href = "/";
      }, 1200);
    } catch (err) {
      console.error(err);
      const message = "Email hoặc mật khẩu không đúng!";
      showNotification(message, "error");
    }
  });
}