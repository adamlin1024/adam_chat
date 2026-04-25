import { ChangeEvent, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import TextareaAutoSize from "react-textarea-autosize";
import { useKey } from "rooks";

import { isMobile } from "../../utils";
import Button from "../styled/Button";

type Props = {
  placeholder: string;
  sendMessage: any;
};
const TextInput = ({ sendMessage, placeholder }: Props) => {
  const { t } = useTranslation();
  const inputRef = useRef(null);
  const [currMsg, setCurrMsg] = useState("");
  const handleMsgChange = (evt: ChangeEvent<HTMLTextAreaElement>) => {
    setCurrMsg(evt.target.value);
  };
  const handleSend = () => {
    if (!currMsg) return;
    // todo
    const msgs = [{ type: "text", content: currMsg }];
    sendMessage(msgs);
    setCurrMsg("");
  };

  useKey(
    "Enter",
    (evt) => {
      evt.preventDefault();
      // return true;
      handleSend();
    },
    {
      when: !isMobile(),
      target: inputRef
    }
  );
  return (
    <div className="md:hidden relative mb-1 p-1 flex items-center w-full text-fg-primary bg-bg-surface rounded-lg">
      <TextareaAutoSize
        // autoFocus
        onFocus={(e) =>
          e.currentTarget.setSelectionRange(
            e.currentTarget.value.length,
            e.currentTarget.value.length
          )
        }
        ref={inputRef}
        className="p-1 w-full min-h-[28px] resize-none bg-transparent text-fg-primary text-sm break-all"
        maxRows={8}
        minRows={1}
        // onKeyDown={handleInputKeydown}
        onChange={handleMsgChange}
        value={currMsg}
        placeholder={placeholder}
      />
      <Button onClick={handleSend} className="mini absolute right-1.5 bottom-1.5">
        {t("action.send")}
      </Button>
    </div>
  );
};

export default TextInput;
