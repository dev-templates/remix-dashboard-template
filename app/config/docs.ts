import { FaCog, FaHome, FaToolbox, FaUsers } from "react-icons/fa";
import { MdDashboard, MdSecurity, MdSettings } from "react-icons/md";
import { PiPassword } from "react-icons/pi";
import type { SidebarNavItem } from "~/types/nav";

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
				{
					title: "System Settings",
					href: "/admin/settings",
					icon: MdSettings,
				},
			],
		},
	],
};
