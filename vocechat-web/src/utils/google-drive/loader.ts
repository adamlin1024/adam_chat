import { GAPI_SCRIPT_URL, GIS_SCRIPT_URL } from "./config";

const loadedScripts = new Set<string>();

function loadScript(src: string): Promise<void> {
  if (loadedScripts.has(src)) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      loadedScripts.add(src);
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      loadedScripts.add(src);
      resolve();
    };
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

let gisReady: Promise<void> | null = null;
export function loadGIS(): Promise<void> {
  if (!gisReady) {
    gisReady = loadScript(GIS_SCRIPT_URL).then(() => {
      if (!window.google?.accounts?.oauth2) {
        throw new Error("GIS loaded but window.google.accounts.oauth2 not present");
      }
    });
  }
  return gisReady;
}

let gapiReady: Promise<void> | null = null;
export function loadGAPI(modules: string[] = ["client", "picker"]): Promise<void> {
  if (!gapiReady) {
    gapiReady = loadScript(GAPI_SCRIPT_URL).then(
      () =>
        new Promise<void>((resolve, reject) => {
          const gapi = window.gapi;
          if (!gapi) return reject(new Error("gapi not loaded"));
          gapi.load(modules.join(":"), {
            callback: () => resolve(),
            onerror: () => reject(new Error("gapi.load failed"))
          });
        })
    );
  }
  return gapiReady;
}
