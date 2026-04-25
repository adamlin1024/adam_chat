import { FC, ReactElement } from "react";
import Tippy from "@tippyjs/react";

import ContextMenu, { Item } from "../ContextMenu";

type Props = {
  visible: boolean;
  hide: () => void;
  children: ReactElement;
  items: Item[];
  mid: number;
};

const MessageContextMenu: FC<Props> = ({ visible, hide, children, items, mid }) => {
  return (
    <Tippy
      visible={visible}
      followCursor={"initial"}
      interactive
      placement="right-start"
      popperOptions={{ strategy: "fixed" }}
      appendTo={() => document.body}
      onClickOutside={hide}
      key={mid}
      content={<ContextMenu hideMenu={hide} items={items} />}
    >
      {children}
    </Tippy>
  );
};
export default MessageContextMenu;
