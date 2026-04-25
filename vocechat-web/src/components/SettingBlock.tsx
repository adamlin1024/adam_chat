import React from "react";

type Props = {
  title: string;
  desc: string;
  toggler?: React.ReactNode;
  children?: React.ReactNode;
};

const SettingBlock = ({ toggler, title, desc, children }: Props) => {
  if (!title) return <div className="min-w-56">{children}</div>;
  return (
    <div className="text-sm w-full">
      <div className="flex items-start justify-between gap-4 mb-2">
        <div className="flex-1 min-w-0">
          <p className="text-fg-primary font-semibold">{title}</p>
          <p className="text-fg-secondary text-xs">{desc}</p>
        </div>
        {toggler && <div className="shrink-0">{toggler}</div>}
      </div>
      {children}
    </div>
  );
};

export default SettingBlock;
