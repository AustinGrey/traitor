<script setup lang="ts">
import { ref } from "vue";

const props = defineProps<{
	initialValue: string;
	onSave: (value: string) => Promise<void>;
}>();

const mySetting = ref(props.initialValue);
const isSaving = ref(false);

const persist = async () => {
	isSaving.value = true;
	try {
		await props.onSave(mySetting.value);
	} finally {
		isSaving.value = false;
	}
};
</script>

<template>
	<div class="traitor-settings">
		<label for="traitor-my-setting-input">Settings #1</label>
		<p class="traitor-settings-description">It's a secret</p>
		<input
			id="traitor-my-setting-input"
			v-model="mySetting"
			class="traitor-settings-input"
			type="text"
			placeholder="Enter your secret"
			@blur="persist"
		/>
		<button class="mod-cta" :disabled="isSaving" @click="persist">
			{{ isSaving ? "Saving..." : "Save" }}
		</button>
	</div>
</template>
