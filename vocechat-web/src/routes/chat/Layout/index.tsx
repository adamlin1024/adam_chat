import { FC, ReactElement, ReactNode, useEffect, useRef } from "react";
import { useDrop } from "react-dnd";
import { NativeTypes } from "react-dnd-html5-backend";
import { toast } from "react-hot-toast";
import clsx from "clsx";

import { useAppSelector } from "@/app/store";
import { ChatContext } from "@/types/common";
import ImagePreview from "@/components/ImagePreview";
import Send from "@/components/Send";
import useLicense from "@/hooks/useLicense";
import useUploadFile from "@/hooks/useUploadFile";
import IconWarning from "@/assets/icons/warning.svg";
import AddContactTip from "./AddContactTip";
import DMVoice from "./DMVoicing";
import DnDTip from "./DnDTip";
import LicenseUpgradeTip from "./LicenseOutdatedTip";
import LoginTip from "./LoginTip";
import Operations from "./Operations";
import VirtualMessageFeed, { VirtualMessageFeedHandle } from "./VirtualMessageFeed";
import { platform } from "@/utils";
import { shallowEqual } from "react-redux";

/**
 * 底部底座：包住 Send / Operations / LoginTip 等任一者，
 * 即時把當下高度寫進 CSS 變數 --chat-send-h，讓 NewMessageBottomTip
 * 等浮動元件可以準確貼齊「目前底部實際長出來的東西」上緣。
 *
 * - text 模式：高度 ≈ Send 輸入列
 * - emoji / sticker / markdown 撐高：跟著抽高
 * - select / share mode：Operations bar 高度
 * - readonly / reachLimit：LoginTip / LicenseUpgradeTip 高度
 */
const BottomDock: FC<{ selects: boolean; children: ReactNode }> = ({ selects, children }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      document.documentElement.style.setProperty("--chat-send-h", `${el.offsetHeight}px`);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      ro.disconnect();
      document.documentElement.style.removeProperty("--chat-send-h");
    };
  }, []);
  return (
    <div
      ref={ref}
      // pb-safe：黑色透明狀態列模式下 viewport 延伸到 home indicator 下，
      // 沒這個 padding 的話 input bar 下半被 indicator 區蓋掉。桌機 (md:) 不需要。
      className={`px-2 py-0 pb-safe md:p-4 md:pb-4 ${selects ? "selecting" : ""}`}
    >
      {children}
    </div>
  );
};

interface Props {
  readonly?: boolean;
  header: ReactElement;
  aside?: ReactElement | null;
  users?: ReactElement | null;
  voice?: ReactElement | null;
  dropFiles?: File[];
  context: ChatContext;
  to: number;
  feedRef?: React.RefObject<VirtualMessageFeedHandle>;
}

const Layout: FC<Props> = ({
  readonly = false,
  header,
  aside = null,
  feedRef,
  users = null,
  voice = null,
  dropFiles = [],
  context = "channel",
  to
}) => {
  // const { t } = useTranslation('chat');
  const { reachLimit } = useLicense();
  const { addStageFile } = useUploadFile({ context, id: to });
  const inputMode = useAppSelector((store) => store.ui.inputMode, shallowEqual);
  const selects = useAppSelector(
    (store) => store.ui.selectMessages[`${context}_${to}`],
    shallowEqual
  );
  const channelsData = useAppSelector((store) => store.channels.byId, shallowEqual);
  const usersData = useAppSelector((store) => store.users.byId, shallowEqual);
  const [{ isActive }, drop] = useDrop(
    () => ({
      accept: [NativeTypes.FILE],
      drop({ files }) {
        // console.log("iii", inputMode);
        if (inputMode !== "text") {
          toast("DnD not allowed in this input mode", {
            icon: <IconWarning className="w-5 h-5" />
          });
          return;
        }
        if (files.length) {
          const filesData = files.map((file) => {
            const { size, type, name } = file;
            const url = URL.createObjectURL(file);
            return { size, type, name, url };
          });
          addStageFile(filesData);
        }
      },
      collect: (monitor) => ({
        isActive: monitor.canDrop() && monitor.isOver()
      })
    }),
    [context, to, inputMode]
  );

  useEffect(() => {
    if (dropFiles?.length) {
      const filesData = dropFiles.map((file) => {
        const { size, type, name } = file;
        const url = URL.createObjectURL(file);
        return { size, type, name, url };
      });
      addStageFile(filesData);
    }
  }, [dropFiles]);
  const name = context == "channel" ? channelsData[to]?.name : usersData[to]?.name;
  return (
    <>
      <ImagePreview />
      <section id="CHAT_WRAPPER" ref={drop} className={`relative h-full w-full rounded-r-2xl flex`}>
        <main className="flex flex-col flex-1">
          {header}
          <div className="w-full h-full flex items-start justify-between relative">
            <div className="rounded-br-2xl flex flex-col absolute bottom-0 w-full h-full">
              {context == "dm" && <DMVoice uid={to} />}
              {context == "dm" && <AddContactTip uid={to} />}
              {/* 消息流 */}
              <VirtualMessageFeed ref={feedRef} context={context} id={to} />
              {/* 发送框 */}
              <BottomDock selects={selects}>
                {readonly ? (
                  <LoginTip />
                ) : reachLimit ? (
                  <LicenseUpgradeTip />
                ) : (
                  <div className={clsx(`flex justify-center`, selects && "hidden")}>
                    <Send id={to} context={context} feedRef={feedRef} />
                  </div>
                )}
                {selects && <Operations context={context} id={to} />}
              </BottomDock>
            </div>
          </div>
        </main>
        {aside && (
          <div
            className={clsx(
              "hidden md:flex z-50 p-3 absolute right-0 md:translate-x-full flex-col",
              platform().isWindows ? "md:top-5" : "md:top-0"
            )}
          >
            {aside}
          </div>
        )}
        {users && <div className="hidden md:block">{users}</div>}
        {voice && (
          <div className="z-10 max-md:absolute max-md:right-11 max-md:top-14 max-md:overflow-y-scroll bg-bg-elevated dark:!bg-bg-surface md:block">
            {voice}
          </div>
        )}
        {!readonly && inputMode == "text" && isActive && <DnDTip context={context} name={name} />}
      </section>
    </>
  );
};

export default Layout;
