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
			text: "Trait files: path under the traits folder is the trait id (person.md is person; media/music.md is media/music). Frontmatter: description and a properties map (for example properties.status.type = string and properties.status.required = true). On notes, use nested tags trait/ followed by the id; trait/media/music applies both media and media/music.",
		});
	}
}
