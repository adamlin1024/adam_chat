import { ChangeEvent, FC, MouseEvent, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

import useFilteredChannels from "@/hooks/useFilteredChannels";
import useFilteredUsers from "@/hooks/useFilteredUsers";
import useForwardMessage from "@/hooks/useForwardMessage";
import useSendMessage from "@/hooks/useSendMessage";
import CloseIcon from "@/assets/icons/close.circle.svg";
import Channel from "../Channel";
import Reply from "../Message/Reply";
import Modal from "../Modal";
import Button from "../styled/Button";
import StyledCheckbox from "../styled/Checkbox";
import Input from "../styled/Input";
import User from "../User";

interface IProps {
  mids: number[];
  closeModal: () => void;
}

const ForwardModal: FC<IProps> = ({ mids, closeModal }) => {
  const { t } = useTranslation();
  const [appendText, setAppendText] = useState("");
  const { sendMessages } = useSendMessage();
  const { forwardMessage, forwardMessageOneByOne, forwarding } = useForwardMessage();
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  const [selectedChannels, setSelectedChannels] = useState<number[]>([]);
  const [forwardOneByOne, setForwardOneByOne] = useState(false);
  const {
    channels,
    // input: channelInput,
    updateInput: updateChannelInput
  } = useFilteredChannels();
  const { users, input, updateInput } = useFilteredUsers();
  const toggleCheck = ({ currentTarget }: MouseEvent<HTMLLIElement>) => {
    const { id = 0, type = "user" } = currentTarget.dataset;
    const ids = type == "user" ? selectedMembers : selectedChannels;
    const updateState = type == "user" ? setSelectedMembers : setSelectedChannels;
    let tmp = ids.includes(+id) ? ids.filter((m) => m != id) : [...ids, +id];
    updateState(tmp);
  };
  const updateAppendText = (evt: ChangeEvent<HTMLInputElement>) => {
    setAppendText(evt.target.value);
  };
  const handleForward = async () => {
    if (forwardOneByOne) {
      await forwardMessageOneByOne({
        mids: mids.map((mid) => +mid),
        users: selectedMembers,
        channels: selectedChannels
      });
    } else {
      await forwardMessage({
        mids: mids.map((mid) => +mid),
        users: selectedMembers,
        channels: selectedChannels
      });
    }
    if (appendText.trim()) {
      await sendMessages({
        content: appendText,
        users: selectedMembers,
        channels: selectedChannels
      });
    }
    toast.success(t("tip.forward_success", { ns: "common" }));
    closeModal();
  };
  const removeSelected = (id: number, from = "user") => {
    if (from == "user") {
      setSelectedMembers(selectedMembers.filter((m) => m != id));
    } else {
      setSelectedChannels(selectedChannels.filter((cid) => cid != id));
    }
  };
  const handleSearchChange = (evt: ChangeEvent<HTMLInputElement>) => {
    const newVal = evt.target.value;
    updateChannelInput(newVal);
    updateInput(newVal);
  };
  let selectedCount = selectedMembers.length + selectedChannels.length;
  const sendButtonDisabled =
    (selectedChannels.length == 0 && selectedMembers.length == 0) || forwarding;
  return (
    <Modal>
      <div className="flex flex-col md:flex-row w-[calc(100vw-2rem)] max-w-[820px] h-[80vh] max-h-[600px] bg-bg-elevated drop-shadow rounded-lg overflow-hidden border border-border-subtle">
        {/* 左：搜尋 + 對象列表 */}
        <div className="flex flex-col flex-1 md:w-[280px] md:flex-none md:border-r md:border-border-subtle min-h-0">
          <div className="px-3 pt-3 pb-2 border-b border-border-subtle">
            <input
              className="w-full px-3 py-2 ts-meta text-fg-primary bg-bg-surface border border-border focus:border-border-strong outline-none rounded-md transition-colors placeholder:text-fg-disabled"
              value={input}
              onChange={handleSearchChange}
              placeholder={t("placeholder.search_user_or_channel", { ns: "common" })}
            />
          </div>
          <ul className="flex-1 overflow-y-auto py-1">
            {channels?.map((c) => {
              const { gid } = c;
              const checked = selectedChannels.includes(gid);
              return (
                <li
                  key={gid}
                  data-type="channel"
                  data-id={gid}
                  className="cursor-pointer flex items-center gap-2 px-3 py-1.5 hover:bg-bg-hover transition-colors"
                  onClick={toggleCheck}
                >
                  <StyledCheckbox readOnly checked={checked} name="cb" id="cb" />
                  <Channel id={gid} interactive={false} />
                </li>
              );
            })}
            {users?.map((u) => {
              const { uid } = u;
              const checked = selectedMembers.includes(uid);
              return (
                <li
                  key={uid}
                  data-id={uid}
                  data-type="user"
                  className="cursor-pointer flex items-center gap-2 px-3 py-1.5 hover:bg-bg-hover transition-colors"
                  onClick={toggleCheck}
                >
                  <StyledCheckbox readOnly checked={checked} name="cb" id="cb" />
                  <User uid={uid} interactive={false} />
                </li>
              );
            })}
          </ul>
        </div>

        {/* 右：已選對象 + 訊息預覽 + 操作 */}
        <div className="flex flex-col flex-1 min-h-0 md:w-[320px] md:flex-none">
          <div className="px-3 pt-3 pb-2 border-b border-border-subtle">
            <h3 className="ts-meta font-semibold text-fg-primary">
              {t("forward_to", { ns: "chat" })}
              {selectedCount > 0 && (
                <span className="ml-1 text-fg-secondary">（{selectedCount}）</span>
              )}
            </h3>
          </div>
          <ul className="flex-1 overflow-y-auto py-1 min-h-[80px]">
            {selectedChannels.map((cid) => (
              <li key={cid} className="relative px-3 py-1">
                <Channel id={cid} interactive={false} />
                <CloseIcon
                  className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 fill-fg-secondary"
                  onClick={removeSelected.bind(null, cid, "channel")}
                />
              </li>
            ))}
            {selectedMembers.map((uid) => (
              <li key={uid} className="relative px-3 py-1">
                <User uid={uid} interactive={false} />
                <CloseIcon
                  className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 fill-fg-secondary"
                  onClick={removeSelected.bind(null, uid, "user")}
                />
              </li>
            ))}
          </ul>
          <div className="px-3 pt-2 pb-3 border-t border-border-subtle flex flex-col gap-2">
            <div className="rounded-md p-2 max-h-[120px] overflow-auto bg-bg-surface border border-border-subtle">
              {mids.map((mid) => (
                <Reply key={mid} mid={mid} interactive={false} />
              ))}
            </div>
            <label className="flex items-center gap-2 ts-meta text-fg-body cursor-pointer">
              <StyledCheckbox
                checked={forwardOneByOne}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setForwardOneByOne(e.target.checked)}
                name="forwardType"
                id="forwardType"
              />
              <span>{t("forward_one_by_one", { ns: "chat" })}</span>
            </label>
            <Input
              placeholder={t("placeholder.leave_message", { ns: "common" })}
              value={appendText}
              onChange={updateAppendText}
            />
            <div className="w-full flex items-center justify-end gap-3 pt-1">
              <Button onClick={closeModal} className="normal cancel">
                {t("action.cancel", { ns: "common" })}
              </Button>
              <Button className="normal" disabled={sendButtonDisabled} onClick={handleForward}>
                {t("send_count", { ns: "chat", count: selectedCount })}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
export default ForwardModal;
