import { FC } from "react";

const shimmer = "animate-pulse bg-zinc-800";

const SkeletonAvatar = ({ size = "w-8 h-8" }: { size?: string }) => (
  <div className={`${shimmer} ${size} rounded-full shrink-0`} />
);

const SkeletonLine = ({ width = "w-full", height = "h-2.5" }: { width?: string; height?: string }) => (
  <div className={`${shimmer} ${width} ${height} rounded`} />
);

const SkeletonSessionItem = () => (
  <div className="flex items-center gap-2.5 px-3 py-2">
    <SkeletonAvatar size="w-8 h-8" />
    <div className="flex-1 flex flex-col gap-1.5 min-w-0">
      <SkeletonLine width="w-3/4" height="h-2.5" />
      <SkeletonLine width="w-1/2" height="h-2" />
    </div>
  </div>
);

const SkeletonMessage = ({ avatarSide = "left" }: { avatarSide?: "left" | "right" }) => (
  <div className={`flex gap-3 px-4 ${avatarSide === "right" ? "flex-row-reverse" : ""}`}>
    <SkeletonAvatar size="w-8 h-8" />
    <div className={`flex flex-col gap-1.5 max-w-[60%] ${avatarSide === "right" ? "items-end" : ""}`}>
      <SkeletonLine width="w-16" height="h-2" />
      <SkeletonLine width="w-48" height="h-3" />
      <SkeletonLine width="w-36" height="h-3" />
    </div>
  </div>
);

const SkeletonScreen: FC = () => {
  return (
    <div className="flex w-screen h-screen bg-bg-app overflow-hidden">
      {/* Left nav bar */}
      <div className="hidden md:flex h-full w-[60px] flex-col items-center gap-4 pt-4 border-r border-border-subtle shrink-0">
        <SkeletonAvatar size="w-8 h-8" />
        <div className="flex flex-col gap-3 mt-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className={`${shimmer} w-9 h-9 rounded-lg`} />
          ))}
        </div>
        <div className="mt-auto mb-4 flex flex-col gap-2 items-center">
          <div className={`${shimmer} w-7 h-7 rounded-lg`} />
        </div>
      </div>

      {/* Session sidebar */}
      <div className="hidden md:flex h-full w-[240px] flex-col border-r border-border-subtle shrink-0">
        {/* Sidebar header */}
        <div className="px-4 py-3 flex items-center justify-between border-b border-border-subtle">
          <SkeletonLine width="w-20" height="h-3" />
          <div className={`${shimmer} w-6 h-6 rounded`} />
        </div>
        {/* Section label */}
        <div className="px-3 pt-4 pb-1">
          <SkeletonLine width="w-12" height="h-2" />
        </div>
        {/* Session items */}
        <div className="flex flex-col">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <SkeletonSessionItem key={i} />
          ))}
        </div>
        {/* DM section */}
        <div className="px-3 pt-4 pb-1">
          <SkeletonLine width="w-10" height="h-2" />
        </div>
        <div className="flex flex-col">
          {[0, 1, 2].map((i) => (
            <SkeletonSessionItem key={i} />
          ))}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col h-full bg-bg-canvas overflow-hidden">
        {/* Chat header */}
        <div className="px-4 h-14 flex items-center gap-3 border-b border-border-subtle shrink-0">
          <div className={`${shimmer} w-5 h-5 rounded`} />
          <SkeletonLine width="w-28" height="h-3" />
          <div className="ml-auto flex gap-2">
            <div className={`${shimmer} w-7 h-7 rounded`} />
            <div className={`${shimmer} w-7 h-7 rounded`} />
          </div>
        </div>

        {/* Message feed */}
        <div className="flex-1 flex flex-col justify-end gap-5 px-2 py-6 overflow-hidden">
          <SkeletonMessage avatarSide="left" />
          <SkeletonMessage avatarSide="right" />
          <SkeletonMessage avatarSide="left" />
          <SkeletonMessage avatarSide="right" />
          <SkeletonMessage avatarSide="left" />
        </div>

        {/* Input bar */}
        <div className="px-4 py-3 border-t border-border-subtle shrink-0">
          <div className={`${shimmer} w-full h-10 rounded-lg`} />
        </div>
      </div>
    </div>
  );
};

export default SkeletonScreen;
