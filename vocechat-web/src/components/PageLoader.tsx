import { Ring } from "@uiball/loaders";

const PageLoader = () => (
  <div className="w-full h-full flex items-center justify-center min-h-[160px]">
    <Ring size={26} lineWeight={4} speed={2} color="#52525b" />
  </div>
);

export default PageLoader;
