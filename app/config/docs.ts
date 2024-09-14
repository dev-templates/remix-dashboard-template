import { SidebarNavItem } from "~/types/nav";
import { FaUsers, FaToolbox, FaCog, FaHome } from "react-icons/fa";
import { PiPassword } from "react-icons/pi";
import { MdDashboard, MdSecurity } from "react-icons/md";

export interface DocsConfig {
  sidebarNav: SidebarNavItem[];
}

export const docsConfig: DocsConfig = {
  sidebarNav: [
    {
      title: "Home",
      icon: FaHome,
      items: [
        {
          title: "Dashboard",
          href: "/dashboard",
          icon: MdDashboard,
        },
      ],
    },
    {
      title: "Settings",
      icon: FaCog,
      items: [
        {
          title: "Password",
          href: "/settings/password",
          icon: PiPassword,
        },
        {
          title: "Security",
          href: "/settings/security",
          icon: MdSecurity,
        },
      ],
    },
    {
      title: "System Management",
      needAdmin: true,
      icon: FaToolbox,
      items: [
        {
          title: "Users",
          href: "/admin/users",
          icon: FaUsers,
        },
      ],
    },
  ],
};
