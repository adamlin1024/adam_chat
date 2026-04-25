import { useEffect, useState } from "react";

/**
 * 暫時用的 viewport 量測 overlay（AB test 用，測完移除）。
 * 在畫面右上顯示 visualViewport / innerHeight / safe-area / body 高度等實測值。
 */
const ViewportDebug = () => {
  const [data, setData] = useState({
    iw: 0,
    ih: 0,
    vvw: 0,
    vvh: 0,
    sat: 0,
    sab: 0,
    bodyW: 0,
    bodyH: 0,
    docH: 0,
    appHeight: "",
    standalone: false,
  });

  useEffect(() => {
    const measure = () => {
      const cs = getComputedStyle(document.documentElement);
      const probe = document.createElement("div");
      probe.style.cssText = `
        position: fixed;
        top: 0; left: 0;
        padding-top: env(safe-area-inset-top);
        padding-bottom: env(safe-area-inset-bottom);
        visibility: hidden;
        pointer-events: none;
      `;
      document.body.appendChild(probe);
      const ps = getComputedStyle(probe);
      const sat = parseFloat(ps.paddingTop) || 0;
      const sab = parseFloat(ps.paddingBottom) || 0;
      document.body.removeChild(probe);

      setData({
        iw: window.innerWidth,
        ih: window.innerHeight,
        vvw: window.visualViewport?.width ?? 0,
        vvh: window.visualViewport?.height ?? 0,
        sat,
        sab,
        bodyW: document.body.clientWidth,
        bodyH: document.body.clientHeight,
        docH: document.documentElement.clientHeight,
        appHeight: cs.getPropertyValue("--app-height").trim() || "(unset)",
        standalone:
          window.matchMedia("(display-mode: standalone)").matches ||
          (window.navigator as any).standalone === true,
      });
    };
    measure();
    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    window.visualViewport?.addEventListener("resize", onResize);
    const id = setInterval(measure, 1000);
    return () => {
      window.removeEventListener("resize", onResize);
      window.visualViewport?.removeEventListener("resize", onResize);
      clearInterval(id);
    };
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        top: "env(safe-area-inset-top, 0px)",
        right: 4,
        zIndex: 99999,
        background: "rgba(0,0,0,0.8)",
        color: "#0f0",
        font: "10px/1.3 ui-monospace, monospace",
        padding: "4px 6px",
        borderRadius: 4,
        pointerEvents: "none",
        whiteSpace: "pre",
      }}
    >
      {`standalone: ${data.standalone}
inner: ${data.iw}x${data.ih}
visualVP: ${data.vvw}x${data.vvh}
safeArea: top=${data.sat} bot=${data.sab}
body: ${data.bodyW}x${data.bodyH}
doc.clientH: ${data.docH}
--app-height: ${data.appHeight}`}
    </div>
  );
};

export default ViewportDebug;
