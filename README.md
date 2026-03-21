# Traitor

Define reusable traits and validate your note frontmatter against trait requirements.

Traitor helps you keep metadata consistent across your vault. You assign traits with Obsidian nested tags under `trait/…`, and Traitor warns you when required properties are missing or have the wrong type.

## Why use Traitor?

- Reuse metadata rules across many notes (people, projects, books, etc.)
- Catch mistakes early with in-editor warning banners
- Keep your frontmatter clean and predictable
- Apply traits through a picker (updates the `tags` field) or by adding nested tags yourself

## What it does

- Adds a ribbon action and command to set traits on the current note
- Lets you create trait definition files from inside Obsidian
- Validates notes against trait-defined property rules
- Shows clear warnings when:
  - a trait tag is present but has no definition file
  - a required property is missing
  - a property value has the wrong type
  - a string value does not match a required regex pattern

## Installation

### From Community Plugins (when listed)

1. Open **Settings → Community plugins**
2. Select **Browse**
3. Search for **Traitor**
4. Install and enable

### Manual install

1. Download `manifest.json`, `main.js`, and `styles.css` (if present) from the latest release
2. Create this folder in your vault:
   `.obsidian/plugins/traitor/`
3. Copy the files into that folder
4. Reload Obsidian
5. Enable **Traitor** in **Settings → Community plugins**

## Quick start

1. Run the command **Traitor: Create trait definition file**
2. Name it (for example `person`, or `media/music` for a nested trait file path)
3. Edit the generated file in your traits folder
4. Open a note and run **Traitor: Set traits on current note**
5. Select one or more traits and save (this adds nested tags such as `trait/person`)
6. Fill in required frontmatter fields until warnings disappear

## How traits are identified

- **Definition files** live in your configured traits folder (default: `_traits`). The trait id is the path of the Markdown file without `.md`, using `/` for nesting.
  - `_traits/person.md` → trait id `person`
  - `_traits/media/music.md` → trait id `media/music`
- **Notes** use Obsidian nested tags whose first segment is `trait`. Examples:
  - Tag `trait/media` applies the trait defined by `media.md`.
  - Tag `trait/media/music` applies both `media` and `media/music` (every prefix segment), so parent and child definition files both apply.

The trait picker writes minimal `trait/…` tags (for example, if you only need `media/music`, it does not also add `trait/media`).

## Trait definition format

Trait definition files are Markdown notes in your traits folder. The filename (and folder path) defines the trait; frontmatter holds `description` and `properties` only:

```yaml
---
description: Notes about people
properties:
  status:
    type: string
    required: true
  birthday:
    type: date
    required: false
  email:
    type: string
    required: false
    pattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"
---
```

Supported property types:

- `string`
- `number`
- `boolean`
- `array`
- `date` (valid date string)

## Note example (tags + properties)

Use the `tags` property (and/or inline `#tags`) for traits. Other frontmatter holds the data Traitor validates:

```yaml
---
tags:
  - trait/person
status: active
birthday: 1993-07-16
email: hello@example.com
---
```

## Commands

- **Set traits on current note**
- **Create trait definition file**

## Settings

- **Traits folder**: folder containing your trait definition files (default: `_traits`)

## Compatibility

- Minimum Obsidian version: `0.15.0`
- Desktop and mobile supported
