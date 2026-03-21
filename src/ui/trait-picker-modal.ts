import { App, Modal } from "obsidian";
import { createApp, type App as VueApp } from "vue";
import TraitPicker from "./TraitPicker.vue";

interface TraitPickerModalOptions {
	traitNames: string[];
	selectedTraits: string[];
	tagPrefix: string;
	onSave: (selectedTraits: string[]) => Promise<void>;
	onCreateTrait: () => Promise<void>;
}

export class TraitPickerModal extends Modal {
	private readonly options: TraitPickerModalOptions;
	private vueApp: VueApp | null = null;

	constructor(app: App, options: TraitPickerModalOptions) {
		super(app);
		this.options = options;
	}

	onOpen(): void {
		this.vueApp = createApp(TraitPicker, {
			traitNames: this.options.traitNames,
			initialSelectedTraits: this.options.selectedTraits,
			tagPrefix: this.options.tagPrefix,
			onSave: async (traits: string[]) => {
				await this.options.onSave(traits);
				this.close();
			},
			onCreateTrait: () => this.options.onCreateTrait(),
		});
		this.vueApp.mount(this.contentEl);
	}

	onClose(): void {
		this.vueApp?.unmount();
		this.vueApp = null;
	}
}
