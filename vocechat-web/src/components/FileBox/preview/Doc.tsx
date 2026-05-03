import { FC, useEffect, useState } from "react";

import useExpiredResMap from "@/hooks/useExpiredResMap";

const Doc: FC<{ url: string }> = ({ url }) => {
  const [content, setContent] = useState("");
  const { setExpired } = useExpiredResMap();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!url) return;
      try {
        const resp = await fetch(url);
        // 4xx/5xx 才標 expired；fetch reject（catch）視為網路問題不標
        if (!resp.ok) {
          if (!cancelled) setExpired(url);
          return;
        }
        const txt = await resp.text();
        if (!cancelled) setContent(txt);
      } catch {
        /* 網路斷線等，靜默 */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [url, setExpired]);

  if (!content) return null;

  return (
    <div className="bg-bg-elevated h-[218px] p-[15px] pb-0 whitespace-pre-wrap break-all">{content}</div>
  );
};

export default Doc;
