import React, { ReactNode } from "react";

type TipProps = { title: ReactNode; desc: ReactNode };
export const ConfigTip = ({ title, desc }: TipProps) => {
  return (
    <div className="flex flex-col text-sm">
      <h2 className="font-semibold text-fg-primary">{title}</h2>
      <p className="text-fg-secondary text-xs">{desc}</p>
    </div>
  );
};
