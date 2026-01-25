import { createMarkdownColumns } from 'src/ui/createColumns';
import { MarkdownRenderer, MarkdownView, Plugin, Notice } from 'obsidian';
import { CustomiseColumnsModal } from 'src/ui/columnModal';
import { DEFAULT_SETTINGS, ColumnsPluginSettings, ColumnWidthsSettingTab } from 'src/ui/settings';
import { createCustomiseButton } from 'src/ui/button';
import { ColumnRenderer } from 'src/columnRenderer';
import { SourceUpdater } from 'src/sourceUpdater';


export default class ColumnsPlugin extends Plugin {
	markdownRenderer: any;
	settings: ColumnsPluginSettings

	async onload() {

		// Load columns from command palette
		this.addCommand({
    	  id: "two-columns",
    	  name: "Add 2 columns",
    	  callback: () => {
    	   createMarkdownColumns(this.app, 2);
    	  }
    	});

    	this.addCommand({
    	  id: "three-columns",
    	  name: "Add 3 columns",
    	  callback: () => {
    	    createMarkdownColumns(this.app, 3);
    	  }
    	});

    	this.addCommand({
    	  id: "four-columns",
    	  name: "Add 4 columns",
    	  callback: () => {
    	    createMarkdownColumns(this.app, 4);
    	  }
    	});

		// Menu item to create columns on the current line
		this.registerEvent(
			this.app.workspace.on('editor-menu', (menu, editor, view) => {
				menu.addItem((item) => {
					item.setTitle('Add columns')
					item.setIcon('between-vertical-end')

					const submenu = item.setSubmenu();

					submenu.addItem((subItem) => {
						subItem.setTitle('2 columns')
							.setIcon('columns-2')
							.onClick(() => {
								createMarkdownColumns(this.app, 2)
							});
					});

					submenu.addItem((subItem) => {
						subItem.setTitle('3 columns')
							.setIcon('columns-3')
							.onClick(() => {
								createMarkdownColumns(this.app, 3)
							});
					});

					submenu.addItem((subItem) => {
						subItem.setTitle('4 columns')
							.setIcon('columns-4')
							.onClick(() => {
								createMarkdownColumns(this.app, 4)
							});
					});
				}
				);
			})
		);

		// Apply styles to the columns based on settings
		await this.loadSettings();
		const columnSettingsTab = new ColumnWidthsSettingTab(this.app, this)
  		this.addSettingTab(columnSettingsTab);
		columnSettingsTab.applyStyles();

		// Render the columns for both read and live preview modes
		this.registerMarkdownCodeBlockProcessor("columns", async (source, el, ctx) => {
			const parts = source.split(/^===$/m);

			// Extract id from yaml
			const metadataSection = parts[0].trim();
			const idMatch = metadataSection.match(/^id:\s*(.+)$/m);
			if (!idMatch || !idMatch[1]) {
				throw new Error("No 'id' found in columns code block metadata.");
			}

			// [NEW FEATURE] Extract additional sytles from yaml if needed
			const ratioRegex = /^column-(\d+)-ratio:\s*(.+)$/gm;
			let match: RegExpExecArray | null;
			const totalCols = parts.length - 1;
			let providedRatios = Array(totalCols).fill(0);

			while ((match = ratioRegex.exec(metadataSection)) !== null) {
			  const colIndex = parseInt(match[1], 10); // 1-based
			  const ratio = parseFloat(match[2].trim());

			  if (!isNaN(ratio) && colIndex >= 1 && colIndex <= 4) {
			    providedRatios[colIndex - 1] = ratio; // store as 0-based index
			  }
			}

			// [NEW FEATURE] Extract height values from YAML
			const heightRegex = /^column-(\d+)-height:\s*(.+)$/gm;
			let heightMatch: RegExpExecArray | null;
			const providedHeights: Record<number, string> = {};

			while ((heightMatch = heightRegex.exec(metadataSection)) !== null) {
			  const colIndex = parseInt(heightMatch[1], 10);
			  const height = heightMatch[2].trim();

			  if (colIndex >= 1 && colIndex <= totalCols) {
			    providedHeights[colIndex] = height;
			  }
			}

			// Extract container height from YAML
			const containerHeightMatch = metadataSection.match(/^container-height:\s*(.+)$/m);
			let containerHeight: string | null = null;
			if (containerHeightMatch) {
			  containerHeight = containerHeightMatch[1].trim();
			}
			
			// Render yaml as HTML container for the columns
			const blockId = idMatch[1].trim();
			const container = document.createElement("div");
			container.className = `markdown-columns-resizable`;
			container.id = blockId

			// Load custom styles from localStorage - set via column settings modal
			const storageKey = `sc-column-widths-${blockId}`;

			// [NEW FEATURE] Loading optional width styles from yaml
			if (providedRatios.some(r => r !== 0)) {
				const codeBlockEl = document.querySelector<HTMLElement>('.cm-preview-code-block');
				const containerWidth = codeBlockEl!.offsetWidth;

				if (containerWidth <= 0) return;
				const resizerWidthPx = this.settings.resizerWidth || DEFAULT_SETTINGS.resizerWidth;
				const resizerPercent = (resizerWidthPx / containerWidth) * 100;
				const totalResizers = Math.max(totalCols - 1, 0);
				const totalResizerPercent = resizerPercent * totalResizers;
				let remainingPercent = 100 - totalResizerPercent;

				const providedSum = providedRatios.reduce((a, b) => a + b, 0);
				const zeroCount = providedRatios.filter(r => r === 0).length;
				const fillValue = (remainingPercent - providedSum) / zeroCount;

				if (providedRatios.some(r => r === 0)) {
				    providedRatios = providedRatios.map(r => (r === 0 ? fillValue : r));
				} else {
				    const halfOfResizer = resizerPercent / 2
					providedRatios = providedRatios.map(x => x-halfOfResizer)
				}

				const checkSum = providedRatios.reduce((a, b) => a + b, 0) + totalResizerPercent;
				if (Math.round(checkSum) !== 100) {
    			    // Create a visible error message in the preview
    			    const errorDiv = document.createElement("div");
    			    errorDiv.style.color = "red";
    			    errorDiv.style.fontWeight = "bold";
    			    errorDiv.textContent = `Error: Column ratios must sum to 100%. Currently sum is ${checkSum}%.`;
    			    el.appendChild(errorDiv);
    			    return; // Stop further rendering
    			}
				
				const providedRatiosString = providedRatios.map(r => `${r}%`);
				this.app.saveLocalStorage(storageKey, JSON.stringify(providedRatiosString));
			}

			const savedWidths = this.app.loadLocalStorage(storageKey);
			const columnWidths: string[] = savedWidths ? JSON.parse(savedWidths) : [];

			// [NEW FEATURE] Load height data from localStorage
			const containerHeightKey = `sc-container-height-${blockId}`;
			const savedContainerHeight = this.app.loadLocalStorage(containerHeightKey);

			const columnHeightsKey = `sc-column-heights-${blockId}`;
			const savedHeights = this.app.loadLocalStorage(columnHeightsKey);
			const columnHeights: string[] = savedHeights ? JSON.parse(savedHeights) : [];

			const savedAlignments = this.app.loadLocalStorage(`sc-columnAlignments-${blockId}`);
			const columnAlignments: Record<number, "left" | "center" | "right"> = savedAlignments ? JSON.parse(savedAlignments) : {};

			const savedBackgrounds = this.app.loadLocalStorage(`sc-columnBackgrounds-${blockId}`);	
			const columnBackgrounds: Record<number, string> = savedBackgrounds ? JSON.parse(savedBackgrounds) : {};
			
			const savedTextColors = this.app.loadLocalStorage(`sc-columnTextColors-${blockId}`);	
			const columnTextColors: Record<number, string> = savedTextColors ? JSON.parse(savedTextColors) : {};

			const borderData = JSON.parse(this.app.loadLocalStorage(`sc-borderColor-${blockId}`) || '{}');
			const savedBorderColor = borderData.color;
			const showBorder = borderData.show;
			if (savedBorderColor) {
				// prevents clashing with global border style
				container.style.setProperty("--sc-border-shown", showBorder ? "solid" : "none");
				container.style.setProperty("--sc-border-color", savedBorderColor);
			}

			// [NEW FEATURE] Apply container height from YAML or localStorage
			if (containerHeight) {
				container.style.setProperty("--sc-container-height", containerHeight);
				this.app.saveLocalStorage(containerHeightKey, containerHeight);
			} else if (savedContainerHeight) {
				container.style.setProperty("--sc-container-height", savedContainerHeight);
			}

			const resizerData = JSON.parse(this.app.loadLocalStorage(`sc-resizerColor-${blockId}`) || '{}');
			const savedResizerColor = resizerData.color;
			const showResizer = resizerData.show;	

			// Column Renderer to manage life cycle 
			const child = new ColumnRenderer(container, blockId);
			ctx.addChild(child);

			// Create HTML structure for columns
			for (let i = 1; i < parts.length; i++) {
				const col = document.createElement("div");
				col.className = "column";
				col.dataset.index = (i).toString();

				const align = columnAlignments[i] ?? "left";
				const bg = columnBackgrounds[i] || "var(--background-primary)";
				const textColor = columnTextColors[i] || "var(--text-normal)";
				const width = columnWidths[i - 1] || `${100 / parts.length-1}%`;

				col.style.setProperty('--sc-column-bg', bg);
				col.style.setProperty('--sc-column-text-color', textColor);
				col.style.setProperty('--sc-column-width', width);

				// [NEW FEATURE] Apply column height from YAML or localStorage
				const height = providedHeights[i] || columnHeights[i - 1] || "auto";
				col.style.setProperty('--sc-column-height', height);

				col.classList.add(`text-${align}`);
				col.classList.add('column-style');

				await MarkdownRenderer.render(
					this.app,
					parts[i].trim(),
					col,
					ctx.sourcePath,
					child
				);

				container.appendChild(col);

				// [NEW FEATURE] Add vertical resizer for each column
				const verticalResizer = document.createElement("div");
				verticalResizer.className = "column-vertical-resizer";

				let isVerticalDragging = false;
				let startY: number;
				let startHeight: number;

				verticalResizer.addEventListener("mousedown", (e) => {
					isVerticalDragging = true;
					document.body.classList.add("cursor-row-resize");
					startY = e.clientY;
					startHeight = col.getBoundingClientRect().height;
					e.preventDefault();
				});

				document.addEventListener("mousemove", (e) => {
					if (!isVerticalDragging) return;

					const dy = e.clientY - startY;
					const newHeight = startHeight + dy;

					if (newHeight < 50) return; // Minimum height

					col.style.setProperty('--sc-column-height', `${newHeight}px`);
				});

				document.addEventListener("mouseup", () => {
					if (isVerticalDragging) {
						isVerticalDragging = false;
						document.body.classList.remove("cursor-row-resize");

						// Save column heights
						const heights = Array.from(container.querySelectorAll(".column")).map(
							(col: any) => getComputedStyle(col).getPropertyValue('--sc-column-height')?.trim() || "auto"
						);
						this.app.saveLocalStorage(columnHeightsKey, JSON.stringify(heights));
					}
				});

				col.appendChild(verticalResizer);

				// [NEW FEATURE] Make column directly editable on click
				let isEditing = false;
				let originalContent = parts[i].trim();

				col.addEventListener("click", (e) => {
					// Don't trigger if clicking on links or other interactive elements
					const target = e.target as HTMLElement;
					if (target.tagName === 'A' || target.closest('a') || isEditing) {
						return;
					}

					isEditing = true;
					originalContent = parts[i].trim();

					// Store the rendered content
					const renderedContent = col.innerHTML;

					// Clear column and add textarea
					col.innerHTML = '';
					col.style.padding = '0';

					const textarea = document.createElement('textarea');
					textarea.value = originalContent;
					textarea.style.width = '100%';
					textarea.style.height = '100%';
					textarea.style.minHeight = '100px';
					textarea.style.padding = '0.8em';
					textarea.style.border = 'none';
					textarea.style.outline = '2px solid var(--interactive-accent)';
					textarea.style.backgroundColor = 'var(--background-primary)';
					textarea.style.color = 'var(--text-normal)';
					textarea.style.fontFamily = 'var(--font-monospace)';
					textarea.style.fontSize = '14px';
					textarea.style.resize = 'none';
					textarea.style.boxSizing = 'border-box';

					col.appendChild(textarea);
					textarea.focus();
					textarea.select();

					const saveEdit = async () => {
						const newContent = textarea.value;
						if (newContent !== originalContent) {
							const sourceUpdater = new SourceUpdater(this.app);
							const success = await sourceUpdater.updateColumnContent(blockId, i, newContent);
							if (success) {
								new Notice(`Column ${i} updated`);
							} else {
								new Notice("Failed to update column", 3000);
								// Restore original
								col.innerHTML = renderedContent;
								col.style.padding = '0.8em';
							}
						} else {
							// No changes, just restore
							col.innerHTML = renderedContent;
							col.style.padding = '0.8em';
						}
						isEditing = false;
					};

					const cancelEdit = () => {
						col.innerHTML = renderedContent;
						col.style.padding = '0.8em';
						isEditing = false;
					};

					// Save on blur
					textarea.addEventListener("blur", saveEdit, { once: true });

					// Keyboard shortcuts
					textarea.addEventListener("keydown", (e) => {
						if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
							e.preventDefault();
							textarea.blur(); // Trigger save
						} else if (e.key === 'Escape') {
							e.preventDefault();
							textarea.removeEventListener("blur", saveEdit);
							cancelEdit();
						}
					});
				});

				if (savedResizerColor) {
				  const styleId = `sc-resizer-hover-style-${blockId}`;
				  let existing = document.getElementById(styleId);
				  if (existing) existing.remove(); // Clean up previous style
								
				  const css = `.markdown-columns-resizable[id="${blockId}"] > .column-resizer:hover {
				    background-color: ${savedResizerColor} !important;
				  }`;
								
				  const hoverStyle = document.createElement('style');
				  hoverStyle.id = styleId; // Tag it for future cleanup
				  hoverStyle.textContent = css;
				  document.head.appendChild(hoverStyle);
				} else{
					document.getElementById(`sc-resizer-hover-style-${blockId}`)?.remove();
				}

				if (i < parts.length - 1) {
					const resizer = document.createElement("div");
					resizer.className = "column-resizer";

					if (savedResizerColor) {
						resizer.classList.toggle("resizer-visible", showResizer);
						resizer.style.setProperty("--sc-resizer-bg", showResizer ? savedResizerColor : "transparent");
					}

					container.appendChild(resizer);
				
					let isDragging = false;
				
					let startX: number;
					let startPrevWidth: number;
					let startNextWidth: number;
					
					// Get columns and their widths
					resizer.addEventListener("mousedown", (e) => {
						isDragging = true;
						document.body.classList.add("cursor-col-resize");
						startX = e.clientX;
					
						const prevCol = resizer.previousElementSibling as HTMLElement;
						const nextCol = resizer.nextElementSibling as HTMLElement;
					
						startPrevWidth = prevCol.getBoundingClientRect().width;
						startNextWidth = nextCol.getBoundingClientRect().width;
					
						e.preventDefault();
					});

					// Update column widths while dragging
					document.addEventListener("mousemove", (e) => {
						if (!isDragging) return;
					
						const dx = e.clientX - startX;
						const containerWidth = container.getBoundingClientRect().width;
					
						const prevCol = resizer.previousElementSibling as HTMLElement;
						const nextCol = resizer.nextElementSibling as HTMLElement;
					
						const newPrev = startPrevWidth + dx;
						const newNext = startNextWidth - dx;

						if (newPrev < 50 || newNext < 50) {
							// Prevent columns from becoming too small
							return;
						}

						const percentPrev = (newPrev / containerWidth) * 100;
						const percentNext = (newNext / containerWidth) * 100;
					
						prevCol.style.setProperty('--sc-column-width', `${percentPrev}%`);
						nextCol.style.setProperty('--sc-column-width', `${percentNext}%`);
					});

					
					// Stop dragging when mouse is released
					// This will save the current widths to localStorage
					document.addEventListener("mouseup", () => {
						if (isDragging) {
							isDragging = false;
							document.body.classList.remove("cursor-col-resize");
						
							const widths = Array.from(container.querySelectorAll(".column")).map(
								(col: any) => getComputedStyle(col).getPropertyValue('--sc-column-width')?.trim()
							);
							this.app.saveLocalStorage(storageKey, JSON.stringify(widths));
						}
					});
				}
			}

			// [NEW FEATURE] Add container vertical resizer
			const containerResizer = document.createElement("div");
			containerResizer.className = "container-vertical-resizer";

			let isContainerDragging = false;
			let containerStartY: number;
			let containerStartHeight: number;

			containerResizer.addEventListener("mousedown", (e) => {
				isContainerDragging = true;
				document.body.classList.add("cursor-row-resize");
				containerStartY = e.clientY;
				containerStartHeight = container.getBoundingClientRect().height;
				e.preventDefault();
			});

			document.addEventListener("mousemove", (e) => {
				if (!isContainerDragging) return;

				const dy = e.clientY - containerStartY;
				const newHeight = containerStartHeight + dy;

				if (newHeight < 100) return; // Minimum container height

				container.style.setProperty('--sc-container-height', `${newHeight}px`);
			});

			document.addEventListener("mouseup", () => {
				if (isContainerDragging) {
					isContainerDragging = false;
					document.body.classList.remove("cursor-row-resize");

					const finalHeight = getComputedStyle(container).getPropertyValue('--sc-container-height')?.trim();
					if (finalHeight) {
						this.app.saveLocalStorage(containerHeightKey, finalHeight);
					}
				}
			});

			container.appendChild(containerResizer);

			// Add a button to customise the columns within the code block
			const parent = el.parentElement;
  			if (parent && 
				parent.className.includes("cm-preview-code-block")) {	
				const customiseButton = createCustomiseButton(container)
				customiseButton.addEventListener("click", () => {
					new CustomiseColumnsModal(this.app, this, blockId, parts.length - 1, columnAlignments, columnBackgrounds, columnTextColors).open();
				});
				parent.appendChild(customiseButton);
			}
			
			// Add the columns container to the rendered element
			el.appendChild(container);
		});
	}

	onunload() {
		console.log("Unloading Simple Columns plugin.");

		const rootStyle = document.documentElement.style;

		rootStyle.removeProperty('--sc-border-width');
		rootStyle.removeProperty('--sc-border-shown');
		rootStyle.removeProperty('--sc-border-color');
		rootStyle.removeProperty('--sc-border-radius');
		rootStyle.removeProperty('--sc-resizer-bg');
		rootStyle.removeProperty('--sc-resizer-hover-bg');
		rootStyle.removeProperty('--sc-resizer-width');
	}

	async loadSettings() {
    	this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  	}

  	async saveSettings() {
    	await this.saveData(this.settings);
  	}	
}