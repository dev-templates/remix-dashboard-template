import type { IconType } from "react-icons";

export interface NavItem {
	title: string;
	href?: string;
	disabled?: boolean;
	external?: boolean;
	icon?: IconType;
	needAdmin?: boolean;
}

export interface NavGroup extends NavItem {
	items: NavItem[];
}

export interface SidebarNavItem extends NavGroup {}
