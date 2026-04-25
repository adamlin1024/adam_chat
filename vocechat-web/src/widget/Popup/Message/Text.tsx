// import React from 'react';
import clsx from "clsx";

import { useWidget } from "../../WidgetContext";

type Props = {
  uid: number;
  host?: boolean;
  content: string;
  sending: boolean;
};

const Text = ({ content, host, sending }: Props) => {
  const { color, fgColor } = useWidget();

  return host ? (
    <div
      className="text-md text-fg-primary bg-bg-app rounded-lg px-3 py-1.5 break-words"
      style={{ maxWidth: "min(((100vw - 56px) - 20px) - 64px, 360px)" }}
    >
      {content}
    </div>
  ) : (
    <div
      className={clsx(
        "text-md text-accent-on bg-accent rounded-lg px-3 py-1.5 transition-all break-words",
        sending ? "opacity-70" : ""
      )}
      style={{
        maxWidth: "min(((100vw - 56px) - 20px) - 64px, 360px)",
        backgroundColor: color,
        color: fgColor
      }}
    >
      {content}
    </div>
  );
};

export default Text;
