import { useTranslation } from "react-i18next";
import SettingBlock from "@/components/SettingBlock";
import StyledRadio from "@/components/styled/Radio";
import { useFontSize, FontSize } from "@/hooks/useFontSize";

const Index = () => {
  const { size, setSize } = useFontSize();
  const { t } = useTranslation("setting", { keyPrefix: "overview.font_size" });

  return (
    <SettingBlock title={t("title")} desc={t("desc")}>
      <StyledRadio
        options={[t("small"), t("medium"), t("large")]}
        values={["small", "medium", "large"] as FontSize[]}
        value={size}
        onChange={setSize}
      />
    </SettingBlock>
  );
};

export default Index;
