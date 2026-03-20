import { App, ButtonComponent, Modal, Setting } from "obsidian";

interface TraitPickerModalOptions {
	traitNames: string[];
	selectedTraits: string[];
	onSave: (selectedTraits: string[]) => Promise<void>;
	onCreateTrait: () => Promise<void>;
}

export class TraitPickerModal extends Modal {
	private readonly options: TraitPickerModalOptions;
	private readonly selectedTraits = new Set<string>();

	constructor(app: App, options: TraitPickerModalOptions) {
		super(app);
		this.options = options;
		for (const trait of options.selectedTraits) {
			this.selectedTraits.add(trait);
		}
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("traitor-trait-picker");

		contentEl.createEl("h2", { text: "Traits for this note" });
		contentEl.createEl("p", {
			cls: "traitor-trait-picker__hint",
			text: "Select one or more traits to apply. This plugin manages the frontmatter traits property for you.",
		});

		if (this.options.traitNames.length === 0) {
			contentEl.createEl("p", {
				cls: "traitor-trait-picker__empty",
				text: "No trait definitions found yet.",
			});
		} else {
			for (const traitName of this.options.traitNames) {
				new Setting(contentEl)
					.setName(traitName)
					.addToggle((toggle) =>
						toggle
							.setValue(this.selectedTraits.has(traitName))
							.onChange((enabled) => {
								if (enabled) {
									this.selectedTraits.add(traitName);
									return;
								}
								this.selectedTraits.delete(traitName);
							}),
					);
			}
		}

		const actions = contentEl.createDiv({ cls: "traitor-trait-picker__actions" });

		new ButtonComponent(actions)
			.setButtonText("Create trait file")
			.onClick(async () => {
				await this.options.onCreateTrait();
			});

		new ButtonComponent(actions)
			.setButtonText("Save traits")
			.setCta()
			.onClick(async () => {
				await this.options.onSave([...this.selectedTraits]);
				this.close();
			});
	}
}
