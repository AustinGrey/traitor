<script setup lang="ts">
import { reactive } from "vue";

const props = defineProps<{
	traitNames: string[];
	initialSelectedTraits: string[];
}>();

const emit = defineEmits<{
	save: [selectedTraits: string[]];
	createTrait: [];
}>();

const selected = reactive(new Set(props.initialSelectedTraits));

function toggle(name: string) {
	if (selected.has(name)) {
		selected.delete(name);
	} else {
		selected.add(name);
	}
}
</script>

<template>
	<div>
		<h2>Traits for this note</h2>
		<p class="hint">
			Select one or more traits to apply. This plugin manages the
			frontmatter traits property for you.
		</p>

		<p v-if="traitNames.length === 0" class="empty">
			No trait definitions found yet.
		</p>

		<template v-else>
			<div
				v-for="name in traitNames"
				:key="name"
				class="setting-item"
			>
				<div class="setting-item-info">
					<div class="setting-item-name">{{ name }}</div>
				</div>
				<div class="setting-item-control">
					<div
						class="checkbox-container"
						:class="{ 'is-enabled': selected.has(name) }"
						tabindex="0"
						role="checkbox"
						:aria-checked="selected.has(name)"
						@click="toggle(name)"
						@keydown.enter.prevent="toggle(name)"
						@keydown.space.prevent="toggle(name)"
					/>
				</div>
			</div>
		</template>

		<div class="actions">
			<button @click="emit('createTrait')">Create trait file</button>
			<button class="mod-cta" @click="emit('save', [...selected])">
				Save traits
			</button>
		</div>
	</div>
</template>

<style scoped>
.hint,
.empty {
	margin: 0 0 10px;
	color: var(--text-muted);
}

.actions {
	display: flex;
	gap: 8px;
	margin-top: 12px;
}
</style>
