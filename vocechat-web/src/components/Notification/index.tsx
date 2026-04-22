import { memo, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { vapidKey } from "@/app/config";
import { useUpdateDeviceTokenMutation } from "@/app/services/auth";
import useDeviceToken from "./useDeviceToken";

let lastSentToken = "";
const Notification = () => {
  const navigateTo = useNavigate();
  const token = useDeviceToken(vapidKey);
  const [updateDeviceToken] = useUpdateDeviceTokenMutation();
  useEffect(() => {
    if (!token || token === lastSentToken) return;
    lastSentToken = token;
    updateDeviceToken(token).catch(() => {
      lastSentToken = "";
    });
  }, [token]);

  useEffect(() => {
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      const { newPath } = event.data;
      if (newPath) {
        navigateTo(newPath);
      }
    };
    // https only
    navigator.serviceWorker?.addEventListener("message", handleServiceWorkerMessage);
    return () => {
      navigator.serviceWorker?.removeEventListener("message", handleServiceWorkerMessage);
    };
  }, []);

  return null;
};

export default memo(Notification);
