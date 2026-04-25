import { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { Orbit } from "@uiball/loaders";
import clsx from "clsx";

import IconCancel from "@/assets/icons/close.circle.svg";
import IconEdit from "@/assets/icons/edit.svg";
import IconSave from "@/assets/icons/save.svg";
import { useGetUserByAdminQuery, useUpdateUserMutation } from "../../../app/services/user";

type Props = {
  uid: number;
};

const NameEdit = ({ uid }: Props) => {
  const { t } = useTranslation();
  const formRef = useRef<HTMLFormElement>(null);
  const [editable, setEditable] = useState(false);
  const [name, setName] = useState("");
  const { data, isSuccess, refetch } = useGetUserByAdminQuery(uid);
  const [updateUser, { isSuccess: updateSuccess, isLoading: isUpdating }] = useUpdateUserMutation();
  useEffect(() => {
    if (isSuccess && data) {
      setName(data.name || "");
    }
  }, [data, isSuccess]);
  useEffect(() => {
    if (updateSuccess) {
      refetch();
    }
  }, [updateSuccess]);

  const handleEdit = async () => {
    if (editable && formRef) {
      const form = formRef.current;
      // 检查格式
      if (!form?.checkValidity()) {
        form?.reportValidity();
        return;
      }
      // 保存编辑
      const name = new FormData(form).get("name") as string;
      const resp = await updateUser({ id: uid, name });
      // console.log("ressssss", resp);
      if ("error" in resp) {
        switch (resp.error.status) {
          case 409:
            toast.error(t("tip.bot_name_conflict", { ns: "common" }));
            break;
          default:
            break;
        }
        return;
      }
    }
    setEditable((prev) => !prev);
  };
  const handleCancelEdit = () => {
    setEditable(false);
    const form = formRef.current;
    if (form) {
      const input = form.querySelector("input");
      input!.value = data?.name || "";
    }
  };
  return (
    <div className="flex gap-2">
      <form
        action="/"
        ref={formRef}
        onSubmit={(evt) => {
          evt.preventDefault();
          handleEdit();
        }}
      >
        <input
          readOnly={!editable}
          required
          autoFocus
          name="name"
          defaultValue={name}
          className={clsx(
            "text-fg-primary w-auto",
            editable
              ? "ring-1 ring-border-strong bg-bg-elevated px-2 py-1 bg-bg-app"
              : "bg-transparent"
          )}
        />
      </form>
      <button type="button" title="edit name" disabled={isUpdating} onClick={handleEdit}>
        {isUpdating ? (
          <Orbit size={16} />
        ) : editable ? (
          <IconSave className="stroke-fg-muted !w-5 !h-5" />
        ) : (
          <IconEdit className="fill-fg-muted !w-5 !h-5" />
        )}
      </button>
      {editable && !isUpdating && (
        <button type="button" disabled={isUpdating} onClick={handleCancelEdit}>
          <IconCancel className="!w-5 !h-5 fill-fg-muted" />
        </button>
      )}
    </div>
  );
};

export default NameEdit;
