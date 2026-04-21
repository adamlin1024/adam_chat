import { useTranslation } from "react-i18next";
import SettingBlock from "@/components/SettingBlock";
import StyledRadio from "@/components/styled/Radio";
import { useChatLayout, ChatLayoutMode } from "@/hooks/useChatLayout";

const Index = () => {
  const { mode, setMode } = useChatLayout();
  const { t } = useTranslation("setting", { keyPrefix: "overview.chat_layout" });

  return (
    <SettingBlock title={t("title")} desc={t("desc")}>
      <StyledRadio
        options={[t("left"), t("self_right"), t("alternating")]}
        values={["Left", "Right", "Alternating"] as ChatLayoutMode[]}
        value={mode}
        onChange={setMode}
      />
    </SettingBlock>
  );
};

export default Index;
