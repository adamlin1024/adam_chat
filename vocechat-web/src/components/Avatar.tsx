import { FC, HTMLAttributes, useEffect, useState } from "react";

import { getInitials } from "../utils";

interface Props extends HTMLAttributes<HTMLDivElement> {
  width: number;
  height: number;
  src?: string;
  name?: string;
  type?: "user" | "channel";
  alt?: string;
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
  alt,
  ...rest
}) => {
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!src) {
      setError(false);
      return;
    }
    setError(false);
    const img = new Image();
    img.onload = () => setError(false);
    img.onerror = () => setError(true);
    img.src = src;
  }, [src]);

  const shapeClass = type === "channel" ? "rounded-md" : "rounded-full";

  if (!error && src) {
    return (
      <div
        {...rest}
        className={`${shapeClass} ${rest.className || ""}`}
        style={{
          width,
          height,
          backgroundImage: `url(${src})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          flexShrink: 0,
          ...(rest.style || {}),
        }}
      />
    );
  }

  const initials = getInitials(name).substring(0, 6);
  const len = initials.length;
  const scaleVal = len > 2 ? (11 - len) / 10 : 1;

  const userColors = ["#5eead4", "#10b981", "#8b5cf6", "#ec4899", "#f97316", "#3b82f6"];
  const hashCode = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const fallbackBg = type === "channel" ? "#3b82f6" : userColors[hashCode % userColors.length];
  const fallbackColor = type === "channel" ? "#ffffff" : "#042f2e";

  return (
    <div
      {...rest}
      className={`flex-center ${shapeClass} ${rest.className || ""}`}
      style={{
        width,
        height,
        fontSize: getFontSize(width),
        fontWeight: 600,
        fontFamily: "Inter, -apple-system, sans-serif",
        background: fallbackBg,
        color: fallbackColor,
        ...(rest.style || {}),
      }}
    >
      <span className="whitespace-nowrap" style={{ transform: `scale(${scaleVal})` }}>
        {initials}
      </span>
    </div>
  );
};

export default Avatar;
