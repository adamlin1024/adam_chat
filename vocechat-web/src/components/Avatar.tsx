import { FC, ImgHTMLAttributes, useState } from "react";

import { getInitials } from "../utils";

interface Props extends ImgHTMLAttributes<HTMLImageElement> {
  // className?: string;
  // alt?: string;
  // src?: string;
  width: number;
  height: number;
  name?: string;
  type?: "user" | "channel";
}

function getFontSize(width: number): number {
  if (width <= 16) return 8;
  if (width <= 24) return 12;
  if (width <= 32) return 16;
  if (width <= 40) return 18;
  if (width <= 56) return 22;
  if (width <= 80) return 48;
  return 64;
}

const Avatar: FC<Props> = ({
  src = "",
  name = "Deleted User",
  type = "user",
  width,
  height,
  ...rest
}) => {
  const [error, setError] = useState(false);
  const handleError = () => {
    setError(true);
  };
  if (!error && src) {
    return <img width={width} height={height} src={src} onError={handleError} {...rest} />;
  }
  // 长度限制在六个字符
  let initials = getInitials(name).substring(0, 6);
  const len = initials.length;
  const scaleVal = len > 2 ? (11 - len) / 10 : 1;

  // avatar fallback 色盤（依 name hashCode 選色）
  const userColors = ["#5eead4", "#10b981", "#8b5cf6", "#ec4899", "#f97316", "#3b82f6"];
  const hashCode = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const fallbackBg = type === "channel" ? "#3b82f6" : userColors[hashCode % userColors.length];
  const fallbackColor = type === "channel" ? "#ffffff" : "#042f2e";
  const shapeClass = type === "channel" ? "rounded-md" : "rounded-full";

  return (
    <div
      className={`flex-center ${shapeClass} ${rest.className || ""}`}
      style={{
        width,
        height,
        fontSize: getFontSize(width),
        fontWeight: 600,
        fontFamily: "Inter, -apple-system, sans-serif",
        background: fallbackBg,
        color: fallbackColor,
      }}
    >
      <span className="whitespace-nowrap" style={{ transform: `scale(${scaleVal})` }}>
        {initials}
      </span>
    </div>
  );
};

export default Avatar;
