/**
 * Creates an edit button for a column that appears on hover
 * @param columnEl The column HTML element
 * @param columnIndex The index of the column (1-based)
 * @returns The button element
 */
export function createEditButton(columnEl: HTMLElement, columnIndex: number): HTMLElement {
	const button = document.createElement("button");
	button.className = "edit-column-button";
	button.setAttribute("aria-label", `Edit column ${columnIndex}`);

	// Simple pencil/edit icon SVG
	button.innerHTML = `
		<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
			<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
		</svg>
	`;

	return button;
}
