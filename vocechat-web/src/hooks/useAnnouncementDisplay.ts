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

    const readKey = `announcement_read_${cid}`;
    const dismissKey = `announcement_banner_dismissed_${cid}`;
    const storedTimestamp = localStorage.getItem(readKey);
    const isNewOrUpdated = !storedTimestamp || new Date(storedTimestamp) < new Date(announcement.updated_at);

    if (isNewOrUpdated) {
      setShowModal(true);
      setShowBanner(false);
      setBannerDismissed(false);
      localStorage.removeItem(dismissKey);
    } else {
      setShowModal(false);
      const dismissed = localStorage.getItem(dismissKey) === "1";
      setBannerDismissed(dismissed);
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

  const handleBannerDismiss = () => {
    localStorage.setItem(`announcement_banner_dismissed_${cid}`, "1");
    setBannerDismissed(true);
  };

  return {
    showModal,
    showBanner,
    bannerDismissed,
    handleModalClose,
    handleBannerExpand,
    handleBannerDismiss,
  };
}
