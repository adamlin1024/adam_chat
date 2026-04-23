import { ReactNode } from "react";
import * as Popover from "@radix-ui/react-popover";

type EmojiPopupProps = {
  control: ReactNode;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  children: ReactNode;
};

export function EmojiPopup({ control, isOpen, setIsOpen, children }: EmojiPopupProps) {
  return (
    <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
      <Popover.Trigger asChild>{control}</Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="top"
          align="end"
          alignOffset={0}
          sideOffset={8}
          className="z-[100] rounded-lg overflow-hidden shadow-xl bg-bg-elevated border border-border-subtle"
        >
          {children}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
