import { Header } from "../components/header";
import { Sidebar } from "../components/sidebar";
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
                    placeholder="Email của bạn"
                    class="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500 transition-colors text-white"
                    required
                  />
                  <p class="text-red-500 text-sm mt-1 hidden" id="emailError"></p>
                </div>
                <div>
                  <label class="block text-sm font-medium mb-2">Tên hiển thị</label>
                  <input
                    type="text"
                    id="registerName"
                    placeholder="Tên hiển thị của bạn"
                    class="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500 transition-colors text-white"
                    required
                  />
                  <p class="text-red-500 text-sm mt-1 hidden" id="nameError"></p>
                </div>
                <div>
                  <label class="block text-sm font-medium mb-2">Mật khẩu</label>
                  <input
                    type="password"
                    id="registerPassword"
                    placeholder="Mật khẩu"
                    class="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500 transition-colors text-white"
                    required
                  />
                  <p class="text-red-500 text-sm mt-1 hidden" id="passwordError"></p>
                </div>
                <div>
                  <label class="block text-sm font-medium mb-2">Nhập lại mật khẩu</label>
                  <input
                    type="password"
                    id="registerConfirmPassword"
                    placeholder="Nhập lại mật khẩu"
                    class="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500 transition-colors text-white"
                    required
                  />
                  <p class="text-red-500 text-sm mt-1 hidden" id="confirmPasswordError"></p>
                </div>
                <button
                  type="submit"
                  class="w-full bg-white text-black font-semibold py-3 rounded-full hover:bg-gray-200 
                  transition-colors cursor-pointer">
                  Đăng ký
                </button>
              </form>
              <p class="text-center text-sm mt-6 text-gray-400">
                Bạn đã có tài khoản? 
                <a href="/login" data-navigo class="text-white font-semibold hover:underline cursor-pointer">Đăng nhập</a>
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
  const emailInput = document.querySelector("#registerEmail");
  const nameInput = document.querySelector("#registerName");
  const passwordInput = document.querySelector("#registerPassword");
  const confirmPasswordInput = document.querySelector(
    "#registerConfirmPassword"
  );

  const emailError = document.querySelector("#emailError");
  const nameError = document.querySelector("#nameError");
  const passwordError = document.querySelector("#passwordError");
  const confirmPasswordError = document.querySelector("#confirmPasswordError");

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
    hideError(nameError);
    hideError(passwordError);
    hideError(confirmPasswordError);
    if (!emailInput.value) {
      showError(emailError, "Vui lòng nhập email");
      isValid = false;
    } else if (!validateEmail(emailInput.value)) {
      showError(emailError, "Email không hợp lệ");
      isValid = false;
    }
    if (!nameInput.value) {
      showError(nameError, "Vui lòng nhập tên hiển thị");
      isValid = false;
    } else if (nameInput.value.length < 2) {
      showError(nameError, "Tên hiển thị phải có ít nhất 2 ký tự");
      isValid = false;
    }

    if (!passwordInput.value) {
      showError(passwordError, "Vui lòng nhập mật khẩu");
      isValid = false;
    } else if (passwordInput.value.length < 6) {
      showError(passwordError, "Mật khẩu phải có ít nhất 6 ký tự");
      isValid = false;
    }

    if (!confirmPasswordInput.value) {
      showError(confirmPasswordError, "Vui lòng nhập lại mật khẩu");
      isValid = false;
    } else if (passwordInput.value !== confirmPasswordInput.value) {
      showError(confirmPasswordError, "Mật khẩu không khớp");
      isValid = false;
    }

    if (!isValid) return;

    try {
      const response = await api.post("/auth/register", {
        name: nameInput.value,
        email: emailInput.value,
        password: passwordInput.value,
        confirmPassword: confirmPasswordInput.value,
      });

      const data = response.data;
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      try {
        const me = await api.get("/auth/me");
        if (me?.data) {
          localStorage.setItem("currentUser", JSON.stringify(me.data));
        } else if (data.user) {
          localStorage.setItem("currentUser", JSON.stringify(data.user));
        }
      } catch (e) {
        console.warn(
          "Could not fetch /auth/me after register",
          e?.response?.status,
          e?.response?.data
        );
        if (data.user) {
          localStorage.setItem("currentUser", JSON.stringify(data.user));
        }
      }

      showNotification("Đăng ký thành công!", "success");

      setTimeout(() => {
        window.location.href = "/";
      }, 1200);
    } catch (err) {
      console.error(err);
      const errors = err?.response?.data?.errors;
      if (errors) {
        if (errors.email)
          showError(
            emailError,
            Array.isArray(errors.email) ? errors.email.join(" ") : errors.email
          );
        if (errors.name)
          showError(
            nameError,
            Array.isArray(errors.name) ? errors.name.join(" ") : errors.name
          );
        if (errors.password)
          showError(
            passwordError,
            Array.isArray(errors.password)
              ? errors.password.join(" ")
              : errors.password
          );
        if (errors.confirmPassword)
          showError(
            confirmPasswordError,
            Array.isArray(errors.confirmPassword)
              ? errors.confirmPassword.join(" ")
              : errors.confirmPassword
          );
      }

      const message = err?.response?.data?.message || "Đăng ký thất bại!";
      showNotification(message, "error");
    }
  });
}
