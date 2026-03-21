import { App, PluginSettingTab, Setting } from "obsidian";
import Traitor from "./main";

export interface TraitorSettings {
	traitsFolder: string;
	warnOnMissingTraits: boolean;
	traitTagPrefix: string;
}

export const DEFAULT_SETTINGS: TraitorSettings = {
	traitsFolder: "_traits",
	warnOnMissingTraits: true,
	traitTagPrefix: "trait",
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

		new Setting(containerEl)
			.setName("Trait tag prefix")
			.setDesc("Tag root used to detect traits, for example trait/person or trait/media/music.")
			.addText((text) => {
				text.setPlaceholder("trait").setValue(this.plugin.settings.traitTagPrefix);
				text.inputEl.addEventListener("change", async () => {
					await this.plugin.updateTraitTagPrefix(text.inputEl.value);
					text.setValue(this.plugin.settings.traitTagPrefix);
				});
			});

		new Setting(containerEl)
			.setName("Warn about missing trait definitions")
			.setDesc("Show warnings when a trait tag exists but no trait definition file is found.")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.warnOnMissingTraits).onChange(async (value) => {
					this.plugin.settings.warnOnMissingTraits = value;
					await this.plugin.saveSettings();
					this.plugin.refreshWarningsForActiveView();
				}),
			);

		containerEl.createEl("p", {
			text: "Trait files: path under the traits folder is the trait id (person.md is person; media/music.md is media/music). Frontmatter: description and a properties map (for example properties.status.type = string and properties.status.required = true). On notes, use nested tags with your configured prefix followed by the id; for prefix trait, trait/media/music applies both media and media/music.",
		});
	}
}
