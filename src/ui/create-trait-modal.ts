import { App, Modal } from "obsidian";
import { createApp, type App as VueApp } from "vue";
import CreateTrait from "./CreateTrait.vue";

export class CreateTraitModal extends Modal {
	private readonly traitsFolder: string;
	private readonly onSubmit: (traitName: string) => Promise<void>;
	private vueApp: VueApp | null = null;

	constructor(app: App, traitsFolder: string, onSubmit: (traitName: string) => Promise<void>) {
		super(app);
		this.traitsFolder = traitsFolder;
		this.onSubmit = onSubmit;
	}

	onOpen(): void {
		this.vueApp = createApp(CreateTrait, {
			traitsFolder: this.traitsFolder,
			onSubmit: async (name: string) => {
				await this.onSubmit(name);
				this.close();
			},
		});
		this.vueApp.mount(this.contentEl);
	}

	onClose(): void {
		this.vueApp?.unmount();
		this.vueApp = null;
	}
}
