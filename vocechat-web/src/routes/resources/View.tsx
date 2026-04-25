import { MouseEvent } from "react";
import { useDispatch } from "react-redux";
import clsx from "clsx";

import { updateFileListView } from "@/app/slices/ui";
import IconGrid from "@/assets/icons/file.grid.svg";
import IconList from "@/assets/icons/file.list.svg";

const getClass = (selected: boolean) =>
  clsx(
    `cursor-pointer p-2 box-border flex-center`,
    selected && `border border-solid border-accent shadow rounded-lg`
  );
type Props = {
  view?: "item" | "grid";
};
export default function View({ view = "item" }: Props) {
  const dispatch = useDispatch();
  const handleChangeView = (evt: MouseEvent<HTMLLIElement>) => {
    const { view: clickView } = evt.currentTarget.dataset;
    if (clickView == view) return;
    dispatch(updateFileListView(view == "item" ? "grid" : "item"));
  };
  const isGrid = view == "grid";
  return (
    <ul
      className={`hidden md:flex border border-border shadow rounded-lg box-border`}
    >
      <li className={getClass(!isGrid)} data-view={"item"} onClick={handleChangeView}>
        <IconList className={!isGrid ? "fill-accent" : "fill-fg-secondary"} />
      </li>
      <li className={getClass(isGrid)} data-view={"grid"} onClick={handleChangeView}>
        <IconGrid className={isGrid ? "fill-accent" : "fill-fg-secondary"} />
      </li>
    </ul>
  );
}
