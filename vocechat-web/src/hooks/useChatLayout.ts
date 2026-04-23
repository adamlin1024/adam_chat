import { isMobile } from "@/utils";
import { useUserPref } from "./useUserPref";

export type ChatLayoutMode = "Left" | "Right" | "Alternating";
const VALID: ChatLayoutMode[] = ["Left", "Right", "Alternating"];

export function useChatLayout() {
  const defaultMode: ChatLayoutMode = isMobile() ? "Alternating" : "Left";
  const [stored, setStored] = useUserPref<ChatLayoutMode>("chat_layout_mode", defaultMode);
  const mode: ChatLayoutMode = VALID.includes(stored) ? stored : defaultMode;
  return { mode, setMode: setStored };
}
