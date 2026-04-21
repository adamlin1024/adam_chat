import { useState, useEffect } from "react";
import { GroupAnnouncement } from "@/types/sse";

export default function useAnnouncementDisplay(cid: number, announcement?: GroupAnnouncement | null) {
  const [showModal, setShowModal] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    if (!announcement || !cid) {
      setShowModal(false);
      setShowBanner(false);
      return;
    }

    const storageKey = `announcement_read_${cid}`;
    const storedTimestamp = localStorage.getItem(storageKey);

    if (!storedTimestamp || new Date(storedTimestamp) < new Date(announcement.updated_at)) {
      setShowModal(true);
      setShowBanner(false);
      setBannerDismissed(false);
    } else {
      setShowModal(false);
      setShowBanner(true);
    }
  }, [announcement, cid]);

  const handleModalClose = () => {
    if (announcement) {
      localStorage.setItem(
        `announcement_read_${cid}`,
        new Date(announcement.updated_at).toISOString()
      );
    }
    setShowModal(false);
    setShowBanner(true);
  };

  const handleBannerExpand = () => setShowModal(true);
  const handleBannerDismiss = () => setBannerDismissed(true);

  return {
    showModal,
    showBanner,
    bannerDismissed,
    handleModalClose,
    handleBannerExpand,
    handleBannerDismiss,
  };
}
