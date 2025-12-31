import { Header } from "../components/header";
import { Sidebar } from "../components/Sidebar";
import { initSidebarToggle } from "./home";
import api from "../axios";

export const Register = () => {
  const app = document.querySelector("#app");
  app.innerHTML = `
    ${Header()}
    <div class="flex pt-[64px]">
      <div class="w-22">${Sidebar()}</div>
      <main class="flex-1 overflow-y-auto h-[calc(100vh-64px)] bg-black">
        <div class="min-h-full text-white flex items-center justify-center relative overflow-hidden p-4 bg-[url('/src/assets/image/background.jpg')] bg-cover bg-center">
          <div class="relative z-10 w-full max-w-md">
            <div class="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-gray-700/50">
              <h1 class="text-3xl font-bold text-center mb-8">ĐĂNG KÝ</h1>
              <form id="registerForm" class="space-y-5">
                <div>
                  <label class="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    id="registerEmail"
                    class="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500 text-white"
                    placeholder="Email của bạn"
                    required
                  />
                  <p id="emailError" class="text-red-500 text-sm mt-1 hidden"></p>
                </div>

                <div>
                  <label class="block text-sm font-medium mb-2">Tên hiển thị</label>
                  <input
                    type="text"
                    id="registerName"
                    class="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500 text-white"
                    placeholder="Tên hiển thị"
                    required
                  />
                  <p id="nameError" class="text-red-500 text-sm mt-1 hidden"></p>
                </div>

                <div>
                  <label class="block text-sm font-medium mb-2">Mật khẩu</label>
                  <input
                    type="password"
                    id="registerPassword"
                    class="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500 text-white"
                    placeholder="Mật khẩu"
                    required
                  />
                  <p id="passwordError" class="text-red-500 text-sm mt-1 hidden"></p>
                </div>

                <div>
                  <label class="block text-sm font-medium mb-2">Nhập lại mật khẩu</label>
                  <input
                    type="password"
                    id="registerConfirmPassword"
                    class="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500 text-white"
                    placeholder="Nhập lại mật khẩu"
                    required
                  />
                  <p id="confirmPasswordError" class="text-red-500 text-sm mt-1 hidden"></p>
                </div>

                <button
                  type="submit"
                  class="w-full bg-white text-black font-semibold py-3 rounded-full hover:bg-gray-200 transition"
                >
                  Đăng ký
                </button>
              </form>

              <p class="text-center text-sm mt-6 text-gray-400">
                Bạn đã có tài khoản?
                <a href="/login" data-navigo class="text-white font-semibold hover:underline">Đăng nhập</a>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  `;

  initSidebarToggle();
  initRegisterPage();
};

function initRegisterPage() {
  const form = document.querySelector("#registerForm");
  const email = document.querySelector("#registerEmail");
  const name = document.querySelector("#registerName");
  const password = document.querySelector("#registerPassword");
  const confirmPassword = document.querySelector("#registerConfirmPassword");

  const emailError = document.querySelector("#emailError");
  const nameError = document.querySelector("#nameError");
  const passwordError = document.querySelector("#passwordError");
  const confirmPasswordError = document.querySelector("#confirmPasswordError");

  const showError = (el, msg) => {
    el.textContent = msg;
    el.classList.remove("hidden");
    el.previousElementSibling?.classList?.add("border-red-500");
  };

  const hideError = (el) => {
    el.classList.add("hidden");
    el.previousElementSibling?.classList?.remove("border-red-500");
  };

  const showNotification = (msg, type = "success") => {
    const div = document.createElement("div");
    div.className = `fixed top-20 right-4 z-50 px-4 py-3 rounded-lg text-white ${
      type === "success" ? "bg-green-600" : "bg-red-600"
    }`;
    div.textContent = msg;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 3000);
  };
  const updateHeaderAfterRegister = (userData) => {
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

    [emailError, nameError, passwordError, confirmPasswordError].forEach(hideError);

    if (!email.value) return showError(emailError, "Vui lòng nhập email");
    if (!name.value) return showError(nameError, "Vui lòng nhập tên");
    if (password.value.length < 6)
      return showError(passwordError, "Mật khẩu tối thiểu 6 ký tự");
    if (password.value !== confirmPassword.value)
      return showError(confirmPasswordError, "Mật khẩu không khớp");

    try {
      const res = await api.post("/auth/register", {
        email: email.value,
        name: name.value,
        password: password.value,
        confirmPassword: confirmPassword.value,
      });

      localStorage.setItem("access_token", res.data.access_token);
      if (res.data.refresh_token) {
        localStorage.setItem("refresh_token", res.data.refresh_token);
      }
      let userData = null;
      try {
        const me = await api.get("/auth/me");
        if (me?.data) {
          userData = me.data;
          localStorage.setItem("currentUser", JSON.stringify(me.data));
        } else if (res.data.user) {
          userData = res.data.user;
          localStorage.setItem("currentUser", JSON.stringify(res.data.user));
        } else {
          userData = {
            name: name.value,
            email: email.value
          };
          localStorage.setItem("currentUser", JSON.stringify(userData));
        }
      } catch (e) {
        console.warn("Could not fetch /auth/me after register", e);
        if (res.data.user) {
          userData = res.data.user;
          localStorage.setItem("currentUser", JSON.stringify(res.data.user));
        } else {
          userData = {
            name: name.value,
            email: email.value
          };
          localStorage.setItem("currentUser", JSON.stringify(userData));
        }
      }

      showNotification("Đăng ký thành công");
      if (userData) {
        updateHeaderAfterRegister(userData);
      }
      
      setTimeout(() => (window.location.href = "/"), 1200);
    } catch (err) {
      const status = err?.response?.status;
      const message = err?.response?.data?.message || "";
      if (status === 409 || message.toLowerCase().includes("email")) {
        showError(emailError, "Email đã được sử dụng");
        showNotification("Email đã được sử dụng", "error");
        return;
      }

      showNotification("Đăng ký thất bại", "error");
    }
  });
}