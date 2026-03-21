<template>
	<div class="banner">
		<strong>Trait warnings</strong>
		<ul>
			<li v-for="(warning, i) in warnings" :key="i">
				<span>[{{ warning.traitName }}] {{ warning.message }}</span>
				<button
					v-if="warning.kind === 'missing-definition'"
					class="action-btn"
					@click="emit('createTrait', warning.traitName)"
				>
					Create trait
				</button>
				<button
					v-if="
						warning.kind === 'missing-property' &&
						warning.propertyName &&
						warning.propertyType
					"
					class="action-btn"
					@click="
						emit(
							'addProperty',
							warning.propertyName!,
							warning.propertyType!,
						)
					"
				>
					Add property
				</button>
			</li>
		</ul>
	</div>
</template>

<script setup lang="ts">
import type { TraitPropertyType, TraitValidationWarning } from "../traits/types";

defineProps<{
	warnings: TraitValidationWarning[];
}>();

const emit = defineEmits<{
	createTrait: [traitName: string];
	addProperty: [propertyName: string, propertyType: TraitPropertyType];
}>();
</script>

<style scoped>
.banner {
	margin: 0 0 12px;
	padding: 10px 12px;
	border-radius: 8px;
	border: 1px solid var(--color-red);
	background-color: color-mix(
		in srgb,
		var(--background-primary),
		var(--color-red) 8%
	);
}

.banner strong {
	display: block;
	margin-bottom: 6px;
}

.banner ul {
	margin: 0;
	padding-left: 20px;
}

.banner li {
	margin: 3px 0;
	display: flex;
	align-items: baseline;
	gap: 6px;
	flex-wrap: wrap;
}

.action-btn {
	font-size: var(--font-smallest);
	padding: 1px 8px;
	border-radius: 4px;
	cursor: pointer;
	flex-shrink: 0;
}
</style>
