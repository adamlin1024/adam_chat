import { FC } from "react";
import toast from "react-hot-toast";
import { Trans, useTranslation } from "react-i18next";

import Button from "./styled/Button";

interface Props {
  id: string;
  handleUpdate: () => void;
}

const Index: FC<Props> = ({ id, handleUpdate }) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col md:flex-row items-center gap-2 whitespace-nowrap">
      <div>
        <Trans i18nKey={"new_version"}>
          <strong className="font-bold" />
        </Trans>
      </div>
      <div className="flex gap-1">
        <Button className="mini main" onClick={handleUpdate}>
          {t("action.update")}
        </Button>
        <Button className="mini cancel" onClick={() => toast.dismiss(id)}>
          {t("action.dismiss")}
        </Button>
      </div>
    </div>
  );
};

export default Index;
