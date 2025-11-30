import { Node, mergeAttributes } from '@tiptap/core';

const ResizableImage = Node.create({
	name: 'resizableImage',
	group: 'block',
	draggable: true,

	addAttributes() {
		return {
			src: {
				default: null,
			},
			alt: {
				default: null,
			},
			title: {
				default: null,
			},
			width: {
				default: null,
			},
			height: {
				default: null,
			},
		};
	},

	parseHTML() {
		return [
			{
				tag: 'img[src]',
				getAttrs: (dom) => {
					if (typeof dom === 'string') return {};
					const img = dom;
					return {
						src: img.getAttribute('src'),
						alt: img.getAttribute('alt'),
						title: img.getAttribute('title'),
						width: img.style.width || img.getAttribute('width'),
						height: img.style.height || img.getAttribute('height'),
					};
				},
			},
		];
	},

	renderHTML({ HTMLAttributes }) {
		return ['img', mergeAttributes(HTMLAttributes)];
	},

	addNodeView() {
		return ({ node, editor, getPos, HTMLAttributes }) => {
			const dom = document.createElement('div');
			dom.className = 'resizable-image-wrapper';
			dom.style.position = 'relative';
			dom.style.display = 'inline-block';
			dom.style.maxWidth = '100%';

			const img = document.createElement('img');
			img.src = node.attrs.src || '';
			img.alt = node.attrs.alt || '';
			img.title = node.attrs.title || '';
			img.style.maxWidth = '100%';
			img.style.height = 'auto';
			img.style.display = 'block';

			if (node.attrs.width) {
				img.style.width = typeof node.attrs.width === 'string' ? node.attrs.width : `${node.attrs.width}px`;
			}
			if (node.attrs.height) {
				img.style.height = typeof node.attrs.height === 'string' ? node.attrs.height : `${node.attrs.height}px`;
			}

			dom.appendChild(img);

			// Create resize handle
			const handle = document.createElement('div');
			handle.className = 'resize-handle';
			handle.style.cssText = `
				position: absolute;
				bottom: 0;
				right: 0;
				width: 16px;
				height: 16px;
				background: #1a3a5f;
				border: 2px solid white;
				border-radius: 2px;
				cursor: nwse-resize;
				opacity: 0;
				transition: opacity 0.2s;
				z-index: 10;
			`;

			dom.appendChild(handle);

			// Show handle on hover (if not already selected)
			dom.addEventListener('mouseenter', () => {
				if (!dom.classList.contains('selected')) {
					handle.style.opacity = '1';
				}
			});
			dom.addEventListener('mouseleave', () => {
				if (!dom.classList.contains('selected')) {
					handle.style.opacity = '0';
				}
			});

			// Make image resizable
			let isResizing = false;
			let startX = 0;
			let startY = 0;
			let startWidth = 0;
			let startHeight = 0;

			handle.addEventListener('mousedown', (e) => {
				e.preventDefault();
				e.stopPropagation();
				isResizing = true;
				startX = e.clientX;
				startY = e.clientY;
				startWidth = img.offsetWidth;
				startHeight = img.offsetHeight;

				const onMouseMove = (e) => {
					if (!isResizing) return;
					const dx = e.clientX - startX;
					const dy = e.clientY - startY;
					
					let newWidth = startWidth + dx;
					let newHeight = startHeight + dy;

					// Maintain aspect ratio if shift is held
					if (e.shiftKey) {
						const aspectRatio = startWidth / startHeight;
						newHeight = newWidth / aspectRatio;
					}

					// Minimum size
					newWidth = Math.max(50, newWidth);
					newHeight = Math.max(50, newHeight);

					img.style.width = `${newWidth}px`;
					img.style.height = `${newHeight}px`;
				};

				const onMouseUp = () => {
					if (!isResizing) return;
					isResizing = false;
					
					// Update node attributes
					const pos = getPos();
					if (typeof pos === 'number') {
						editor.commands.command(({ tr }) => {
							tr.setNodeMarkup(pos, undefined, {
								...node.attrs,
								width: `${img.offsetWidth}px`,
								height: `${img.offsetHeight}px`,
							});
							return true;
						});
					}

					document.removeEventListener('mousemove', onMouseMove);
					document.removeEventListener('mouseup', onMouseUp);
				};

				document.addEventListener('mousemove', onMouseMove);
				document.addEventListener('mouseup', onMouseUp);
			});

			// Keep handle visible when selected
			const updateHandleVisibility = () => {
				const { selection } = editor.state;
				const pos = getPos();
				if (typeof pos === 'number') {
					const isSelected = selection.from <= pos && selection.to >= pos + node.nodeSize;
					if (isSelected) {
						dom.classList.add('selected');
						handle.style.opacity = '1';
					} else {
						dom.classList.remove('selected');
						handle.style.opacity = '0';
					}
				}
			};

			editor.on('selectionUpdate', updateHandleVisibility);
			updateHandleVisibility(); // Initial check

			return {
				dom,
				destroy: () => {
					editor.off('selectionUpdate', updateHandleVisibility);
				},
			};
		};
	},

	addCommands() {
		return {
			setImage: (options) => ({ commands }) => {
				return commands.insertContent({
					type: this.name,
					attrs: {
						src: options.src,
						alt: options.alt || '',
						title: options.title || options.alt || '',
					},
				});
			},
		};
	},
});

export { ResizableImage };

