/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_MAPTILER_API_KEY: string;
	// add more environment variables here as needed
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
