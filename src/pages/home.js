import { Content } from "../components/Content";
import { Header } from "../components/header";
import { Sidebar } from "../components/sidebar";
import "../assets/style/style.css";

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
