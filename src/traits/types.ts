export const SUPPORTED_PROPERTY_TYPES = [
	"string",
	"number",
	"boolean",
	"array",
	"date",
] as const;

export type TraitPropertyType = (typeof SUPPORTED_PROPERTY_TYPES)[number];

export interface TraitPropertyRule {
	name: string;
	type: TraitPropertyType;
	required: boolean;
	pattern?: string;
	description?: string;
}

export interface TraitDefinition {
	name: string;
	filePath: string;
	description?: string;
	properties: TraitPropertyRule[];
}

export type TraitWarningKind =
	| "missing-definition"
	| "missing-property"
	| "type-mismatch"
	| "pattern-mismatch";

export interface TraitValidationWarning {
	traitName: string;
	message: string;
	kind: TraitWarningKind;
}
