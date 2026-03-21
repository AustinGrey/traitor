import { App, normalizePath, TFile } from "obsidian";
import {
	SUPPORTED_PROPERTY_TYPES,
	TraitDefinition,
	TraitPropertyRule,
	TraitPropertyType,
	TraitValidationWarning,
} from "./types";

interface TraitServiceOptions {
	traitsFolder: string;
	tagPrefix: string;
}

function normalizeTraitsFolder(path: string): string {
	const cleaned = path.trim();
	return normalizePath(cleaned.length > 0 ? cleaned : "Traits");
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asBoolean(value: unknown, fallback: boolean): boolean {
	if (typeof value === "boolean") {
		return value;
	}
	return fallback;
}

function asString(value: unknown): string | undefined {
	return typeof value === "string" ? value.trim() : undefined;
}

function parseType(rawType: unknown): TraitPropertyType | null {
	if (typeof rawType !== "string") {
		return null;
	}
	const normalized = rawType.trim().toLowerCase();
	return (SUPPORTED_PROPERTY_TYPES as readonly string[]).includes(normalized)
		? (normalized as TraitPropertyType)
		: null;
}

function parsePropertyRule(propertyName: string, rawRule: unknown): TraitPropertyRule | null {
	if (typeof rawRule === "string") {
		const parsedType = parseType(rawRule);
		if (!parsedType) {
			return null;
		}
		return {
			name: propertyName,
			type: parsedType,
			required: true,
		};
	}

	if (!isRecord(rawRule)) {
		return null;
	}

	const parsedType = parseType(rawRule.type);
	if (!parsedType) {
		return null;
	}

	return {
		name: propertyName,
		type: parsedType,
		required: asBoolean(rawRule.required, true),
		pattern: asString(rawRule.pattern),
		description: asString(rawRule.description),
	};
}

function parseProperties(rawProperties: unknown): TraitPropertyRule[] {
	if (!isRecord(rawProperties)) {
		return [];
	}

	const rules: TraitPropertyRule[] = [];
	for (const [propertyName, rawRule] of Object.entries(rawProperties)) {
		const parsed = parsePropertyRule(propertyName, rawRule);
		if (parsed) {
			rules.push(parsed);
		}
	}

	return rules;
}

function normalizeFrontmatterTags(raw: unknown): string[] {
	if (raw === undefined || raw === null) {
		return [];
	}
	if (typeof raw === "string") {
		const trimmed = raw.trim();
		return trimmed.length > 0 ? [trimmed] : [];
	}
	if (!Array.isArray(raw)) {
		return [];
	}
	return raw
		.filter((value): value is string => typeof value === "string")
		.map((t) => t.trim())
		.filter((t) => t.length > 0);
}

function normalizeTagPrefix(prefix: string): string {
	const trimmed = prefix.trim().replace(/^#+/, "").replace(/^\/+|\/+$/g, "");
	return trimmed.length > 0 ? trimmed.toLowerCase() : "trait";
}

function isTraitTag(tag: string, tagPrefix: string): boolean {
	return tag.toLowerCase().startsWith(`${tagPrefix}/`);
}

function stripTraitTagPrefix(tag: string, tagPrefix: string): string {
	if (!isTraitTag(tag, tagPrefix)) {
		return "";
	}
	const m = new RegExp(`^${tagPrefix}/`, "i").exec(tag);
	return m ? tag.slice(m[0].length).trim() : "";
}

/** "media/music" -> ["media", "media/music"] */
function expandTraitPath(traitPath: string): string[] {
	const parts = traitPath.split("/").map((p) => p.trim()).filter((p) => p.length > 0);
	const out: string[] = [];
	for (let i = 0; i < parts.length; i++) {
		out.push(parts.slice(0, i + 1).join("/"));
	}
	return out;
}

/**
 * Trait ids to validate / show in the picker, derived from #trait/... tags (frontmatter and inline).
 */
function collectTraitIdsFromTags(allTagStrings: string[], tagPrefix: string): string[] {
	const seen = new Set<string>();
	const ordered: string[] = [];
	for (const tag of allTagStrings) {
		const path = stripTraitTagPrefix(tag, tagPrefix);
		if (path.length === 0) {
			continue;
		}
		for (const id of expandTraitPath(path)) {
			if (!seen.has(id)) {
				seen.add(id);
				ordered.push(id);
			}
		}
	}
	return ordered;
}

/**
 * When saving, omit trait/x if trait/x/y is also selected so one nested tag implies parents.
 */
function minimalTraitIdsForTags(selectedIds: string[]): string[] {
	const set = new Set(selectedIds.map((id) => id.trim()).filter((id) => id.length > 0));
	const minimal: string[] = [];
	for (const id of set) {
		let hasDescendantInSet = false;
		const prefix = `${id}/`;
		for (const other of set) {
			if (other !== id && other.startsWith(prefix)) {
				hasDescendantInSet = true;
				break;
			}
		}
		if (!hasDescendantInSet) {
			minimal.push(id);
		}
	}
	return minimal.sort((a, b) => a.localeCompare(b));
}

function traitIdFromTraitsFilePath(traitsFolder: string, filePath: string): string | null {
	const prefix = `${normalizePath(traitsFolder)}/`;
	if (!filePath.startsWith(prefix) || !filePath.endsWith(".md")) {
		return null;
	}
	const relative = filePath.slice(prefix.length, -3);
	return relative.length > 0 ? normalizePath(relative) : null;
}

function matchesExpectedType(value: unknown, expectedType: TraitPropertyType): boolean {
	switch (expectedType) {
		case "string":
			return typeof value === "string";
		case "number":
			return typeof value === "number" || (typeof value === "string" && !Number.isNaN(Number(value)));
		case "boolean":
			return (
				typeof value === "boolean" ||
				value === "true" ||
				value === "false"
			);
		case "array":
			return Array.isArray(value);
		case "date":
			return typeof value === "string" && !Number.isNaN(Date.parse(value));
		default:
			return false;
	}
}

function formatTypeLabel(type: TraitPropertyType): string {
	switch (type) {
		case "date":
			return "a valid date string (for example 2026-03-19)";
		default:
			return type;
	}
}

export class TraitService {
	private readonly app: App;
	private traitsFolder: string;
	private tagPrefix: string;
	private traitDefinitions = new Map<string, TraitDefinition>();

	constructor(app: App, options: TraitServiceOptions) {
		this.app = app;
		this.traitsFolder = normalizeTraitsFolder(options.traitsFolder);
		this.tagPrefix = normalizeTagPrefix(options.tagPrefix);
	}

	setTraitsFolder(path: string): void {
		this.traitsFolder = normalizeTraitsFolder(path);
	}

	getTraitsFolder(): string {
		return this.traitsFolder;
	}

	setTagPrefix(prefix: string): void {
		this.tagPrefix = normalizeTagPrefix(prefix);
	}

	getTagPrefix(): string {
		return this.tagPrefix;
	}

	getTraitDefinitions(): TraitDefinition[] {
		return [...this.traitDefinitions.values()].sort((a, b) => a.name.localeCompare(b.name));
	}

	getTraitNames(): string[] {
		return this.getTraitDefinitions().map((trait) => trait.name);
	}

	private mergeTagsFromCache(file: TFile): string[] {
		const cache = this.app.metadataCache.getFileCache(file);
		if (!cache) {
			return [];
		}
		const seen = new Set<string>();
		const ordered: string[] = [];
		for (const t of normalizeFrontmatterTags(cache.frontmatter?.tags)) {
			const key = t.toLowerCase();
			if (!seen.has(key)) {
				seen.add(key);
				ordered.push(t);
			}
		}
		for (const { tag } of cache.tags ?? []) {
			const normalized = tag.startsWith("#") ? tag.slice(1) : tag;
			const key = normalized.toLowerCase();
			if (!seen.has(key)) {
				seen.add(key);
				ordered.push(normalized);
			}
		}
		return ordered;
	}

	getTraitsForFile(file: TFile): string[] {
		return collectTraitIdsFromTags(this.mergeTagsFromCache(file), this.tagPrefix);
	}

	async refreshTraits(): Promise<TraitDefinition[]> {
		const folderPrefix = `${normalizePath(this.traitsFolder)}/`;
		const files = this.app.vault
			.getMarkdownFiles()
			.filter((file) => file.path.startsWith(folderPrefix));

		const nextMap = new Map<string, TraitDefinition>();
		for (const file of files) {
			const traitId = traitIdFromTraitsFilePath(this.traitsFolder, file.path);
			if (!traitId) {
				continue;
			}

			const cache = this.app.metadataCache.getFileCache(file);
			const frontmatter = cache?.frontmatter && isRecord(cache.frontmatter) ? cache.frontmatter : {};

			const definition: TraitDefinition = {
				name: traitId,
				filePath: file.path,
				description: asString(frontmatter.description),
				properties: parseProperties(frontmatter.properties),
			};

			nextMap.set(definition.name, definition);
		}

		this.traitDefinitions = nextMap;
		return this.getTraitDefinitions();
	}

	validateFile(file: TFile): TraitValidationWarning[] {
		const warnings: TraitValidationWarning[] = [];
		const traitNames = this.getTraitsForFile(file);
		if (traitNames.length === 0) {
			return warnings;
		}

		const rawFm = this.app.metadataCache.getFileCache(file)?.frontmatter;
		const frontmatter = rawFm && isRecord(rawFm) ? rawFm : {};

		for (const traitName of traitNames) {
			const trait = this.traitDefinitions.get(traitName);
			if (!trait) {
				warnings.push({
					traitName,
					kind: "missing-definition",
					message: `Trait "${traitName}" is used on this note but no trait definition file was found in "${this.traitsFolder}".`,
				});
				continue;
			}

			for (const property of trait.properties) {
				const value = frontmatter[property.name];
				const hasValue = value !== undefined && value !== null;
				if (property.required && !hasValue) {
					warnings.push({
						traitName,
						kind: "missing-property",
						message: `Missing required property "${property.name}".`,
						propertyName: property.name,
						propertyType: property.type,
					});
					continue;
				}

				if (!hasValue) {
					continue;
				}

				if (!matchesExpectedType(value, property.type)) {
					warnings.push({
						traitName,
						kind: "type-mismatch",
						message: `Property "${property.name}" should be ${formatTypeLabel(property.type)}.`,
					});
					continue;
				}

				if (property.pattern && typeof value === "string") {
					let regex: RegExp | null = null;
					try {
						regex = new RegExp(property.pattern);
					} catch {
						regex = null;
					}

					if (regex && !regex.test(value)) {
						warnings.push({
							traitName,
							kind: "pattern-mismatch",
							message: `Property "${property.name}" does not match pattern /${property.pattern}/.`,
						});
					}
				}
			}
		}

		return warnings;
	}

	async setTraitsForFile(file: TFile, traitNames: string[]): Promise<void> {
		const normalized = [...new Set(traitNames.map((name) => name.trim()).filter((name) => name.length > 0))];
		const traitTagsToWrite = minimalTraitIdsForTags(normalized).map((id) => `${this.tagPrefix}/${id}`);
		await this.app.fileManager.processFrontMatter(file, (frontmatter: Record<string, unknown>) => {
			const existing = normalizeFrontmatterTags(frontmatter.tags);
			const kept = existing.filter((t) => !isTraitTag(t, this.tagPrefix));
			const next = [...kept, ...traitTagsToWrite];
			if (next.length === 0) {
				delete frontmatter.tags;
				return;
			}
			frontmatter.tags = next.length === 1 ? next[0] : next;
		});
	}

	async migrateTagPrefix(oldPrefixRaw: string, newPrefixRaw: string): Promise<number> {
		const oldPrefix = normalizeTagPrefix(oldPrefixRaw);
		const newPrefix = normalizeTagPrefix(newPrefixRaw);
		if (oldPrefix === newPrefix) {
			return 0;
		}

		let updatedFiles = 0;
		for (const file of this.app.vault.getMarkdownFiles()) {
			let changed = false;

			await this.app.fileManager.processFrontMatter(file, (frontmatter: Record<string, unknown>) => {
				const existingTags = normalizeFrontmatterTags(frontmatter.tags);
				if (existingTags.length === 0) {
					return;
				}

				const nextTags = existingTags.map((tag) => {
					if (!isTraitTag(tag, oldPrefix)) {
						return tag;
					}
					changed = true;
					const suffix = stripTraitTagPrefix(tag, oldPrefix);
					return `${newPrefix}/${suffix}`;
				});
				frontmatter.tags = nextTags.length === 1 ? nextTags[0] : nextTags;
			});

			const content = await this.app.vault.cachedRead(file);
			const inlineRegex = new RegExp(`(^|[^\\w/])#${escapeRegex(oldPrefix)}(?=/)`, "gi");
			const nextContent = content.replace(inlineRegex, `$1#${newPrefix}`);
			if (nextContent !== content) {
				await this.app.vault.modify(file, nextContent);
				changed = true;
			}

			if (changed) {
				updatedFiles += 1;
			}
		}

		return updatedFiles;
	}

	async addPropertyToFile(file: TFile, propertyName: string, propertyType: TraitPropertyType): Promise<void> {
		const defaultValue = this.defaultValueForType(propertyType);
		await this.app.fileManager.processFrontMatter(file, (frontmatter: Record<string, unknown>) => {
			if (frontmatter[propertyName] === undefined || frontmatter[propertyName] === null) {
				frontmatter[propertyName] = defaultValue;
			}
		});
	}

	private defaultValueForType(type: TraitPropertyType): unknown {
		switch (type) {
			case "string":
				return "";
			case "number":
				return 0;
			case "boolean":
				return false;
			case "array":
				return [];
			case "date":
				return new Date().toISOString().slice(0, 10);
			default:
				return "";
		}
	}

	async ensureTraitsFolderExists(): Promise<void> {
		const exists = this.app.vault.getAbstractFileByPath(this.traitsFolder);
		if (!exists) {
			await this.app.vault.createFolder(this.traitsFolder);
		}
	}

	async createTraitDefinitionFile(traitNameInput: string): Promise<TFile> {
		const traitName = traitNameInput.trim();
		const safeName = traitName.length > 0 ? traitName : "new-trait";
		const filePath = normalizePath(`${this.traitsFolder}/${safeName}.md`);

		await this.ensureTraitsFolderExists();
		await this.ensureParentFoldersForFile(filePath);
		const existing = this.app.vault.getAbstractFileByPath(filePath);
		if (existing instanceof TFile) {
			return existing;
		}

		const displayTitle = safeName.includes("/") ? safeName.split("/").pop()! : safeName;
		const template = `---
description: Describe what this trait means.
properties:
  title:
    type: string
    required: true
---

# ${displayTitle}

Describe when this trait should be applied.
`;
		return this.app.vault.create(filePath, template);
	}

	private async ensureParentFoldersForFile(filePath: string): Promise<void> {
		const lastSlash = filePath.lastIndexOf("/");
		if (lastSlash <= 0) {
			return;
		}
		const folderPath = filePath.slice(0, lastSlash);
		const parts = folderPath.split("/").filter((p) => p.length > 0);
		let acc = "";
		for (const part of parts) {
			acc = acc.length > 0 ? `${acc}/${part}` : part;
			const found = this.app.vault.getAbstractFileByPath(acc);
			if (!found) {
				await this.app.vault.createFolder(acc);
			}
		}
	}
}

function escapeRegex(input: string): string {
	return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
