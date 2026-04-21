import { FC, useRef } from "react";
import FavList from "./FavList";

type Props = {
  visible: boolean;
  onClose: () => void;
  cid?: number;
  uid?: number;
};

const FavListModal: FC<Props> = ({ visible, onClose, cid, uid }) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  if (!visible) return null;
  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[200] flex items-end md:items-center justify-center"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full md:w-auto md:max-w-lg">
        <FavList cid={cid} uid={uid} />
        <div style={{ paddingBottom: "env(safe-area-inset-bottom)" }} className="md:hidden" />
      </div>
    </div>
  );
};

export default FavListModal;
