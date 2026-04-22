import { useEffect, useState } from "react";
import { initializeApp } from "firebase/app";
import { getMessaging, getToken } from "firebase/messaging";

import { firebaseConfig, KEY_DEVICE_TOKEN } from "@/app/config";

const useDeviceToken = (vapidKey: string) => {
  const [token, setToken] = useState<string>("");

  useEffect(() => {
    if (!navigator.serviceWorker) return;

    let cancelled = false;

    const fetchToken = async () => {
      try {
        // Wait for SW to be fully active before requesting FCM token.
        // Without this, getToken() fails when called before SW is ready (e.g. on first mount).
        await navigator.serviceWorker.ready;
        if (cancelled) return;

        const messaging = getMessaging(initializeApp(firebaseConfig));
        const currentToken = await getToken(messaging, { vapidKey });
        if (cancelled) return;

        if (currentToken) {
          setToken(currentToken);
          localStorage.setItem(KEY_DEVICE_TOKEN, currentToken);
        }
      } catch (err) {
        console.info("FCM token error:", err);
      }
    };

    fetchToken();

    return () => {
      cancelled = true;
    };
  }, [vapidKey]);

  return token;
};

export default useDeviceToken;
