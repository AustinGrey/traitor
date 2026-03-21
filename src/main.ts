import { MarkdownView, Notice, Plugin, TFile } from "obsidian";
import { DEFAULT_SETTINGS, TraitorSettings, TraitorSettingsTab } from "./settings";
import { TraitService } from "./traits/trait-service";
import { TraitPropertyType } from "./traits/types";
import { CreateTraitModal } from "./ui/create-trait-modal";
import { TraitPickerModal } from "./ui/trait-picker-modal";
import { WarningBannerController } from "./ui/warning-banner";
import "./plugin.css";

export default class Traitor extends Plugin {
	settings: TraitorSettings;
	private traitService: TraitService;
	private warningBanner = new WarningBannerController();

	async onload() {
		await this.loadSettings();
		this.traitService = new TraitService(this.app, {
			traitsFolder: this.settings.traitsFolder,
		});
		await this.refreshTraitDefinitions();

		this.warningBanner.setCallbacks({
			onCreateTrait: (traitName) => this.createTraitAndRefresh(traitName),
			onAddProperty: (propertyName, propertyType) => this.addPropertyToActiveFile(propertyName, propertyType),
		});

		this.addRibbonIcon("target", "Set traits for current note", () => {
			void this.openTraitPickerForActiveFile();
		});

		this.addCommand({
			id: "set-traits-on-current-note",
			name: "Set traits on current note",
			callback: () => void this.openTraitPickerForActiveFile(),
		});

		this.addCommand({
			id: "create-trait-definition-file",
			name: "Create trait definition file",
			callback: () => {
				new CreateTraitModal(this.app, this.settings.traitsFolder, async (traitName) => {
					const file = await this.traitService.createTraitDefinitionFile(traitName);
					await this.refreshTraitDefinitions();
					new Notice(`Trait definition ready: ${file.path}`);
					await this.app.workspace.getLeaf(true).openFile(file);
				}).open();
			},
		});

		this.registerEvent(
			this.app.workspace.on("file-open", () => {
				this.refreshWarningsForActiveView();
			}),
		);
		this.registerEvent(
			this.app.metadataCache.on("changed", async (file) => {
				if (!file.path.startsWith(`${this.traitService.getTraitsFolder()}/`)) {
					this.refreshWarningsForActiveView();
					return;
				}

				await this.refreshTraitDefinitions();
				this.refreshWarningsForActiveView();
			}),
		);

		this.registerEvent(
			this.app.vault.on("create", async (file) => {
				if (!(file instanceof TFile) || file.extension !== "md") {
					return;
				}
				if (!file.path.startsWith(`${this.traitService.getTraitsFolder()}/`)) {
					return;
				}

				await this.refreshTraitDefinitions();
				this.refreshWarningsForActiveView();
			}),
		);

		this.registerEvent(
			this.app.vault.on("delete", async (file) => {
				if (!(file instanceof TFile) || file.extension !== "md") {
					return;
				}
				if (!file.path.startsWith(`${this.traitService.getTraitsFolder()}/`)) {
					return;
				}

				await this.refreshTraitDefinitions();
				this.refreshWarningsForActiveView();
			}),
		);

		this.addSettingTab(new TraitorSettingsTab(this.app, this));
		this.refreshWarningsForActiveView();
	}

	onunload() {
		this.clearAllWarningBanners();
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, (await this.loadData()) as Partial<TraitorSettings>);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async refreshTraitDefinitions(): Promise<void> {
		this.traitService.setTraitsFolder(this.settings.traitsFolder);
		await this.traitService.refreshTraits();
	}

	refreshWarningsForActiveView(): void {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!view || !(view.file instanceof TFile) || view.file.extension !== "md") {
			return;
		}

		const warnings = this.traitService.validateFile(view.file);
		this.warningBanner.update(view, warnings);
	}

	private clearAllWarningBanners(): void {
		for (const leaf of this.app.workspace.getLeavesOfType("markdown")) {
			const view = leaf.view;
			if (view instanceof MarkdownView) {
				this.warningBanner.clear(view);
			}
		}
	}

	private async addPropertyToActiveFile(propertyName: string, propertyType: TraitPropertyType): Promise<void> {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!view?.file) {
			return;
		}
		await this.traitService.addPropertyToFile(view.file, propertyName, propertyType);
		this.refreshWarningsForActiveView();
		new Notice(`Added property "${propertyName}".`);
	}

	private async createTraitAndRefresh(traitName: string): Promise<void> {
		const file = await this.traitService.createTraitDefinitionFile(traitName);
		await this.refreshTraitDefinitions();
		this.refreshWarningsForActiveView();
		new Notice(`Trait definition ready: ${file.path}`);
		await this.app.workspace.getLeaf(true).openFile(file);
	}

	private async openTraitPickerForActiveFile(): Promise<void> {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!view || !view.file) {
			new Notice("Open a Markdown note first.");
			return;
		}

		await this.refreshTraitDefinitions();
		const file = view.file;
		const traitNames = this.traitService.getTraitNames();
		const selectedTraits = this.traitService.getTraitsForFile(file);

		new TraitPickerModal(this.app, {
			traitNames,
			selectedTraits,
			onSave: async (nextTraits) => {
				await this.traitService.setTraitsForFile(file, nextTraits);
				this.refreshWarningsForActiveView();
				new Notice("Traits updated.");
			},
			onCreateTrait: async () => {
				new CreateTraitModal(this.app, this.settings.traitsFolder, async (name) => {
					const created = await this.traitService.createTraitDefinitionFile(name);
					await this.refreshTraitDefinitions();
					new Notice(`Trait definition ready: ${created.path}`);
					await this.app.workspace.getLeaf(true).openFile(created);
				}).open();
			},
		}).open();
	}
}
