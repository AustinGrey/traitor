import { createApp, h, shallowRef, type App as VueApp } from "vue";
import { MarkdownView } from "obsidian";
import type { TraitPropertyType, TraitValidationWarning } from "../traits/types";
import WarningBanner from "./WarningBanner.vue";

const MOUNT_CLASS = "traitor-warning-banner-mount";

export interface WarningBannerCallbacks {
	onCreateTrait?: (traitName: string) => Promise<void>;
	onAddProperty?: (propertyName: string, propertyType: TraitPropertyType) => Promise<void>;
}

export class WarningBannerController {
	private callbacks: WarningBannerCallbacks = {};
	private vueApp: VueApp | null = null;
	private warnings = shallowRef<TraitValidationWarning[]>([]);
	private currentView: MarkdownView | null = null;

	setCallbacks(callbacks: WarningBannerCallbacks): void {
		this.callbacks = callbacks;
	}

	update(view: MarkdownView, warnings: TraitValidationWarning[]): void {
		if (warnings.length === 0) {
			this.unmountCurrent();
			return;
		}

		if (this.currentView !== view) {
			this.unmountCurrent();
		}

		this.warnings.value = warnings;

		if (!this.vueApp) {
			this.mount(view);
		}
	}

	clear(view: MarkdownView): void {
		if (this.currentView === view) {
			this.unmountCurrent();
		}
		view.contentEl.querySelector(`.${MOUNT_CLASS}`)?.remove();
	}

	private mount(view: MarkdownView): void {
		const mountEl = createDiv({ cls: MOUNT_CLASS });
		view.contentEl.prepend(mountEl);
		this.currentView = view;

		const { warnings, callbacks } = this;

		this.vueApp = createApp({
			setup() {
				return () =>
					h(WarningBanner, {
						warnings: warnings.value,
						onCreateTrait: (name: string) => callbacks.onCreateTrait?.(name),
						onAddProperty: (name: string, type: TraitPropertyType) =>
							callbacks.onAddProperty?.(name, type),
					});
			},
		});
		this.vueApp.mount(mountEl);
	}

	private unmountCurrent(): void {
		this.vueApp?.unmount();
		this.vueApp = null;
		if (this.currentView) {
			this.currentView.contentEl.querySelector(`.${MOUNT_CLASS}`)?.remove();
			this.currentView = null;
		}
	}
}
