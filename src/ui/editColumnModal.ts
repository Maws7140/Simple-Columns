import { App, Modal, Notice } from "obsidian";
import type ColumnsPlugin from "../../main";

/**
 * Modal for editing column markdown content
 */
export class EditColumnModal extends Modal {
	plugin: ColumnsPlugin;
	blockId: string;
	columnIndex: number;
	currentContent: string;
	onSave: (newContent: string) => Promise<void>;

	constructor(
		app: App,
		plugin: ColumnsPlugin,
		blockId: string,
		columnIndex: number,
		currentContent: string,
		onSave: (newContent: string) => Promise<void>
	) {
		super(app);
		this.plugin = plugin;
		this.blockId = blockId;
		this.columnIndex = columnIndex;
		this.currentContent = currentContent;
		this.onSave = onSave;
	}

	onOpen() {
		const { contentEl } = this;

		contentEl.createEl("h2", { text: `Edit Column ${this.columnIndex}` });
		contentEl.createEl("p", {
			text: "Edit the markdown content for this column. Changes will be saved to the source file.",
			cls: "modal-description"
		});

		// Create textarea for markdown editing
		const textarea = contentEl.createEl("textarea");
		textarea.value = this.currentContent;
		textarea.style.width = "100%";
		textarea.style.minHeight = "300px";
		textarea.style.fontFamily = "var(--font-monospace)";
		textarea.style.fontSize = "14px";
		textarea.style.padding = "12px";
		textarea.style.marginBottom = "16px";
		textarea.style.border = "1px solid var(--background-modifier-border)";
		textarea.style.borderRadius = "4px";
		textarea.style.backgroundColor = "var(--background-primary)";
		textarea.style.color = "var(--text-normal)";
		textarea.style.resize = "vertical";

		// Focus the textarea
		setTimeout(() => textarea.focus(), 50);

		// Button container
		const buttonContainer = contentEl.createDiv({ cls: "modal-button-container" });
		buttonContainer.style.display = "flex";
		buttonContainer.style.gap = "8px";
		buttonContainer.style.justifyContent = "flex-end";

		// Save button
		const saveBtn = buttonContainer.createEl("button", { text: "Save", cls: "mod-cta" });
		saveBtn.addEventListener("click", async () => {
			await this.handleSave(textarea.value);
		});

		// Cancel button
		const cancelBtn = buttonContainer.createEl("button", { text: "Cancel" });
		cancelBtn.addEventListener("click", () => {
			this.close();
		});

		// Keyboard shortcuts
		textarea.addEventListener("keydown", (e) => {
			// Ctrl+Enter or Cmd+Enter to save
			if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
				e.preventDefault();
				this.handleSave(textarea.value);
			}
			// Escape to cancel
			if (e.key === "Escape") {
				e.preventDefault();
				this.close();
			}
		});

		// Add hint text
		const hint = contentEl.createEl("p", {
			text: "💡 Tip: Press Ctrl+Enter (Cmd+Enter on Mac) to save, or Escape to cancel.",
			cls: "modal-hint"
		});
		hint.style.fontSize = "12px";
		hint.style.color = "var(--text-muted)";
		hint.style.marginTop = "8px";
	}

	async handleSave(newContent: string) {
		try {
			await this.onSave(newContent);
			new Notice(`Column ${this.columnIndex} updated successfully`);
			this.close();
		} catch (error) {
			console.error("Failed to save column content:", error);
			new Notice("Failed to update column. Please try again.", 5000);
		}
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
