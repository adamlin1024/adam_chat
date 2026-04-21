import { FC, PropsWithChildren, ReactNode, useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import clsx from "clsx";

import IconBack from "@/assets/icons/arrow.left.svg";
import MobileNavs from "../routes/home/MobileNavs";
import { Nav } from "../routes/settingChannel/navs";
import GoBackNav from "./GoBackNav";

export interface Danger {
  title: string;
  handler: () => void;
}

interface Props {
  pathPrefix?: string;
  closeModal: () => void;
  title?: string;
  navs: Nav[];
  dangers: [Danger | boolean] | [];
  nav?: { title: string; name?: string; component?: ReactNode };
}

const StyledSettingContainer: FC<PropsWithChildren<Props>> = ({
  pathPrefix = "/setting",
  closeModal,
  title = "Settings",
  navs = [],
  dangers = [],
  nav,
  children
}) => {
  const [animated, setAnimated] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => setAnimated(true)));
    return () => setAnimated(false);
  }, []);

  const isMobile = window.innerWidth < 768;

  const handleDragStart = (e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  const handleDragMove = (e: React.TouchEvent) => {
    const delta = e.touches[0].clientY - dragStartY.current;
    if (delta > 0) setDragOffset(delta);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    const threshold = 80;
    if (dragOffset > threshold) {
      const sheetH = sheetRef.current?.offsetHeight ?? window.innerHeight;
      setDragOffset(sheetH);
      setAnimated(false);
      setTimeout(() => {
        setDragOffset(0);
        closeModal();
      }, 280);
    } else {
      setDragOffset(0);
    }
  };

  if (isMobile) {
    return (
      <div className="fixed inset-0 z-[150]">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50 transition-opacity duration-300"
          style={{ opacity: animated ? 1 : 0 }}
          onClick={closeModal}
        />
        {/* Sheet */}
        <div
          ref={sheetRef}
          className="absolute bottom-0 left-0 right-0 bg-bg-sidebar flex flex-col overflow-hidden"
          style={{
            height: "92vh",
            borderRadius: "10px 10px 0 0",
            transform: dragOffset > 0
              ? `translateY(${dragOffset}px)`
              : (animated ? "translateY(0)" : "translateY(100%)"),
            transition: isDragging ? "none" : "transform 320ms cubic-bezier(0.32,0.72,0,1)",
          }}
        >
          {/* Sheet header — drag area */}
          <div
            className="flex items-center justify-between px-4 py-3 border-b border-border-subtle shrink-0 touch-none select-none"
            onTouchStart={handleDragStart}
            onTouchMove={handleDragMove}
            onTouchEnd={handleDragEnd}
          >
            {nav ? (
              <NavLink to={pathPrefix} className="p-1 -ml-1">
                <IconBack className="w-5 h-5 fill-fg-secondary" />
              </NavLink>
            ) : (
              <div className="w-7" />
            )}
            <span className="font-semibold text-sm text-fg-primary">
              {nav ? nav.title : title}
            </span>
            <button onClick={closeModal} className="text-fg-subtle p-1 text-lg leading-none">✕</button>
          </div>

          {/* 選單列表 或 子頁內容 */}
          <div className="flex-1 overflow-y-auto">
            {!nav ? (
              <div className="px-4 py-4">
                {navs.map(({ title: groupTitle, items }) => (
                  <div key={groupTitle} className="mb-6">
                    {groupTitle && (
                      <div className="font-mono text-[10px] text-fg-subtle uppercase tracking-widest mb-2 px-1">
                        {groupTitle}
                      </div>
                    )}
                    <ul className="flex flex-col">
                      {items.map(({ name, link, title: itemTitle }) => (
                        <li key={name} className="border-b border-border-subtle last:border-0">
                          {link ? (
                            <a href={link} target="_blank" rel="noreferrer"
                              className="flex items-center justify-between px-1 py-3.5 text-[14px] text-fg-body">
                              {itemTitle} <span className="text-xs text-fg-subtle">↗</span>
                            </a>
                          ) : (
                            <NavLink to={`${pathPrefix}/${name}`}
                              className="flex items-center justify-between px-1 py-3.5 text-[14px] text-fg-body">
                              {itemTitle}
                              <IconBack className="w-3.5 h-3.5 fill-fg-subtle rotate-180" />
                            </NavLink>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                {dangers.map((d) => {
                  if (typeof d === "boolean" || !d) return null;
                  return (
                    <button key={d.title} onClick={d.handler}
                      className="w-full text-left px-1 py-3.5 text-[14px] text-red-400 border-t border-border-subtle">
                      {d.title}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="px-4 py-4">{children}</div>
            )}
          </div>
          <div style={{ paddingBottom: "env(safe-area-inset-bottom)" }} />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-screen h-screen flex">
        <div
          className={clsx(
            "h-full w-full overflow-y-scroll md:max-w-[212px] px-4 py-8 bg-bg-sidebar",
            nav && "hidden md:block"
          )}
        >
          <h2
            onClick={closeModal}
            className="hidden md:flex gap-2 items-center text-sm md:text-base cursor-pointer mb-8 font-bold text-fg-primary"
          >
            <IconBack className="w-5 h-5 dark:fill-gray-400" /> {title}
          </h2>
          {navs.map(({ title, items }) => {
            return (
              <ul
                key={title}
                data-title={title}
                className="flex flex-col gap-0.5 mb-5 md:mb-9 before:md:pl-3 before:content-[attr(data-title)] before:font-bold before:text-xs before:text-gray-400"
              >
                {items.map(({ name, link, title }) => {
                  if (link)
                    return (
                      <li
                        key={name}
                        className={clsx(
                          `md:text-sm font-semibold text-fg-secondary whitespace-nowrap md:rounded md:hover:bg-bg-surface transition-colors duration-200`,
                          name == nav?.name && "bg-bg-surface shadow-inset-hairline text-fg-primary"
                        )}
                      >
                        <a
                          href={link}
                          target="_blank"
                          className="block md:px-3 py-1"
                          rel="noreferrer"
                        >
                          {title} <span className="text-xs mx-1">🔗</span>
                        </a>
                      </li>
                    );
                  return (
                    <li
                      key={name}
                      className={clsx(
                        `md:text-sm font-semibold text-fg-secondary whitespace-nowrap md:rounded md:hover:bg-bg-surface transition-colors duration-200`,
                        name == nav?.name && "bg-bg-surface shadow-inset-hairline text-fg-primary"
                      )}
                    >
                      <NavLink to={`${pathPrefix}/${name}`} className="block md:px-3 py-1">
                        {title}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            );
          })}
          {dangers.length ? (
            <ul className="flex flex-col gap-2 mb-9 md:text-sm font-semibold text-red-500 dark:text-red-400">
              {dangers.map((d) => {
                if (typeof d === "boolean" || !d) return null;
                const { title, handler } = d;
                return (
                  <li
                    key={title}
                    onClick={handler}
                    className="rounded cursor-pointer py-1.5 md:px-3"
                  >
                    {title}
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
        <div
          className={clsx(
            "relative bg-bg-canvas w-full max-h-full overflow-auto px-4 md:px-8 py-2 md:py-8",
            !nav ? "hidden md:block" : "!pb-4"
          )}
        >
          <GoBackNav path={pathPrefix} className="!left-1 top-1.5" />
          {nav && (
            <h4 className="font-bold text-xl text-center md:text-left text-fg-primary mb-4 md:mb-8 pl-4 md:pl-0">
              {nav.title}
            </h4>
          )}
          {children}
        </div>
      </div>
      {!nav && <MobileNavs />}
    </>
  );
};

export default StyledSettingContainer;
