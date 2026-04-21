import { useEffect, useState } from "react";
import { isMobile } from "@/utils";

export type ChatLayoutMode = "Left" | "Right" | "Alternating";
const STORAGE_KEY = "chat_layout_mode";
const EVENT_KEY = "chat_layout_change";
const VALID: ChatLayoutMode[] = ["Left", "Right", "Alternating"];

function readMode(): ChatLayoutMode {
  const stored = localStorage.getItem(STORAGE_KEY) as ChatLayoutMode | null;
  if (stored && VALID.includes(stored)) return stored;
  return isMobile() ? "Alternating" : "Left";
}

export function useChatLayout() {
  const [mode, setModeState] = useState<ChatLayoutMode>(readMode);

  useEffect(() => {
    const handler = () => setModeState(readMode());
    window.addEventListener(EVENT_KEY, handler);
    return () => window.removeEventListener(EVENT_KEY, handler);
  }, []);

  const setMode = (m: ChatLayoutMode) => {
    localStorage.setItem(STORAGE_KEY, m);
    window.dispatchEvent(new Event(EVENT_KEY));
  };

  return { mode, setMode };
}
