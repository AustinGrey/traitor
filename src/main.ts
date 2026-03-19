import { App, Editor, MarkdownView, Modal, Notice, Plugin } from "obsidian";
import { createApp, type App as VueApp } from "vue";
import {DEFAULT_SETTINGS, TraitorSettings, TraitorSettingsTab} from "./settings";
import SampleModalView from "./ui/SampleModalView.vue";

export default class Traitor extends Plugin {
	settings: TraitorSettings;

	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		this.addRibbonIcon('dice', 'Sample', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			new Notice('This is a notice!');
		});

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-modal-simple',
			name: 'Open modal (simple)',
			callback: () => {
				new SampleModal(this.app).open();
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new TraitorSettingsTab(this.app, this));
	}

	onunload() {
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<TraitorSettings>);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleModal extends Modal {
	private vueApp: VueApp<Element> | null = null;

	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		const mountEl = contentEl.createDiv({ cls: "traitor-modal-root" });
		this.vueApp = createApp(SampleModalView);
		this.vueApp.mount(mountEl);
	}

	onClose() {
		this.vueApp?.unmount();
		this.vueApp = null;

		const {contentEl} = this;
		contentEl.empty();
	}
}
