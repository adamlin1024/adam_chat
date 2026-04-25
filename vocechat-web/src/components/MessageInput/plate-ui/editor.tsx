import React from "react";
import { PlateContent, useEditorRef } from "@udecode/plate-common";
import { useKey } from "rooks";
import { Transforms, Editor as SlateEditor } from "slate";

import { cn, isMobile } from "@/utils";

import type { PlateContentProps } from "@udecode/plate-common";

export type EditorProps = PlateContentProps & {
  sendMessage: () => void;
};

const Editor = React.forwardRef<HTMLDivElement, EditorProps>(
  ({ id, sendMessage, className, disabled, readOnly, ...props }, ref) => {
    const editorRef = useEditorRef(id);
    useKey(
      "Enter",
      (evt) => {
        if (!editorRef) return;
        if (evt.shiftKey || evt.ctrlKey || evt.altKey || evt.isComposing) {
          return true;
        }
        evt.preventDefault();
        sendMessage();
        const e = editorRef as any;
        Transforms.select(e, SlateEditor.range(e, []));
        Transforms.delete(e);
      },
      {
        when: !isMobile(),
        // @ts-ignore
        target: ref
      }
    );
    return (
      <div ref={ref} className="relative h-fit w-full">
        <PlateContent
          className={cn(
            "relative overflow-hidden whitespace-pre-wrap break-words",
            "w-full rounded-md bg-background ring-offset-background placeholder:text-fg-muted focus-visible:outline-none",
            "[&_[data-slate-placeholder]]:opacity-30",
            "[&_[data-slate-placeholder]]:top-[4px_!important]",
            className
          )}
          spellCheck={false}
          disableDefaultStyles
          readOnly={disabled ?? readOnly}
          aria-disabled={disabled}
          {...props}
        />
      </div>
    );
  }
);
Editor.displayName = "Editor";

export { Editor };
