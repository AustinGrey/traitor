import { ItemView, TFile, WorkspaceLeaf } from "obsidian";
import { createApp, h, ref, type App as VueApp } from "vue";
import type { TraitValidationWarning } from "../traits/types";
import type Traitor from "../main";
import TraitProblems from "./TraitProblems.vue";

export const TRAIT_PROBLEMS_VIEW_TYPE = "traitor-trait-problems";

export class TraitProblemsView extends ItemView {
	private vueApp: VueApp | null = null;
	private scanVault: (() => Promise<void>) | null = null;

	constructor(
		leaf: WorkspaceLeaf,
		private readonly plugin: Traitor,
	) {
		super(leaf);
	}

	getViewType(): string {
		return TRAIT_PROBLEMS_VIEW_TYPE;
	}

	getDisplayText(): string {
		return "Traitor trait problems";
	}

	getIcon(): string {
		return "alert-triangle";
	}

	async onOpen(): Promise<void> {
		const loading = ref(true);
		const entries = ref<{ path: string; warnings: TraitValidationWarning[] }[]>([]);

		const runScan = async () => {
			loading.value = true;
			await this.plugin.refreshTraitDefinitions();
			const issues = this.plugin.getTraitService().collectVaultIssues({
				warnOnMissingTraits: this.plugin.settings.warnOnMissingTraits,
			});
			entries.value = issues.map(({ file, warnings }) => ({ path: file.path, warnings }));
			loading.value = false;
		};

		this.scanVault = runScan;

		this.vueApp = createApp({
			setup: () => {
				return () =>
					h(TraitProblems, {
						loading: loading.value,
						entries: entries.value,
						onRefresh: () => void runScan(),
						onOpenFile: (path: string) => {
							this.openFileByPath(path);
						},
					});
			},
		});
		this.vueApp.mount(this.contentEl);
		await runScan();
	}

	async onClose(): Promise<void> {
		this.vueApp?.unmount();
		this.vueApp = null;
		this.scanVault = null;
	}

	async refresh(): Promise<void> {
		await this.scanVault?.();
	}

	private openFileByPath(path: string): void {
		const file = this.app.vault.getAbstractFileByPath(path);
		if (file instanceof TFile) {
			void this.app.workspace.getLeaf(false).openFile(file);
		}
	}
}
