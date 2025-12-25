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
      showNotification("Đăng ký thành công");
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
