import { FC, useEffect, useState } from "react";

interface Props {
  url: string;
}

// 404 由 FileBox 上層的 HEAD probe 統一處理；走到這裡的 url 已經 validated。
// 這裡單純拉檔案內容渲染，不再做 resp.ok 檢查。
const Code: FC<Props> = ({ url }) => {
  const [content, setContent] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!url) return;
      try {
        const resp = await fetch(url);
        const txt = await resp.text();
        if (!cancelled) setContent(txt);
      } catch {
        /* 上層已 validated 仍 fetch 失敗（網路斷線等），靜默忽略 */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [url]);

  if (!content) return null;

  return (
    <div className="h-[218px] p-[15px] pb-0 bg-bg-app text-fg-primary overflow-scroll whitespace-pre-wrap break-all leading-snug">
      {content}
    </div>
  );
};

export default Code;
