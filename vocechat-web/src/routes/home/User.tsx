import { FC } from "react";
import { NavLink, useLocation } from "react-router-dom";

import { useAppSelector } from "@/app/store";
import Avatar from "@/components/Avatar";
import { shallowEqual } from "react-redux";

interface Props {
  uid: number;
}

const User: FC<Props> = ({ uid }) => {
  const { pathname } = useLocation();
  const user = useAppSelector((store) => store.users.byId[uid], shallowEqual);
  if (!user) return null;

  return (
    <div className="px-3 pt-3 pb-2 invisible md:visible">
      <NavLink to={`/setting/my_account?f=${pathname}`}>
        <div className="relative group flex h-9 w-9 items-center justify-center rounded-full
                        bg-gradient-to-br from-teal-300 to-cyan-500 cursor-pointer
                        hover:shadow-inset-hairline transition-shadow duration-[120ms]">
          <Avatar
            className="object-cover w-full h-full rounded-full"
            width={36}
            height={36}
            src={user.avatar}
            name={user.name}
          />
        </div>
      </NavLink>
    </div>
  );
};

export default User;
