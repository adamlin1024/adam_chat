import { FC, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";

import { useAppSelector } from "@/app/store";
import { updateInputMode, updateSelectMessages } from "@/app/slices/ui";
import GoBackNav from "@/components/GoBackNav";
import Tooltip from "@/components/Tooltip";
import MessageSearch from "@/components/MessageSearch";
import FavIcon from "@/assets/icons/bookmark.svg";
import IconSearch from "@/assets/icons/search.svg";
import FavListModal from "../FavListModal";
import Layout from "../Layout";
import { VirtualMessageFeedHandle } from "../Layout/VirtualMessageFeed";
import VoiceChat from "../VoiceChat";
import { shallowEqual } from "react-redux";

type Props = {
  uid: number;
  dropFiles?: File[];
};
const DMChat: FC<Props> = ({ uid = 0, dropFiles }) => {
  const { t } = useTranslation();
  const [favModalVisible, setFavModalVisible] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const feedRef = useRef<VirtualMessageFeedHandle>(null);
  const currUser = useAppSelector((store) => store.users.byId[uid], shallowEqual);

  useEffect(() => {
    if (!currUser) {
      navigate("/chat");
    }
  }, [currUser]);

  // 離開 DM 時清掉選取狀態 + markdown 模式，避免下次進來看到殘留
  useEffect(() => {
    return () => {
      if (uid) dispatch(updateSelectMessages({ context: "dm", id: uid, operation: "reset" }));
      dispatch(updateInputMode("text"));
    };
  }, [uid]);

  const handleLocate = (mid: number) => {
    feedRef.current?.scrollToMessage(mid);
  };

  if (!currUser) return null;
  return (
    <>
      <FavListModal visible={favModalVisible} onClose={() => setFavModalVisible(false)} uid={uid} />
      <Layout
        to={uid}
        context="dm"
        dropFiles={dropFiles}
        feedRef={feedRef}
        aside={null}
        header={
          <header className="h-14 flex-shrink-0 box-border px-4 md:px-3 flex items-center gap-2 border-b border-border-subtle bg-bg-canvas relative">
            {searchVisible ? (
              // Search mode: full header = search bar, no back button
              <MessageSearch
                context="dm"
                id={uid}
                onLocate={handleLocate}
                headerInputMode
                onHide={() => setSearchVisible(false)}
              />
            ) : (
              <>
                <GoBackNav />
                {/* Username — left-aligned, ml-7 to clear the absolute GoBackNav on mobile */}
                <span className="flex-1 ml-7 md:ml-0 font-semibold text-sm text-fg-primary truncate">
                  {currUser.name}
                </span>
                {/* Right actions */}
                <ul className="flex items-center gap-2 shrink-0">
                  <li>
                    <button
                      onClick={() => setSearchVisible(true)}
                      className="h-9 w-9 flex-center rounded-md text-fg-subtle hover:text-fg-secondary transition-colors"
                    >
                      <IconSearch className="fill-current w-5 h-5" />
                    </button>
                  </li>
                  <VoiceChat context="dm" id={uid} />
                  <Tooltip tip={t("favs")} placement="left">
                    <li
                      className="h-9 w-9 flex-center cursor-pointer fav text-fg-subtle hover:text-fg-secondary transition-colors"
                      onClick={() => setFavModalVisible(true)}
                    >
                      <FavIcon className="fill-current w-5 h-5" />
                    </li>
                  </Tooltip>
                </ul>
              </>
            )}
          </header>
        }
      />
    </>
  );
};
export default DMChat;
