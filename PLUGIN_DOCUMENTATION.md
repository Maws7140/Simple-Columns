# Simple Columns Plugin - Technical Documentation

## Overview

**Simple Columns** is an Obsidian plugin that enables users to create, manage, and customize resizable column layouts within notes. It allows for both global styling configuration and per-block local customization.

**Current Version:** 1.0.8
**Repository:** [Josie1902/Simple-Columns](https://github.com/Josie1902)
**Minimum Obsidian Version:** 0.15.0

---

## Architecture & Core Structure

```
Simple-Columns/
├── main.ts                           # Main plugin entry point
├── styles.css                        # Global styling
├── manifest.json                     # Plugin metadata
├── package.json                      # Dependencies
├── tsconfig.json                     # TypeScript configuration
└── src/
    ├── columnRenderer.ts             # Markdown render child lifecycle
    ├── typings/
    │   └── extraTypes.d.ts           # Type definitions
    └── ui/
        ├── button.ts                 # Customise button SVG creation
        ├── colorUtils.ts             # Color conversion utilities
        ├── columnModal.ts            # Per-block customization modal
        ├── createColumns.ts          # Column insertion logic
        └── settings.ts               # Global settings & configuration tab
```

---

## Core Dependencies

```json
{
  "obsidian": "latest",
  "nanoid": "^5.1.5"
}
```

- **Obsidian API**: For accessing app workspace, markdown rendering, modal/UI components
- **nanoid**: For generating unique column block IDs

---

## Main Entry Point: `main.ts`

The `ColumnsPlugin` class extends Obsidian's `Plugin` class and handles:

### 1. Command Registration
- **Add 2 columns** - Creates a 2-column layout
- **Add 3 columns** - Creates a 3-column layout
- **Add 4 columns** - Creates a 4-column layout

### 2. Context Menu Integration
Right-click menu with submenu for adding columns (2, 3, or 4 columns)

### 3. Markdown Code Block Processor
Registers a custom `columns` code block processor that:
- Parses YAML metadata (id, column-N-ratio)
- Extracts column content separated by `===` delimiters
- Renders HTML column structure
- Manages column resizing with mouse events
- Loads/saves widths to localStorage
- Applies styling from localStorage

### 4. Global Settings Management
- Loads default settings on plugin load
- Creates a settings tab for global configuration
- Applies CSS custom properties for global styling

### 5. Lifecycle Management
- `onload()`: Initializes commands, menus, code block processor, settings
- `onunload()`: Removes CSS custom properties to prevent style leakage

---

## Markdown Syntax

The plugin uses a custom markdown code block syntax:

````markdown
```columns
id: <unique-id>
column-1-ratio: 60%   # Optional: specify widths
column-2-ratio: 40%
===
Column 1 Content
===
Column 2 Content
```
````

**Key Features of Syntax:**
- **ID Field (Required)**: Unique identifier for the block, generated via `nanoid()`
- **Column Ratio Fields (Optional)**: Specify column widths as percentages
- **Separator (===)**: Divides column content; appears between columns and is NOT rendered
- **Content**: Markdown-rendered content in each column

---

## Column Management System

### 1. Column Creation (`createColumns.ts`)

```typescript
export function createMarkdownColumns(app: App, columnCount: number)
```

- Inserts markdown code block at cursor position
- Generates unique ID using `nanoid()`
- Creates template with specified number of columns
- Placeholder text: "Column 1", "Column 2", etc.

### 2. Column Rendering & Resizing (main.ts)

**HTML Structure:**
```html
<div class="markdown-columns-resizable" id="blockId">
  <div class="column" data-index="1">...</div>
  <div class="column-resizer"></div>
  <div class="column" data-index="2">...</div>
  <div class="column-resizer"></div>
  <div class="column" data-index="3">...</div>
</div>
```

**Resizing Mechanism:**
- Drag handlers on resizer elements
- `mousedown`: Captures start position and column widths
- `mousemove`: Calculates new widths as percentage of container
- `mouseup`: Saves widths to localStorage (key: `sc-column-widths-{blockId}`)
- Minimum column width: 50px (prevents columns from becoming too small)

**Width Persistence:**
- Widths stored as CSS custom property values (percentages)
- Retrieved from localStorage and applied to `--sc-column-width` property
- Supports manual width specification via YAML (`column-N-ratio`)

### 3. Column Renderer Lifecycle (`columnRenderer.ts`)

```typescript
export class ColumnRenderer extends MarkdownRenderChild
```

Extends Obsidian's `MarkdownRenderChild` for proper lifecycle management:
- `onunload()`: Cleans up resizer hover styles when column is removed

---

## Styling System

### CSS Custom Properties (Root Level)

Global properties set by the plugin:

| Property | Purpose | Example |
|----------|---------|---------|
| `--sc-border-width` | Container border thickness | `1px` |
| `--sc-border-shown` | Border display mode | `solid` or `none` |
| `--sc-border-color` | Border color with alpha | `rgb(240, 240, 240, 1)` |
| `--sc-border-radius` | Container corner radius | `0px` |
| `--sc-resizer-bg` | Resizer background color | `rgb(240, 240, 240, 1)` |
| `--sc-resizer-hover-bg` | Resizer hover color | `rgb(240, 240, 240, 1)` |
| `--sc-resizer-width` | Resizer thickness | `3px` |

### Per-Column Custom Properties

Set on individual column elements:

| Property | Purpose |
|----------|---------|
| `--sc-column-width` | Column flex basis (percentage) |
| `--sc-column-bg` | Column background color |
| `--sc-column-text-color` | Column text color |

### CSS Classes

**Main Container:**
- `.markdown-columns-resizable` - Flex container for columns

**Column Elements:**
- `.column` - Individual column wrapper
- `.column-style` - Shared styling applied to all columns
- `.text-left` / `.text-center` / `.text-right` - Text alignment
- `.text-align-` classes applied dynamically

**Resizer Elements:**
- `.column-resizer` - Draggable divider between columns
- `.resizer-visible` - Shows/hides resizer background
- `.cursor-col-resize` - Applied to body during drag

**Button:**
- `.customise-columns-button` - Settings button overlay
- Positioned absolutely on code blocks
- Appears on hover

---

## Settings System

### Global Settings (`settings.ts`)

```typescript
interface ColumnsPluginSettings {
  showBorders: boolean;
  borderWidth: number;
  borderColor: string;
  borderTransparency: number;      // 0-100%
  borderRadius: number;
  showResizer: boolean;
  resizerColor: string;
  resizerWidth: number;
  resizerTransparency: number;     // 0-100%
}
```

**Default Values:**
```typescript
{
  showBorders: true,
  borderWidth: 1,
  borderColor: '#f0f0f0',
  borderTransparency: 100,
  borderRadius: 0,
  showResizer: true,
  resizerColor: '#f0f0f0',
  resizerWidth: 3,
  resizerTransparency: 100,
}
```

**Settings Tab Features:**
- Border settings group (show/hide, width, color, transparency, radius)
- Resizer settings group (show/hide, width, color, transparency)
- Advanced settings: Reset to defaults, Clear local storage

### Local (Per-Block) Settings (`columnModal.ts`)

Accessed via the customise button on each column block. Allows:

- **Reset Styles**: Clear all custom styling for the block
- **Border Configuration**: Show/hide, color, transparency
- **Resizer Configuration**: Show/hide, color, transparency
- **Per-Column Customization** (for each column):
  - Text color picker
  - Background color + transparency
  - Text alignment (left/center/right)

**localStorage Keys (Per-Block):**
- `sc-column-widths-{blockId}` - Array of width percentages
- `sc-columnAlignments-{blockId}` - Alignment object
- `sc-columnBackgrounds-{blockId}` - Background color object
- `sc-columnTextColors-{blockId}` - Text color object
- `sc-borderColor-{blockId}` - Border styling object
- `sc-resizerColor-{blockId}` - Resizer styling object

---

## Color Handling (`colorUtils.ts`)

The plugin supports multiple color formats:

```typescript
export function hexToRGBA(hex: string, alphaPercent: number): string
export function hslToRGBA(hsl: string, alphaPercent: number): string
export function convertToRGBA(color: string, alphaPercent: number): string
export function rgbToHex(rgb: string): string
```

**Supported Input Formats:**
- Hex: `#f0f0f0`
- HSL: `hsl(0, 0%, 94%)`
- RGB/RGBA: `rgb(240, 240, 240)` or `rgb(240, 240, 240, 1)`

**Output Format:**
- RGBA: `rgb(240, 240, 240, 0.5)` with alpha as decimal 0-1

**Transparency Handling:**
- User inputs: 0-100 percentage
- Internal storage: Decimal 0-1
- Conversions handle both directions

---

## UI Components

### 1. Customise Button (`button.ts`)

SVG icon button that appears on code blocks:
- Positioned absolutely on hover
- Minimal design (2 circles and 2 lines)
- Opens `CustomiseColumnsModal` on click
- Styled with Obsidian's theme variables

### 2. Customise Modal (`columnModal.ts`)

Modal dialog for per-block customization:

**Sections:**
1. Reset all styles button (warning style)
2. Border toggle and color picker
3. Resizer toggle and color picker
4. Per-column settings (repeated for each column):
   - Text color picker
   - Background color picker + transparency
   - Alignment button group (left/center/right)

**Alignment Button Styling:**
- Custom button group with flex layout
- Active state uses `interactive-accent` color
- Hover effects for better UX

**Data Flow:**
- Modal loads saved data from localStorage
- User changes are stored in component state
- On close (`onClose()`), applies changes and saves to localStorage

---

## Column Width Management

### Initial Width Calculation

When `column-N-ratio` values are provided in YAML:

1. Parse ratio values from YAML metadata
2. Get container width from code block element
3. Calculate resizer space: `(resizerWidth / containerWidth) * 100`
4. Distribute remaining space to unspecified columns
5. Validate that all ratios sum to 100%
6. Display error if ratios are invalid

### Width Persistence Flow

```
User drags resizer
    ↓
mousemove calculates new widths as percentages
    ↓
Sets CSS custom property: --sc-column-width
    ↓
mouseup saves to localStorage: sc-column-widths-{blockId}
    ↓
On reload, loads from localStorage and applies
```

---

## Data Flow Diagram

```
Plugin Load
  ↓
Register Markdown Processor
  ↓
Code Block "columns" Detected
  ↓
Parse YAML (id, column-N-ratio)
  ↓
Load From localStorage:
  - widths
  - alignments
  - colors
  - backgrounds
  ↓
Render HTML Structure
  ↓
Apply Styles via CSS Custom Properties
  ↓
Attach Event Listeners (resize, button click)
  ↓
On User Action → Update localStorage → Persist Changes
```

---

## Key Features Summary

1. **Easy Column Creation**
   - Command palette commands
   - Context menu integration
   - Quick 2/3/4 column templates

2. **Flexible Width Management**
   - Drag-to-resize interface
   - YAML-specified ratios
   - localStorage persistence
   - Minimum width constraints

3. **Styling Customization**
   - Global defaults via settings
   - Per-block overrides
   - Support for color/transparency
   - Text alignment control

4. **Content Rendering**
   - Full markdown support in columns
   - Syntax highlighting for code blocks
   - Obsidian-native rendering

5. **Responsive Design**
   - Flex-based layout
   - Automatic width adjustment
   - Mobile-friendly (though Obsidian is desktop-focused)

---

## Current Limitations

1. **Maximum 4 columns**: Code enforces `colIndex <= 4` for YAML ratios
2. **No nested columns**: Columns cannot contain other column blocks
3. **No background images**: Only solid colors supported
4. **Linear height calculation**: All columns share container height (no individual column heights)
5. **No column reordering**: Fixed left-to-right order
6. **No direct editing**: Users must edit the markdown code block to change content

---

## Build & Deployment

**Build Configuration:**
- TypeScript compilation with esbuild
- Plugin compiled to `main.js`
- Styles bundled as `styles.css`
- Manifest files define plugin metadata

**Development:**
```bash
npm run dev       # Watch mode
npm run build     # Production build
npm run version   # Bump version
```

---

## File Locations Reference

| File | Purpose |
|------|---------|
| `main.ts` | Main plugin logic, code block processor |
| `styles.css` | Global CSS styling |
| `src/columnRenderer.ts` | Lifecycle management |
| `src/ui/createColumns.ts` | Column insertion |
| `src/ui/settings.ts` | Global settings tab |
| `src/ui/columnModal.ts` | Per-block customization modal |
| `src/ui/button.ts` | Customise button creation |
| `src/ui/colorUtils.ts` | Color conversion utilities |

---

## Technical Implementation Details

### Markdown Code Block Processing

The plugin registers a code block processor for the `columns` language:

```typescript
this.registerMarkdownCodeBlockProcessor("columns", (source, el, ctx) => {
  // Parse YAML and content
  // Render HTML structure
  // Apply styling and interactivity
});
```

### Data Storage Strategy

**localStorage Keys Pattern:**
- Global settings: Obsidian's built-in settings storage
- Per-block data: `sc-{dataType}-{blockId}`
  - `sc-column-widths-{blockId}`: Column width percentages
  - `sc-columnAlignments-{blockId}`: Text alignment per column
  - `sc-columnBackgrounds-{blockId}`: Background colors per column
  - `sc-columnTextColors-{blockId}`: Text colors per column
  - `sc-borderColor-{blockId}`: Border styling
  - `sc-resizerColor-{blockId}`: Resizer styling

### Event Handling

**Horizontal Resizing:**
1. `mousedown` on `.column-resizer`: Capture initial state
2. `mousemove` on document: Calculate and apply new widths
3. `mouseup` on document: Save to localStorage and cleanup

**Styling Updates:**
- Via customise modal: Immediate application + localStorage save
- On reload: Load from localStorage and apply via CSS custom properties

### CSS Custom Property Application

```typescript
// Global properties (applied to :root)
document.documentElement.style.setProperty('--sc-border-width', `${borderWidth}px`);

// Per-element properties (applied to specific elements)
columnEl.style.setProperty('--sc-column-width', `${width}%`);
```

This architecture provides a clean separation of concerns with UI logic isolated in the `src/ui` directory, while core plugin functionality resides in `main.ts` and rendering logic in `columnRenderer.ts`.
