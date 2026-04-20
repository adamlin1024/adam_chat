import { FC, FormEvent } from "react";
import { useTranslation } from "react-i18next";

import PinnedMessage from "@/components/PinnedMessage";
import usePinMessage from "@/hooks/usePinMessage";
import IconClose from "@/assets/icons/close.svg";
import IconSurprise from "@/assets/icons/emoji.surprise.svg";

type Props = {
  id: number;
};
const PinList: FC<Props> = ({ id }: Props) => {
  const { t } = useTranslation("chat");
  const { pins, unpinMessage, canPin } = usePinMessage(id);
  const handleUnpin = (evt: FormEvent<HTMLButtonElement>) => {
    const { mid } = evt.currentTarget.dataset;
    if (!mid) return;
    unpinMessage(+mid);
  };
  const noPins = pins.length == 0;
  return (
    <div className="p-3 overflow-y-scroll no-scrollbar min-w-[320px] md:min-w-[460px] md:max-h-[80vh] rounded-xl bg-bg-elevated border border-border shadow-overlay">
      <h4 className="font-mono text-[11px] font-semibold text-fg-subtle uppercase tracking-widest mb-3 px-1">
        {t("pinned_msg")} · {pins.length}
      </h4>
      {noPins ? (
        <div className="flex flex-col items-center gap-2 w-full p-6">
          <IconSurprise className="opacity-30" />
          <div className="font-mono text-[11px] text-fg-disabled text-center">
            {t("pin_empty_tip")}
          </div>
        </div>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {pins.map((data) => {
            return (
              <li
                key={data.mid}
                className="group relative border border-border rounded-md overflow-hidden"
              >
                <PinnedMessage data={data} />
                <div className="invisible group-hover:visible flex items-center gap-1 absolute top-1.5 right-1.5 border border-border bg-bg-surface rounded-sm overflow-hidden">
                  {canPin && (
                    <button
                      className="flex-center w-5 h-5 p-1"
                      data-mid={data.mid}
                      onClick={handleUnpin}
                    >
                      <IconClose className="fill-fg-subtle" />
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
export default PinList;
