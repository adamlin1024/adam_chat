import { FC, PropsWithChildren, ReactNode } from "react";
import { NavLink } from "react-router-dom";
import clsx from "clsx";

import IconBack from "@/assets/icons/arrow.left.svg";
import MobileNavs from "../routes/home/MobileNavs";
import { Nav } from "../routes/settingChannel/navs";
import GoBackNav from "./GoBackNav";

// import ErrorCatcher from "./ErrorCatcher";
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
            <IconBack className="dark:fill-gray-400" /> {title}
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
          {/* <ErrorCatcher> */}
          {children}
          {/* </ErrorCatcher> */}
        </div>
      </div>
      {!nav && <MobileNavs />}
    </>
  );
};

export default StyledSettingContainer;
