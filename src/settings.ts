import { App, PluginSettingTab } from "obsidian";
import { createApp, type App as VueApp } from "vue";
import MyPlugin from "./main";
import SampleSettingsView from "./ui/SampleSettingsView.vue";

export interface MyPluginSettings {
	mySetting: string;
}

export const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default'
}

export class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;
	private vueApp: VueApp<Element> | null = null;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();
		this.vueApp?.unmount();
		this.vueApp = null;

		containerEl.createEl("h2", { text: "Sample settings" });
		const mountEl = containerEl.createDiv({ cls: "traitor-settings-root" });

		this.vueApp = createApp(SampleSettingsView, {
			initialValue: this.plugin.settings.mySetting,
			onSave: async (value: string) => {
				this.plugin.settings.mySetting = value;
				await this.plugin.saveSettings();
			},
		});
		this.vueApp.mount(mountEl);
	}

	hide(): void {
		this.vueApp?.unmount();
		this.vueApp = null;
	}
}
