/**
 * InputHandler - Manages all user input for the backpack game
 * Handles mouse and touch events for drag and drop functionality
 */
class InputHandler {
    constructor(canvas, game) {
        this.canvas = canvas;
        this.game = game;

        // Input state
        this.mousePosition = { x: 0, y: 0 };
        this.isMouseDown = false;
        this.dragStartPosition = { x: 0, y: 0 };
        this.selectedObject = null;

        // Bind event handlers
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.handleTouchStart = this.handleTouchStart.bind(this);
        this.handleTouchMove = this.handleTouchMove.bind(this);
        this.handleTouchEnd = this.handleTouchEnd.bind(this);

        // Initialize event listeners
        this.initEventListeners();
    }

    /**
     * Initialize all event listeners
     */
    initEventListeners() {
        // Mouse events
        this.canvas.addEventListener('mousedown', this.handleMouseDown);
        this.canvas.addEventListener('mousemove', this.handleMouseMove);
        this.canvas.addEventListener('mouseup', this.handleMouseUp);
        this.canvas.addEventListener('mouseleave', this.handleMouseUp);

        // Touch events for mobile support
        this.canvas.addEventListener('touchstart', this.handleTouchStart);
        this.canvas.addEventListener('touchmove', this.handleTouchMove);
        this.canvas.addEventListener('touchend', this.handleTouchEnd);

        // Prevent context menu on right-click
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    /**
     * Get mouse position relative to canvas
     */
    getMousePosition(event) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
    }

    /**
     * Get touch position relative to canvas
     */
    getTouchPosition(event) {
        const rect = this.canvas.getBoundingClientRect();
        const touch = event.touches[0] || event.changedTouches[0];
        return {
            x: touch.clientX - rect.left,
            y: touch.clientY - rect.top
        };
    }

    /**
     * Find object at given position
     */
    getObjectAtPosition(x, y) {
        // Check objects in reverse order (top to bottom)
        const objects = [...this.game.state.objects].reverse();

        for (const obj of objects) {
            const width = obj.width * this.game.config.cellSize;
            const height = obj.height * this.game.config.cellSize;

            if (x >= obj.pixelX && x < obj.pixelX + width &&
                y >= obj.pixelY && y < obj.pixelY + height) {
                return obj;
            }
        }

        return null;
    }

    /**
     * Handle mouse down event
     */
    handleMouseDown(event) {
        this.mousePosition = this.getMousePosition(event);
        this.isMouseDown = true;

        // Find object under cursor
        const obj = this.getObjectAtPosition(this.mousePosition.x, this.mousePosition.y);

        if (obj && !obj.isPlaced) {
            this.startDrag(obj, this.mousePosition);
        } else if (obj && obj.isPlaced) {
            // Optional: Allow picking up already placed objects
            if (event.shiftKey || event.button === 2) { // Shift+click or right-click
                this.pickUpPlacedObject(obj);
            }
        }
    }

    /**
     * Handle mouse move event
     */
    handleMouseMove(event) {
        this.mousePosition = this.getMousePosition(event);

        if (this.game.state.isDragging && this.game.state.draggedObject) {
            this.updateDrag(this.mousePosition);
        } else {
            // Update cursor style based on hover
            const obj = this.getObjectAtPosition(this.mousePosition.x, this.mousePosition.y);
            this.canvas.style.cursor = obj && !obj.isPlaced ? 'grab' : 'default';
        }
    }

    /**
     * Handle mouse up event
     */
    handleMouseUp(event) {
        if (this.game.state.isDragging && this.game.state.draggedObject) {
            this.endDrag(this.mousePosition);
        }

        this.isMouseDown = false;
    }

    /**
     * Handle touch start event
     */
    handleTouchStart(event) {
        event.preventDefault();
        const position = this.getTouchPosition(event);

        // Simulate mouse down
        this.mousePosition = position;
        this.isMouseDown = true;

        const obj = this.getObjectAtPosition(position.x, position.y);
        if (obj && !obj.isPlaced) {
            this.startDrag(obj, position);
        }
    }

    /**
     * Handle touch move event
     */
    handleTouchMove(event) {
        event.preventDefault();
        const position = this.getTouchPosition(event);

        this.mousePosition = position;
        if (this.game.state.isDragging && this.game.state.draggedObject) {
            this.updateDrag(position);
        }
    }

    /**
     * Handle touch end event
     */
    handleTouchEnd(event) {
        event.preventDefault();

        if (this.game.state.isDragging && this.game.state.draggedObject) {
            this.endDrag(this.mousePosition);
        }

        this.isMouseDown = false;
    }

    /**
     * Start dragging an object
     */
    startDrag(obj, position) {
        this.game.state.isDragging = true;
        this.game.state.draggedObject = obj;

        // Calculate offset from object origin to mouse position
        this.game.state.dragOffset = {
            x: position.x - obj.pixelX,
            y: position.y - obj.pixelY
        };

        // Store original position in case we need to revert
        this.dragStartPosition = {
            x: obj.pixelX,
            y: obj.pixelY
        };

        // Update cursor
        this.canvas.style.cursor = 'grabbing';

        console.log(`Started dragging: ${obj.name || obj.id}`);
    }

    /**
     * Update drag position
     */
    updateDrag(position) {
        const obj = this.game.state.draggedObject;
        if (!obj) return;

        // Update object position (centered on cursor with offset)
        obj.pixelX = position.x - this.game.state.dragOffset.x;
        obj.pixelY = position.y - this.game.state.dragOffset.y;

        // Update ghost position for preview
        this.game.state.ghostPosition = {
            x: position.x - this.game.state.dragOffset.x + (obj.width * this.game.config.cellSize) / 2,
            y: position.y - this.game.state.dragOffset.y + (obj.height * this.game.config.cellSize) / 2
        };
    }

    /**
     * End drag operation
     */
    endDrag(position) {
        const obj = this.game.state.draggedObject;
        if (!obj) return;

        // Calculate grid position for placement
        const centerX = obj.pixelX + (obj.width * this.game.config.cellSize) / 2;
        const centerY = obj.pixelY + (obj.height * this.game.config.cellSize) / 2;

        const gridPos = this.game.pixelToGrid(centerX, centerY);

        // Attempt to place object
        if (this.game.isValidPlacement(gridPos.x, gridPos.y, obj)) {
            // Valid placement
            this.game.handleObjectPlaced(obj, gridPos.x, gridPos.y);
            console.log(`Placed ${obj.name} at grid position (${gridPos.x}, ${gridPos.y})`);
        } else {
            // Invalid placement - return to original position
            obj.pixelX = this.dragStartPosition.x;
            obj.pixelY = this.dragStartPosition.y;

            // Show feedback
            this.game.showFeedback('Invalid placement!', 'error');
            console.log(`Failed to place ${obj.name} - returning to original position`);
        }

        // Clear drag state
        this.game.state.isDragging = false;
        this.game.state.draggedObject = null;
        this.game.state.dragOffset = { x: 0, y: 0 };

        // Reset cursor
        this.canvas.style.cursor = 'default';
    }

    /**
     * Pick up an already placed object (for repositioning)
     */
    pickUpPlacedObject(obj) {
        // Clear object from grid
        for (let y = 0; y < obj.height; y++) {
            for (let x = 0; x < obj.width; x++) {
                if (this.game.state.grid[obj.gridY + y] &&
                    this.game.state.grid[obj.gridY + y][obj.gridX + x] === obj.id) {
                    this.game.state.grid[obj.gridY + y][obj.gridX + x] = null;
                }
            }
        }

        // Update object state
        obj.isPlaced = false;
        obj.gridX = -1;
        obj.gridY = -1;

        // Remove from placed objects list
        const index = this.game.state.placedObjects.indexOf(obj);
        if (index > -1) {
            this.game.state.placedObjects.splice(index, 1);
        }

        // Start dragging the object
        this.startDrag(obj, this.mousePosition);

        // Update UI
        this.game.updateObjectCounter();
        this.game.checkContinueButton();
    }

    /**
     * Clean up event listeners
     */
    destroy() {
        this.canvas.removeEventListener('mousedown', this.handleMouseDown);
        this.canvas.removeEventListener('mousemove', this.handleMouseMove);
        this.canvas.removeEventListener('mouseup', this.handleMouseUp);
        this.canvas.removeEventListener('mouseleave', this.handleMouseUp);
        this.canvas.removeEventListener('touchstart', this.handleTouchStart);
        this.canvas.removeEventListener('touchmove', this.handleTouchMove);
        this.canvas.removeEventListener('touchend', this.handleTouchEnd);
    }
}