import {App, PluginSettingTab, Setting} from "obsidian";
import { createApp, type App as VueApp } from "vue";
import Traitor from "./main";
import SampleSettingsView from "./ui/SampleSettingsView.vue";

export interface TraitorSettings {
	mySetting: string;
}

export const DEFAULT_SETTINGS: TraitorSettings = {
	mySetting: 'default'
}

export class TraitorSettingsTab extends PluginSettingTab {
	plugin: Traitor;
	private vueApp: VueApp<Element> | null = null;

	constructor(app: App, plugin: Traitor) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();
		this.vueApp?.unmount();
		this.vueApp = null;

		new Setting(containerEl).setName("Traitor settings");
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
