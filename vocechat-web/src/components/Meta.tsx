import { useAppSelector } from "@/app/store";
import { useGetServerQuery } from "@/app/services/server";
import { shallowEqual } from "react-redux";

const Meta = () => {
  useGetServerQuery();
  const { name } = useAppSelector((store) => store.server, shallowEqual);
  if (!name) return null;
  return <title>{`${name} Web App`}</title>;
};
export default Meta;
