import { Content } from "../components/Content";
import { Header } from "../components/header";
import { Sidebar } from "../components/sidebar";
import "../assets/style.css";

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
};
