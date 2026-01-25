# How to Use the New Features

## 🔧 Installation & Setup

### Step 1: Copy Plugin Files to Obsidian

You need to copy the built plugin files to your Obsidian vault:

1. **Find your Obsidian vault's plugin folder:**
   - Navigate to: `YourVault/.obsidian/plugins/`

2. **Create or locate the Simple-Columns folder:**
   - Path should be: `YourVault/.obsidian/plugins/Simple-Columns/`

3. **Copy these 3 files:**
   - `main.js` (from this repo)
   - `manifest.json` (from this repo)
   - `styles.css` (from this repo)

### Step 2: Reload Obsidian

1. Open Obsidian
2. Go to Settings → Community Plugins
3. Find "Simple Columns" and toggle it OFF then ON
4. Or use Ctrl+R to reload Obsidian

---

## ✨ New Feature #1: Direct Column Editing

### How to Use:
1. **Click anywhere in a column** - The column will turn into a textarea
2. **Edit the markdown** - Type your changes
3. **Save:**
   - Press `Ctrl+Enter` (or `Cmd+Enter` on Mac), OR
   - Click outside the column (blur)
4. **Cancel:**
   - Press `Escape` to cancel without saving

### What Happens:
- A textarea appears with an accent-colored border
- You edit raw markdown (can add links, formatting, etc.)
- Changes save directly to your source file
- The column re-renders automatically after saving

### Tips:
- You can still click links by clicking directly on them
- The original markdown format is preserved
- All existing features (colors, alignment, etc.) continue to work

---

## ✨ New Feature #2: Vertical Height Control

### Individual Column Heights

**How to Resize:**
1. Hover over the **bottom edge** of any column
2. You'll see a subtle gray bar appear (gets highlighted when you hover)
3. Click and drag up/down to resize that column's height
4. Release to save the height

**The resizer bar:**
- Default: Subtle gray bar at the bottom of each column
- On hover: Becomes brighter (accent color) and slightly taller
- Minimum height: 50px (prevents columns from being too small)

### Container Height (All Columns Together)

**How to Resize:**
1. Hover over the **very bottom** of the entire column block
2. You'll see a slightly thicker gray bar appear
3. Click and drag up/down to resize the entire container
4. All columns resize together
5. Release to save the height

**The container resizer:**
- Located at the very bottom of the column block
- Slightly thicker and more prominent than individual column resizers
- Minimum height: 100px

### YAML Height Specification

You can also specify heights directly in the YAML metadata:

```markdown
```columns
id: abc123
column-1-height: 300px
column-2-height: 400px
container-height: 500px
===
Column 1 content
===
Column 2 content
```
```

**Supported units:**
- Pixels: `300px`
- Em units: `20em`
- Auto: `auto` (default)

### Height Controls in Customization Modal

1. Click the customize button (gear icon) on your column block
2. Scroll to each column's settings
3. Find the "Column height" input field
4. Enter a height value (e.g., `300px`, `20em`, or `auto`)
5. Changes apply immediately

### Where Heights Are Saved:
- localStorage keys:
  - `sc-column-heights-{blockId}` - Individual column heights
  - `sc-container-height-{blockId}` - Overall container height
- Heights persist across page reloads

---

## 🎯 Quick Troubleshooting

### "I don't see the height resizers"
- Make sure you've copied the updated `styles.css` file
- Reload Obsidian (Ctrl+R)
- Hover directly over the bottom edge of a column
- They have a subtle background by default

### "Direct editing doesn't work"
- Make sure you've copied the updated `main.js` file
- Reload the plugin (toggle off/on in settings)
- Try clicking in the middle of the column content (not on links)

### "Changes don't save"
- Ensure your file is saved to disk (not a new unsaved note)
- Check the console for errors (Ctrl+Shift+I)

---

## 💡 Visual Guide

### Height Resizers:
```
┌─────────────┬─────────────┐
│  Column 1   │  Column 2   │
│             │             │
│             │             │
├─────────────┼─────────────┤  ← Individual column resizers
│             │             │     (subtle gray bar, hover to highlight)
└─────────────┴─────────────┘
══════════════════════════════  ← Container resizer
                                  (thicker bar at very bottom)
```

### Direct Editing:
```
Before clicking:
┌─────────────────┐
│ Rendered        │
│ **markdown**    │
│ [link](url)     │
└─────────────────┘

After clicking:
┌═════════════════┐ ← Accent border
║ Rendered        ║
║ **markdown**    ║ ← Raw markdown in textarea
║ [link](url)     ║
└═════════════════┘
```

---

## 🚀 Examples

### Example 1: Creating a Column Block with Custom Heights

````markdown
```columns
id: example1
column-1-height: 200px
column-2-height: 400px
container-height: 500px
===
# Short Column
This column is 200px tall
===
# Tall Column
This column is 400px tall and has more content

You can add:
- Lists
- **Bold text**
- [Links](https://example.com)
```
````

### Example 2: Editing Column Content

1. Create a column block
2. Click on "Column 1" text
3. Change it to:
```markdown
# My Todo List
- [ ] Task 1
- [ ] Task 2
```
4. Press Ctrl+Enter to save
5. The column now shows a rendered todo list!

---

## ⚙️ Technical Details

**Direct Editing:**
- Click listener added to each column
- Replaces rendered content with textarea on click
- Syncs back to source markdown via `SourceUpdater` class
- Preserves exact markdown format

**Height Resizing:**
- CSS custom properties: `--sc-column-height`, `--sc-container-height`
- Drag handlers similar to existing horizontal resizers
- Heights saved to localStorage
- Supports YAML specification

**Backwards Compatibility:**
- All existing column blocks work without changes
- Heights default to `auto` if not specified
- No breaking changes to data format
