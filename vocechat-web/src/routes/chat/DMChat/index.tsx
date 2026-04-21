import { FC, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAppSelector } from "@/app/store";
import GoBackNav from "@/components/GoBackNav";
import Tooltip from "@/components/Tooltip";
import MessageSearch from "@/components/MessageSearch";
import FavIcon from "@/assets/icons/bookmark.svg";
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
  const [favModalVisible, setFavModalVisible] = useState(false);
  const navigate = useNavigate();
  const feedRef = useRef<VirtualMessageFeedHandle>(null);
  const currUser = useAppSelector((store) => store.users.byId[uid], shallowEqual);
  
  useEffect(() => {
    if (!currUser) {
      // user不存在了 回首页
      navigate("/chat");
    }
  }, [currUser]);
  
  const handleLocate = (mid: number) => {
    feedRef.current?.scrollToMessage(mid);
  };
  
  if (!currUser) return null;
  return (
    <Layout
      to={uid}
      context="dm"
      dropFiles={dropFiles}
      feedRef={feedRef}
      aside={
        <ul className="flex flex-col gap-6">
          <VoiceChat context={`dm`} id={uid} />
          <Tooltip tip="Saved Items" placement="left">
            <li className="relative cursor-pointer fav" onClick={() => setFavModalVisible(true)}>
              <FavIcon className="fill-fg-subtle hover:fill-fg-secondary transition-colors" />
            </li>
          </Tooltip>
          <FavListModal visible={favModalVisible} onClose={() => setFavModalVisible(false)} uid={uid} />
        </ul>
      }
      header={
        <header className="h-14 flex-shrink-0 box-border px-4 md:px-3 flex items-center border-b border-border-subtle bg-bg-canvas relative">
          <GoBackNav />
          <span className="absolute left-1/2 -translate-x-1/2 font-semibold text-sm text-fg-primary truncate max-w-[60%]">
            {currUser.name}
          </span>
          <div className="ml-auto">
            <MessageSearch context="dm" id={uid} onLocate={handleLocate} />
          </div>
        </header>
      }
    />
  );
};
export default DMChat;
