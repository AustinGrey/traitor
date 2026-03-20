# Traitor

Define reusable traits and validate your note frontmatter against trait requirements.

Traitor helps you keep metadata consistent across your vault. You can assign one or more traits to a note, and Traitor warns you when required properties are missing or have the wrong type.

## Why use Traitor?

- Reuse metadata rules across many notes (people, projects, books, etc.)
- Catch mistakes early with in-editor warning banners
- Keep your frontmatter clean and predictable
- Apply traits through a picker instead of manually editing `traits:`

## What it does

- Adds a ribbon action and command to set traits on the current note
- Lets you create trait definition files from inside Obsidian
- Validates notes against trait-defined property rules
- Shows clear warnings when:
  - a trait is referenced but has no definition file
  - a required property is missing
  - a property value has the wrong type
  - a string value does not match a required regex pattern

## Installation

### From Community Plugins (when listed)

1. Open **Settings -> Community plugins**
2. Select **Browse**
3. Search for **Traitor**
4. Install and enable

### Manual install

1. Download `manifest.json` and `main.js` from the latest release
2. Create this folder in your vault:
   `.obsidian/plugins/traitor/`
3. Copy both files into that folder
4. Reload Obsidian
5. Enable **Traitor** in **Settings -> Community plugins**

## Quick start

1. Run the command **Traitor: Create trait definition file**
2. Name it (for example `person`)
3. Edit the generated file in your traits folder
4. Open a note and run **Traitor: Set traits on current note**
5. Select one or more traits and save
6. Fill in required frontmatter fields until warnings disappear

## Trait definition format

Trait definition files are markdown notes in your configured traits folder (default: `_traits`), with frontmatter like this:

```yaml
---
trait: person
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

## Note frontmatter example

```yaml
---
traits:
  - person
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
