import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/**
 * Capitalizes the first letter of a string and converts the rest to lowercase.
 *
 * @param {string} str - The string to capitalize.
 * @returns {string} - The string with the first letter capitalized.
 */
export function capitalize(str: string): string {
	return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
