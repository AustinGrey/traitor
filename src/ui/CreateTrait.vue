<script setup lang="ts">
import { ref, onMounted, useTemplateRef } from "vue";

defineProps<{
	traitsFolder: string;
}>();

const emit = defineEmits<{
	submit: [traitName: string];
}>();

const traitName = ref("");
const inputEl = useTemplateRef<HTMLInputElement>("inputEl");

onMounted(() => {
	inputEl.value?.focus();
});
</script>

<template>
	<div>
		<h2>Create trait definition file</h2>
		<p>Trait files are stored in "{{ traitsFolder }}".</p>
		<input
			ref="inputEl"
			v-model="traitName"
			type="text"
			placeholder="person"
			@keyup.enter="emit('submit', traitName)"
		/>
		<button class="mod-cta" @click="emit('submit', traitName)">
			Create
		</button>
	</div>
</template>

<style scoped>
input {
	margin-bottom: 8px;
}
</style>
