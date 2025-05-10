import React from "react";
import { useLocation } from "react-router";
import {
  IoPersonOutline,
  IoBusinessOutline,
  IoPeopleOutline,
} from "react-icons/io5";
import SecondarySidebar from "../common/SecondarySidebar";

const SettingsSidebar: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <SecondarySidebar title="Settings">
      <SecondarySidebar.Section>
        <SecondarySidebar.Link
          to="/settings/profile"
          isActive={currentPath === "/settings/profile"}
        >
          <IoPersonOutline size={18} />
          Profile
        </SecondarySidebar.Link>

        <SecondarySidebar.Link
          to="/settings/tenants"
          isActive={currentPath === "/settings/tenants"}
        >
          <IoBusinessOutline size={18} />
          Organizations
        </SecondarySidebar.Link>

        <SecondarySidebar.Link
          to="/settings/tenant-users"
          isActive={currentPath === "/settings/tenant-users"}
        >
          <IoPeopleOutline size={18} />
          Organization Users
        </SecondarySidebar.Link>
      </SecondarySidebar.Section>
    </SecondarySidebar>
  );
};

export default SettingsSidebar;
