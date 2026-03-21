import { App, PluginSettingTab, Setting } from "obsidian";
import Traitor from "./main";

export interface TraitorSettings {
	traitsFolder: string;
}

export const DEFAULT_SETTINGS: TraitorSettings = {
	traitsFolder: "_traits",
};

export class TraitorSettingsTab extends PluginSettingTab {
	plugin: Traitor;

	constructor(app: App, plugin: Traitor) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName("Traits folder")
			.setDesc("Folder that contains trait definition Markdown files.")
			.addText((text) =>
				text
					.setPlaceholder("Traits")
					.setValue(this.plugin.settings.traitsFolder)
					.onChange(async (value) => {
						this.plugin.settings.traitsFolder = value.trim() || DEFAULT_SETTINGS.traitsFolder;
						await this.plugin.saveSettings();
						await this.plugin.refreshTraitDefinitions();
						this.plugin.refreshWarningsForActiveView();
					}),
			);

		containerEl.createEl("p", {
			text: "Trait file format: use frontmatter with trait, description, and a properties map. Example: properties.status.type = string and properties.status.required = true.",
		});
	}
}
