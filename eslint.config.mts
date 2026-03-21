import tseslint from 'typescript-eslint';
import obsidianmd from "eslint-plugin-obsidianmd";
import { globalIgnores } from "eslint/config";

export default tseslint.config(
	{
		languageOptions: {
			parserOptions: {
				projectService: {
					allowDefaultProject: [
						'eslint.config.js',
						'manifest.json'
					]
				},
				tsconfigRootDir: import.meta.dirname,
				extraFileExtensions: ['.json']
			},
		},
	},
	...obsidianmd.configs.recommended,
	{
		files: ["**/*.ts", "**/*.tsx"],
		rules: {
			// TypeScript (with Obsidian's d.ts) handles undefined symbol checks for TS files.
			// This avoids manually curating Obsidian runtime globals like createDiv/createEl/createSpan.
			"no-undef": "off",
		},
	},
	globalIgnores([
		"node_modules",
		"dist",
		"vite.config.mts",
		"eslint.config.js",
		"version-bump.mjs",
		"versions.json",
		"main.js",
	]),
);
