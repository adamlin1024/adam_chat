import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import clsx from "clsx";

type Props = {
  containerId: string;
};

const formatDate = (d: dayjs.Dayjs, lang: string): string => {
  const lng = (lang || "").toLowerCase();
  // 中文 / 日文：M月D日（週X）全形括號
  if (lng.startsWith("zh") || lng === "ja" || lng === "jp") {
    // 強制指定 locale，確保即使 dayjs.locale() 尚未同步也能輸出正確語言
    const dLoc = lng === "jp" || lng === "ja" ? "ja" : lng === "zh" ? "zh-cn" : lng === "zh-tw" ? "zh-tw" : lng;
    return d.locale(dLoc).format("M月D日（ddd）");
  }
  return d.locale("en").format("ddd, MMM D");
};

const FloatingDate = ({ containerId }: Props) => {
  const { i18n } = useTranslation();
  const [dateLabel, setDateLabel] = useState<string>("");
  const [visible, setVisible] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const container = document.getElementById(containerId);
    if (!container) return;

    const computeTopMessage = () => {
      const rows = container.querySelectorAll<HTMLElement>("[data-msg-mid][data-created-at]");
      if (rows.length === 0) {
        setDateLabel("");
        return;
      }
      const containerTop = container.getBoundingClientRect().top;
      let topRow: HTMLElement | null = null;
      for (const row of Array.from(rows)) {
        const rect = row.getBoundingClientRect();
        if (rect.bottom > containerTop + 4) {
          topRow = row;
          break;
        }
      }
      if (!topRow) topRow = rows[rows.length - 1];
      const ts = Number(topRow.dataset.createdAt);
      if (!ts) return;
      setDateLabel(formatDate(dayjs(ts), i18n.language));
    };

    const showBriefly = () => {
      computeTopMessage();
      setVisible(true);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      hideTimerRef.current = setTimeout(() => setVisible(false), 1500);
    };

    const handleScroll = () => showBriefly();

    computeTopMessage();
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", handleScroll);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [containerId, i18n.language]);

  if (!dateLabel) return null;

  return (
    <div
      className={clsx(
        "pointer-events-none absolute top-2 left-1/2 -translate-x-1/2 z-10",
        "rounded-full px-3 py-1 ts-mini font-medium",
        "bg-bg-elevated/90 backdrop-blur border border-border-subtle text-fg-subtle shadow-sm",
        "transition-opacity duration-200",
        visible ? "opacity-100" : "opacity-0"
      )}
    >
      {dateLabel}
    </div>
  );
};

export default FloatingDate;
