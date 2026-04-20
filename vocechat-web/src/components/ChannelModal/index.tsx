import { ChangeEvent, FC, MouseEvent, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import i18n from "@/i18n";
import clsx from "clsx";

import { useCreateChannelMutation, useSendChannelMsgMutation } from "@/app/services/channel";
import { useAppSelector } from "@/app/store";
import { CreateChannelDTO } from "@/types/channel";
import useFilteredUsers from "@/hooks/useFilteredUsers";
import ChannelIcon from "../ChannelIcon";
import Modal from "../Modal";
import Button from "../styled/Button";
import StyledCheckbox from "../styled/Checkbox";
import StyledToggle from "../styled/Toggle";
import User from "../User";
import { shallowEqual } from "react-redux";

interface Props {
  personal?: boolean;
  closeModal: () => void;
}

const ChannelModal: FC<Props> = ({ personal = false, closeModal }) => {
  const { t } = useTranslation("chat");
  const navigateTo = useNavigate();
  const [sendMessage] = useSendChannelMsgMutation();
  const channelData = useAppSelector((store) => store.channels.byId, shallowEqual);
  const loginUser = useAppSelector((store) => store.authData.user, shallowEqual);
  const [data, setData] = useState<CreateChannelDTO>({
    name: "",
    description: "",
    members: loginUser?.uid ? [loginUser.uid] : [],
    is_public: !personal
  });

  const { users, input, updateInput } = useFilteredUsers();
  const [createChannel, { isSuccess, isError, isLoading, data: newChannel }] =
    useCreateChannelMutation();

  const handleToggle = () => {
    const { is_public } = data;
    setData((prev) => {
      return { ...prev, is_public: !is_public };
    });
  };
  const handleCreate = () => {
    // todo: add field validation (maxLength, text format, trim)
    if (!data.name) {
      toast("please input channel name");
      return;
    }
    if (data.is_public) {
      // 公共频道 不必有 members
      delete data.members;
    }
    createChannel(data);
  };

  // todo: delete the following code and use common error handler instead
  useEffect(() => {
    if (isError) {
      toast.error("create new channel failed");
    }
  }, [isError]);

  useEffect(() => {
    const id = typeof newChannel == "object" ? newChannel.gid : newChannel;
    if (isSuccess && id && channelData[id]) {
      const name = channelData[id].name;
      // 发个欢迎消息
      const welcome = i18n.t("welcome_msg", { ns: "chat", name }) ?? "";
      sendMessage({ id, content: welcome, from_uid: loginUser?.uid, type: "text" });
      closeModal();
      toast.success("create new channel success");
      navigateTo(`/chat/channel/${id}`);
    }
  }, [isSuccess, newChannel, channelData]);

  const handleNameInput = (evt: ChangeEvent<HTMLInputElement>) => {
    setData((prev) => ({ ...prev, name: evt.target.value }));
  };

  const handleInputChange = (evt: ChangeEvent<HTMLInputElement>) => {
    updateInput(evt.target.value);
  };

  const toggleCheckMember = ({ currentTarget }: MouseEvent<HTMLLIElement>) => {
    const members = data.members ?? [];
    const { uid } = currentTarget.dataset;
    const uidNum = Number(uid);
    const tmp = members.includes(uidNum)
      ? members.filter((m) => m != uidNum)
      : [...members, uidNum];
    setData((prev) => ({ ...prev, members: tmp }));
  };

  if (!loginUser) return null;
  const { name, members, is_public } = data;
  const loginUid = loginUser.uid;
  return (
    <Modal>
      <div className="flex flex-col md:flex-row max-h-screen md:max-h-[440px] bg-bg-elevated border border-border rounded-xl shadow-overlay overflow-hidden">
        {!is_public && (
          <div className="md:w-[240px] border-r border-border-subtle flex flex-col">
            <div className="sticky top-0 z-[99] border-b border-border-subtle px-3 py-2.5">
              <input
                className="outline-none font-mono text-[12px] w-full bg-transparent text-fg-body placeholder:text-fg-disabled"
                value={input}
                onChange={handleInputChange}
                placeholder={t("search_user_placeholder")}
              />
            </div>
            {users && (
              <ul className="flex flex-col overflow-y-scroll no-scrollbar overflow-x-hidden max-h-80 md:h-[calc(100%_-_44px)]">
                {users.map((u) => {
                  const { uid } = u;
                  const checked = members ? members.includes(uid) : false;
                  return (
                    <li
                      key={uid}
                      data-uid={uid}
                      className="cursor-pointer flex items-center px-3 rounded hover:bg-[#0f1014] transition-colors"
                      onClick={loginUid == uid ? undefined : toggleCheckMember}
                    >
                      <StyledCheckbox
                        disabled={loginUid == uid}
                        readOnly
                        checked={checked}
                        name="cb"
                        id="cb"
                      />
                      <User uid={uid} interactive={false} />
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
        <div
          className={clsx(
            `w-80 md:min-w-[380px] flex flex-col items-start p-7 box-border gap-5`,
            !is_public && "w-[320px]"
          )}
        >
          <div>
            <h3 className="font-bold text-[17px] tracking-tight text-fg-primary mb-1">
              {t("create_channel")}
            </h3>
            <p className="font-mono text-[12px] text-fg-subtle">
              {!is_public ? t("create_private_channel_desc") : t("create_channel_desc")}
            </p>
          </div>
          <div className="w-full flex flex-col justify-start gap-1.5">
            <span className="font-mono text-[10.5px] uppercase tracking-widest text-fg-disabled">{t("channel_name")}</span>
            <div className="relative">
              <input
                className="font-mono text-[12px] text-fg-body rounded-md px-3 py-2 pl-8 border border-border focus:border-border-strong w-full bg-bg-surface outline-none transition-colors placeholder:text-fg-disabled"
                onChange={handleNameInput}
                value={name}
                placeholder="new-channel"
              />
              <ChannelIcon
                personal={!is_public}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 opacity-50"
              />
            </div>
          </div>
          <div className="w-full flex items-center justify-between">
            <span className="font-mono text-[11.5px] text-fg-secondary">{t("private_channel")}</span>
            <StyledToggle
              checked={!is_public}
              disabled={!loginUser?.is_admin}
              onClick={handleToggle}
            />
          </div>
          <div className="w-full flex gap-3 items-center justify-end pt-1">
            <button
              onClick={closeModal}
              className="px-4 py-2 rounded-md font-mono text-[13px] font-bold text-fg-secondary border border-border hover:border-border-strong transition-colors"
            >
              {t("action.cancel", { ns: "common" })}
            </button>
            <button
              disabled={isLoading}
              onClick={handleCreate}
              className="px-4 py-2 rounded-md font-mono text-[13px] font-bold bg-accent text-accent-on hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              {t("action.create", { ns: "common" })}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ChannelModal;
