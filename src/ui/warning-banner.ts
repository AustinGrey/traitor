import { MarkdownView } from "obsidian";
import { TraitValidationWarning } from "../traits/types";

const BANNER_CLASS = "traitor-warning-banner";

export interface WarningBannerCallbacks {
	onCreateTrait?: (traitName: string) => void;
}

export class WarningBannerController {
	private callbacks: WarningBannerCallbacks = {};

	setCallbacks(callbacks: WarningBannerCallbacks): void {
		this.callbacks = callbacks;
	}

	update(view: MarkdownView, warnings: TraitValidationWarning[]): void {
		const existingBanner = view.contentEl.querySelector(`.${BANNER_CLASS}`);
		if (warnings.length === 0) {
			existingBanner?.remove();
			return;
		}

		const banner = existingBanner ?? this.createBanner(view);
		const listEl = banner.querySelector("ul");
		if (!listEl) {
			return;
		}

		listEl.empty();
		for (const warning of warnings) {
			const li = listEl.createEl("li");
			li.createSpan({ text: `[${warning.traitName}] ${warning.message}` });

			if (warning.kind === "missing-definition" && this.callbacks.onCreateTrait) {
				const btn = li.createEl("button", {
					text: "Create trait",
					cls: "traitor-warning-banner__create-btn",
				});
				const traitName = warning.traitName;
				btn.addEventListener("click", (e) => {
					e.preventDefault();
					this.callbacks.onCreateTrait?.(traitName);
				});
			}
		}
	}

	clear(view: MarkdownView): void {
		view.contentEl.querySelector(`.${BANNER_CLASS}`)?.remove();
	}

	private createBanner(view: MarkdownView): HTMLElement {
		const banner = createDiv({ cls: BANNER_CLASS });
		banner.createEl("strong", { text: "Trait warnings" });
		banner.createEl("ul");
		view.contentEl.prepend(banner);
		return banner;
	}
}
