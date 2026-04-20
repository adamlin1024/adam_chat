import { Suspense } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import ReactDOM from "react-dom/client";
import toast, { Toaster } from "react-hot-toast";

import "./assets/index.css";
import "./libs/DayjsSetting";
import "./libs/TippySetting";

import NewVersion from "./components/NewVersion";
import ReduxRoutes from "./routes";
import { register } from "./serviceWorkerRegistration";
// import i18n (needs to be bundled ;))
import "./i18n";
import "./libs/polyfills";

import { isDarkMode, reloadCurrentPage } from "./utils";

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
// dark-only design — always apply dark class
document.documentElement.classList.add("dark");
root.render(
  <Suspense fallback="loading">
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

register({
  // onSuccess: () => {
  //   toast.success("Service Worker Installed");
  // },
  onUpdate: (reg) => {
    const handleUpdate = () => {
      reg.unregister().then(() => {
        reloadCurrentPage();
      });
    };
    toast((t) => <NewVersion id={t.id} handleUpdate={handleUpdate} />, {
      duration: Infinity,
      position: "top-right"
    });
  }
});
