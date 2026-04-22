import { Suspense } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import ReactDOM from "react-dom/client";
import toast, { Toaster } from "react-hot-toast";

import "./assets/index.css";
import "./libs/DayjsSetting";
import "./libs/TippySetting";

import ReduxRoutes from "./routes";
import { register } from "./serviceWorkerRegistration";
// import i18n (needs to be bundled ;))
import "./i18n";
import "./libs/polyfills";


// When a new SW activates mid-load (clientsClaim), old JS chunks are 404 on the server.
// Catch the resulting ChunkLoadError and reload so the new SW serves fresh assets.
window.addEventListener("unhandledrejection", (event) => {
  const err = event.reason;
  if (
    err?.name === "ChunkLoadError" ||
    err?.message?.includes("Loading chunk") ||
    err?.message?.includes("Failed to fetch dynamically imported module") ||
    err?.message?.includes("error loading dynamically imported module")
  ) {
    event.preventDefault();
    window.location.reload();
  }
});

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
// dark-only design — always apply dark class
document.documentElement.classList.add("dark");

// iOS PWA: scroll focused input into view after keyboard animates up
document.addEventListener("focusin", (e) => {
  const el = e.target as HTMLElement;
  if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
    setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "center" }), 400);
  }
});
// iOS PWA: when app goes to background, overlay dark cover so iOS snapshot is always dark.
// This ensures cold-start transition uses a dark screenshot instead of white.
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") {
    if (!document.getElementById("ios-snap-cover")) {
      const cover = document.createElement("div");
      cover.id = "ios-snap-cover";
      cover.style.cssText = "position:fixed;inset:0;background:#08090b;z-index:99998;pointer-events:none;";
      document.body.appendChild(cover);
    }
  } else {
    document.getElementById("ios-snap-cover")?.remove();
  }
});

// Keep splash visible for at least 1s so the animation is perceptible, then fade out
const splash = document.getElementById("splash");
if (splash) {
  setTimeout(() => {
    splash.style.transition = "opacity 350ms ease";
    splash.style.opacity = "0";
    setTimeout(() => splash.remove(), 350);
  }, 1000);
}

root.render(
  <Suspense fallback={null}>
    <Toaster
      toastOptions={{
        style: {
          background: "#0c0d10",
          color: "#d4d4d8",
          border: "1px solid #27272a",
          fontSize: "12.5px",
          fontFamily: "Inter, -apple-system, sans-serif",
        }
      }}
    />
    <DndProvider backend={HTML5Backend}>
      <ReduxRoutes />
    </DndProvider>
  </Suspense>
);

register({});
