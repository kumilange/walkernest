import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		react(),
		// webfontDownload([
		// 	'https://fonts.googleapis.com/css2?family=Noto+Sans:wght@@300;400;600&display=swap',
		// 	'https://fonts.googleapis.com/css2?family=Bungee+Tint&:wght@400&display=swap',
		// ]),
	],
	server: {
		host: true, // Listen on all network interfaces
		port: 5173,
	},
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
		}
	},
});
