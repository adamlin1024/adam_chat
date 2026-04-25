import { FC } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

import { useClearAllFilesMutation, useClearAllMessagesMutation } from "@/app/services/server";
import Modal from "@/components/Modal";
import Button from "@/components/styled/Button";
import StyledModal from "@/components/styled/Modal";
import { VisibleModalType } from "./index";

interface Props {
  context: VisibleModalType;
  title: string;
  desc: string;
  closeModal: () => void;
}

// 清除完成後一併把 Service Worker Cache Storage 內含 neko-talk 命名空間的快取整批刪掉。
// 即使 SW 對 /api/resource/file 已強制 conditional revalidation，先前已 put 進 cache 的
// 舊回應仍可能在離線 / 失敗時被當 fallback 餵出來，所以一併清乾淨。
async function purgeImageCaches() {
  if (!("caches" in window)) return;
  try {
    const keys = await caches.keys();
    await Promise.all(
      keys.filter((k) => k.startsWith("neko-talk")).map((k) => caches.delete(k))
    );
  } catch {
    /* 不致命，吞掉 */
  }
}

const ClearConfirmModal: FC<Props> = ({ context, title, desc, closeModal }) => {
  const { t } = useTranslation();
  const [clearFiles, { isLoading: filesClearing }] = useClearAllFilesMutation();
  const [clearMessages, { isLoading: msgClearing }] = useClearAllMessagesMutation();

  const clearing = msgClearing || filesClearing;

  const handleClear = async () => {
    try {
      if (context === "chat") {
        await clearMessages().unwrap();
      } else if (context === "files") {
        await clearFiles().unwrap();
      } else {
        return;
      }
      // 後端清完後同步把瀏覽器這側的 SW image cache 也清掉，避免「真實已沒、快取仍餵舊圖」
      await purgeImageCaches();
      toast.success(t("tip.clear_success", { ns: "common" }));
      closeModal();
      // 強制整頁重載：讓 waiting 中的新版 SW 直接接管 + 清空 in-memory RTK Query state +
      // 跳過任何 HTTP cache 殘影。是「絕對乾淨」的最後一道保險。
      setTimeout(() => window.location.reload(), 200);
    } catch (e) {
      const msg = (e as { data?: { msg?: string } } | undefined)?.data?.msg;
      toast.error(msg || t("tip.failed", { ns: "common", defaultValue: "操作失敗" }));
    }
  };

  return (
    <Modal id="modal-modal">
      <StyledModal
        title={title}
        description={desc}
        buttons={
          <>
            <Button className="cancel" onClick={closeModal} disabled={clearing}>
              {t("action.cancel")}
            </Button>
            <Button onClick={handleClear} className="danger" disabled={clearing}>
              {clearing ? t("tip.processing", { defaultValue: "處理中…" }) : t("action.remove")}
            </Button>
          </>
        }
      />
    </Modal>
  );
};

export default ClearConfirmModal;
