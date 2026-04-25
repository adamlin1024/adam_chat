import { FC } from "react";

type Props = {};

const Index: FC<Props> = () => {
  return (
    <footer className="text-xs text-fg-body text-center pb-2">
      Host your own{" "}
      <a
        href="https://voce.chat"
        target="_blank"
        rel="noopener noreferrer"
        className="text-fg-secondary"
      >
        voce.chat
      </a>
    </footer>
  );
};

export default Index;
