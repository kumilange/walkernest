import { ReactNode } from "react";
import { House, ShoppingCart, Trees, Coffee } from "lucide-react";
import { twColors } from "@/constants";

export const polygonColorMapping: { [key: string]: string } = {
	result: twColors.apartment,
	apartment: twColors.apartment,
	supermarket: twColors.supermarket,
	park: twColors.park,
	cafe: twColors.cafe,
};