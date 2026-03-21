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

function getFrontmatterTraits(frontmatter: Record<string, unknown> | null | undefined): string[] {
	if (!frontmatter) {
		return [];
	}

	const rawTraits = frontmatter.traits;
	if (typeof rawTraits === "string") {
		const trimmed = rawTraits.trim();
		return trimmed.length > 0 ? [trimmed] : [];
	}

	if (!Array.isArray(rawTraits)) {
		return [];
	}

	return rawTraits
		.filter((value): value is string => typeof value === "string")
		.map((traitName) => traitName.trim())
		.filter((traitName) => traitName.length > 0);
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
	private traitDefinitions = new Map<string, TraitDefinition>();

	constructor(app: App, options: TraitServiceOptions) {
		this.app = app;
		this.traitsFolder = normalizeTraitsFolder(options.traitsFolder);
	}

	setTraitsFolder(path: string): void {
		this.traitsFolder = normalizeTraitsFolder(path);
	}

	getTraitsFolder(): string {
		return this.traitsFolder;
	}

	getTraitDefinitions(): TraitDefinition[] {
		return [...this.traitDefinitions.values()].sort((a, b) => a.name.localeCompare(b.name));
	}

	getTraitNames(): string[] {
		return this.getTraitDefinitions().map((trait) => trait.name);
	}

	getTraitsForFile(file: TFile): string[] {
		const frontmatter = this.app.metadataCache.getFileCache(file)?.frontmatter;
		return getFrontmatterTraits(frontmatter);
	}

	async refreshTraits(): Promise<TraitDefinition[]> {
		const files = this.app.vault
			.getMarkdownFiles()
			.filter((file) => file.path.startsWith(`${this.traitsFolder}/`));

		const nextMap = new Map<string, TraitDefinition>();
		for (const file of files) {
			const cache = this.app.metadataCache.getFileCache(file);
			const frontmatter = cache?.frontmatter;
			if (!frontmatter || !isRecord(frontmatter)) {
				continue;
			}

			const traitNameRaw = typeof frontmatter.trait === "string" ? frontmatter.trait : file.basename;
			const traitName = traitNameRaw.trim();
			if (traitName.length === 0) {
				continue;
			}

			const definition: TraitDefinition = {
				name: traitName,
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
		const frontmatter = this.app.metadataCache.getFileCache(file)?.frontmatter;
		if (!frontmatter || !isRecord(frontmatter)) {
			return warnings;
		}

		const traitNames = getFrontmatterTraits(frontmatter);
		if (traitNames.length === 0) {
			return warnings;
		}

		for (const traitName of traitNames) {
			const trait = this.traitDefinitions.get(traitName);
			if (!trait) {
				warnings.push({
					traitName,
					kind: "missing-definition",
					message: `Trait "${traitName}" is referenced but no trait definition file was found in "${this.traitsFolder}".`,
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
		await this.app.fileManager.processFrontMatter(file, (frontmatter: Record<string, unknown>) => {
			if (normalized.length === 0) {
				delete frontmatter.traits;
				return;
			}
			frontmatter.traits = normalized;
		});
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
		const existing = this.app.vault.getAbstractFileByPath(filePath);
		if (existing instanceof TFile) {
			return existing;
		}

		const template = `---
trait: ${safeName}
description: Describe what this trait means.
properties:
  title:
    type: string
    required: true
---

# ${safeName}

Describe when this trait should be applied.
`;
		return this.app.vault.create(filePath, template);
	}
}
