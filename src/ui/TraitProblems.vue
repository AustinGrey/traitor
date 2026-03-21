<template>
	<div class="trait-problems">
		<div class="toolbar">
			<button type="button" class="mod-cta" @click="emit('refresh')">Rescan vault</button>
		</div>

		<p v-if="loading" class="muted">Scanning vault…</p>

		<template v-else>
			<p v-if="entries.length === 0" class="empty">No trait problems found.</p>
			<template v-else>
				<p class="summary">{{ summaryText }}</p>
				<div
					v-for="entry in entries"
					:key="entry.path"
					class="file-block"
				>
					<div class="file-header">
						<button
							type="button"
							class="file-link"
							@click="emit('openFile', entry.path)"
						>
							{{ entry.path }}
						</button>
					</div>
					<ul class="warning-list">
						<li
							v-for="(w, i) in entry.warnings"
							:key="i"
						>
							<span class="trait-label">[{{ w.traitName }}]</span>
							{{ w.message }}
						</li>
					</ul>
				</div>
			</template>
		</template>
	</div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { TraitValidationWarning } from "../traits/types";

const props = defineProps<{
	loading: boolean;
	entries: { path: string; warnings: TraitValidationWarning[] }[];
}>();

const emit = defineEmits<{
	refresh: [];
	openFile: [path: string];
}>();

const summaryText = computed(() => {
	const n = props.entries.length;
	let total = 0;
	for (const e of props.entries) {
		total += e.warnings.length;
	}
	return `${n} file${n === 1 ? "" : "s"} with ${total} warning${total === 1 ? "" : "s"}.`;
});
</script>

<style scoped>
.trait-problems {
	padding: 4px 0 12px;
	overflow-y: auto;
}

.toolbar {
	margin-bottom: 12px;
}

.muted,
.empty {
	margin: 0 0 12px;
	color: var(--text-muted);
}

.empty {
	font-style: italic;
}

.summary {
	margin: 0 0 16px;
	color: var(--text-normal);
	font-weight: 500;
}

.file-block {
	margin-bottom: 16px;
	padding-bottom: 12px;
	border-bottom: 1px solid var(--background-modifier-border);
}

.file-block:last-child {
	border-bottom: none;
	margin-bottom: 0;
	padding-bottom: 0;
}

.file-header {
	margin-bottom: 6px;
}

.file-link {
	display: inline-block;
	max-width: 100%;
	padding: 0;
	border: none;
	background: none;
	color: var(--text-accent);
	font-family: var(--font-monospace);
	font-size: var(--font-smaller);
	text-align: left;
	cursor: pointer;
	text-decoration: underline;
}

.file-link:hover {
	color: var(--text-accent-hover);
}

.warning-list {
	margin: 0;
	padding-left: 18px;
	color: var(--text-normal);
	font-size: var(--font-smaller);
}

.warning-list li {
	margin: 4px 0;
}

.trait-label {
	font-weight: 600;
	color: var(--text-muted);
}
</style>
