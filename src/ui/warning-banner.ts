import { MarkdownView } from "obsidian";
import { TraitValidationWarning } from "../traits/types";

const BANNER_CLASS = "traitor-warning-banner";

export class WarningBannerController {
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
			listEl.createEl("li", {
				text: `[${warning.traitName}] ${warning.message}`,
			});
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
