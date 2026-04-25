import { FC, ReactElement } from "react";
import Tippy from "@tippyjs/react";

import IconArrow from "@/assets/icons/arrow.right.svg";
import IconChecked from "@/assets/icons/check.sign.svg";

export interface Item {
  title: string;
  icon?: string | ReactElement;
  handler?: (param: any) => void;
  underline?: boolean;
  danger?: boolean;
  checked?: boolean;
  subs?: Item[];
}

interface Props {
  items: Item[];
  hideMenu?: () => void;
}
const WrapWithSubmenu = ({
  items,
  hideMenu,
  child
}: {
  items: Item[];
  hideMenu: () => void | null;
  child: ReactElement;
}) => {
  return (
    <Tippy
      interactive
      // 子選單固定走右側展開；空間不夠時 Popper 會自動 flip 到 left-start，
      // 不會選到 top/bottom 造成跟主選單垂直重疊。
      placement="right-start"
      offset={[0, 4]}
      trigger="mouseenter focus"
      popperOptions={{ strategy: "fixed" }}
      content={
        <ul className="context-menu">
          {items.map((sub) => {
            const {
              title,
              icon = null,
              handler = (evt) => {
                evt.preventDefault();
                if (hideMenu) {
                  hideMenu();
                }
              },
              underline = false,
              danger = false,
              checked = false
            } = sub;
            return (
              <li
                className={`item group ${underline ? "bottom_line" : ""} ${danger ? "danger" : ""}`}
                key={title}
                onClick={(evt) => {
                  evt.stopPropagation();
                  evt.preventDefault();
                  if (checked) return;
                  handler(evt);
                  if (hideMenu) {
                    hideMenu();
                  }
                }}
              >
                {icon}
                <span className="flex-1">{title}</span>
                {checked && (
                  <IconChecked className="group-hover:fill-fg-body shrink-0 w-3.5 h-3.5 fill-fg-secondary" />
                )}
              </li>
            );
          })}
        </ul>
      }
    >
      {child}
    </Tippy>
  );
};
const ContextMenu: FC<Props> = ({ items = [], hideMenu = null }) => {
  return (
    <ul className="context-menu">
      {items.map((item) => {
        // if (!item) return null;
        const {
          title,
          icon = null,
          handler = (evt) => {
            evt.preventDefault();
            if (hideMenu) {
              hideMenu();
            }
          },
          underline = false,
          danger = false,
          subs = []
        } = item;
        if (subs.length > 0)
          return (
            <WrapWithSubmenu
              key={title}
              items={subs}
              hideMenu={hideMenu}
              child={
                <li
                  className={`item group ${underline ? "bottom_line" : ""} ${
                    danger ? "danger" : ""
                  }`}
                  key={title}
                  onClick={(evt) => {
                    evt.stopPropagation();
                    evt.preventDefault();
                  }}
                >
                  {icon}
                  <span className="flex-1">{title}</span>
                  <IconArrow className="group-hover:fill-fg-body shrink-0 w-3.5 h-3.5 fill-fg-subtle" />
                </li>
              }
            ></WrapWithSubmenu>
          );

        return (
          <li
            className={`item ${underline ? "bottom_line" : ""} ${danger ? "danger" : ""}`}
            key={title}
            onClick={(evt) => {
              evt.stopPropagation();
              evt.preventDefault();
              handler(evt);
              if (hideMenu) {
                hideMenu();
              }
            }}
          >
            {icon}
            {title}
          </li>
        );
      })}
    </ul>
  );
};

export default ContextMenu;
