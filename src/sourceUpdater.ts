import { App, TFile, MarkdownView } from "obsidian";

/**
 * Handles reading and updating column content in the source markdown file
 */
export class SourceUpdater {
	constructor(private app: App) {}

	/**
	 * Update a specific column's content in the source markdown file
	 * @param blockId The unique ID of the columns block
	 * @param columnIndex The index of the column to update (1-based)
	 * @param newContent The new markdown content for the column
	 * @returns true if successful, false otherwise
	 */
	async updateColumnContent(
		blockId: string,
		columnIndex: number,
		newContent: string
	): Promise<boolean> {
		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!activeView) {
			console.error("No active markdown view");
			return false;
		}

		const file = activeView.file;
		if (!file) {
			console.error("No file in active view");
			return false;
		}

		try {
			const fullContent = await this.app.vault.read(file);

			// Find and replace the specific columns block
			const blockRegex = /```columns\n([\s\S]*?)```/g;
			let updated = false;

			const newFullContent = fullContent.replace(blockRegex, (fullMatch, blockContent) => {
				// Check if this is the target block by matching the id
				const idMatch = blockContent.match(/^id:\s*(.+)$/m);
				if (!idMatch || idMatch[1].trim() !== blockId) {
					return fullMatch; // Not the target block, return unchanged
				}

				// Split the block content by === delimiters
				const parts = blockContent.split(/^===$/m);

				if (columnIndex >= parts.length) {
					console.error(`Column index ${columnIndex} out of range (total parts: ${parts.length})`);
					return fullMatch;
				}

				// Update the specific column content
				// Note: parts[0] is the metadata section, so column 1 is at index 1
				parts[columnIndex] = `\n${newContent.trim()}\n`;

				// Reconstruct the block
				updated = true;
				return "```columns\n" + parts.join("===") + "```";
			});

			if (!updated) {
				console.error(`Block with id "${blockId}" not found in file`);
				return false;
			}

			// Write the updated content back to the file
			await this.app.vault.modify(file, newFullContent);
			return true;

		} catch (error) {
			console.error("Error updating column content:", error);
			return false;
		}
	}

	/**
	 * Extract current column content from source file
	 * @param blockId The unique ID of the columns block
	 * @param columnIndex The index of the column to retrieve (1-based)
	 * @returns The column content, or null if not found
	 */
	async getColumnContent(blockId: string, columnIndex: number): Promise<string | null> {
		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!activeView?.file) {
			console.error("No active markdown view or file");
			return null;
		}

		try {
			const fullContent = await this.app.vault.read(activeView.file);
			const blockRegex = /```columns\n([\s\S]*?)```/g;

			let match: RegExpExecArray | null;
			while ((match = blockRegex.exec(fullContent)) !== null) {
				const blockContent = match[1];
				const idMatch = blockContent.match(/^id:\s*(.+)$/m);

				if (idMatch && idMatch[1].trim() === blockId) {
					// Found the target block
					const parts = blockContent.split(/^===$/m);

					if (columnIndex < parts.length) {
						// Return the column content (trimmed)
						return parts[columnIndex].trim();
					} else {
						console.error(`Column index ${columnIndex} out of range (total parts: ${parts.length})`);
						return null;
					}
				}
			}

			console.error(`Block with id "${blockId}" not found in file`);
			return null;

		} catch (error) {
			console.error("Error reading column content:", error);
			return null;
		}
	}
}
