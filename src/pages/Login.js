import { Header } from "../components/header";
import { Sidebar } from "../components/sidebar";
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
      localStorage.setItem("currentUser", JSON.stringify(data.user));

      showNotification("Đăng nhập thành công!", "success");
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    } catch (err) {
      console.error(err);
      const message =
        err?.response?.data?.message || "Email hoặc mật khẩu không đúng!";
      showNotification(message, "error");
    }
  });
}
