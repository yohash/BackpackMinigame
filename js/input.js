/**
 * InputHandler - Manages all user input for the backpack game
 * SCALED VERSION: Added coordinate remapping for responsive scaling
 * PERSISTENCE VERSION: Track all pixel positions for memory
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
     * Get mouse position relative to canvas, accounting for scaling
     */
    getMousePosition(event) {
        const rect = this.canvas.getBoundingClientRect();
        
        // Get position relative to the canvas element
        const canvasX = event.clientX - rect.left;
        const canvasY = event.clientY - rect.top;
        
        // The canvas fills its wrapper which maintains aspect ratio
        // Convert from displayed size to internal game coordinates
        const gameX = (canvasX / rect.width) * this.game.baseWidth;
        const gameY = (canvasY / rect.height) * this.game.baseHeight;
        
        return {
            x: gameX,
            y: gameY
        };
    }
    
    /**
     * Get touch position relative to canvas, accounting for scaling
     */
    getTouchPosition(event) {
        const rect = this.canvas.getBoundingClientRect();
        const touch = event.touches[0] || event.changedTouches[0];
        
        // Get position relative to the canvas element
        const canvasX = touch.clientX - rect.left;
        const canvasY = touch.clientY - rect.top;
        
        // The canvas fills its wrapper which maintains aspect ratio
        // Convert from displayed size to internal game coordinates
        const gameX = (canvasX / rect.width) * this.game.baseWidth;
        const gameY = (canvasY / rect.height) * this.game.baseHeight;
        
        return {
            x: gameX,
            y: gameY
        };
    }
    
    /**
     * Find object at given position (in game coordinates)
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
        
        if (obj) {
            // If object is placed in backpack, pick it up
            if (obj.isPlaced) {
                this.pickUpPlacedObject(obj);
            } else {
                // Start dragging unplaced object
                this.startDrag(obj, this.mousePosition);
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
            // Update hover state
            const obj = this.getObjectAtPosition(this.mousePosition.x, this.mousePosition.y);
            
            // Update hovered object in game state
            this.game.state.hoveredObject = obj;
            
            // Update cursor style based on hover
            this.canvas.style.cursor = obj ? 'grab' : 'default';
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
        
        // Set hovered object for touch
        this.game.state.hoveredObject = obj;
        
        if (obj) {
            if (obj.isPlaced) {
                this.pickUpPlacedObject(obj);
            } else {
                this.startDrag(obj, position);
            }
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
        
        // Clear hovered object on touch end
        this.game.state.hoveredObject = null;
        
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
     * Update drag position (in game coordinates)
     * MODIFIED: Always update pixel positions for memory tracking
     */
    updateDrag(position) {
        const obj = this.game.state.draggedObject;
        if (!obj) return;
        
        // Update object position (centered on cursor with offset)
        obj.pixelX = position.x - this.game.state.dragOffset.x;
        obj.pixelY = position.y - this.game.state.dragOffset.y;
        
        // These pixel positions will be remembered even if not placed in grid
    }
    
    /**
     * End drag operation
     * MODIFIED: Track final pixel positions for memory
     */
    endDrag(position) {
        const obj = this.game.state.draggedObject;
        if (!obj) return;
        
        // Check if object overlaps with grid area
        const objBounds = {
            left: obj.pixelX,
            right: obj.pixelX + (obj.width * this.game.config.cellSize),
            top: obj.pixelY,
            bottom: obj.pixelY + (obj.height * this.game.config.cellSize)
        };
        
        const gridBounds = {
            left: this.game.gridX,
            right: this.game.gridX + this.game.gridPixelWidth,
            top: this.game.gridY,
            bottom: this.game.gridY + this.game.gridPixelHeight
        };
        
        // Check if object overlaps with grid
        const overlapsGrid = !(objBounds.right <= gridBounds.left || 
                               objBounds.left >= gridBounds.right || 
                               objBounds.bottom <= gridBounds.top || 
                               objBounds.top >= gridBounds.bottom);
        
        if (overlapsGrid) {
            // Object touches grid - try to place it
            // Use nearest grid snap (same as ghost preview)
            const snapX = obj.pixelX + this.game.config.cellSize / 2;
            const snapY = obj.pixelY + this.game.config.cellSize / 2;
            const gridPos = this.game.pixelToGrid(snapX, snapY);
            
            // Clamp to valid grid bounds
            const clampedX = Math.max(0, Math.min(gridPos.x, this.game.config.backpackWidth - obj.width));
            const clampedY = Math.max(0, Math.min(gridPos.y, this.game.config.backpackHeight - obj.height));
            
            if (this.game.isValidPlacement(clampedX, clampedY, obj)) {
                // Valid placement in backpack
                this.game.handleObjectPlaced(obj, clampedX, clampedY);
                console.log(`Placed ${obj.name} in backpack at grid position (${clampedX}, ${clampedY})`);
            } else {
                // Invalid placement - return to original position
                obj.pixelX = this.dragStartPosition.x;
                obj.pixelY = this.dragStartPosition.y;
                this.game.showFeedback(`Invalid placement`, 'error');
                console.log(`Failed to place ${obj.name} in backpack - returning to original position`);
            }
        } else {
            // Object is outside grid - it stays in staging area
            // The current pixelX and pixelY are already set and will be remembered
            console.log(`${obj.name} placed in staging area at (${obj.pixelX}, ${obj.pixelY})`);
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
                    // Check if this cell should be blocked or null
                    if (this.game.config.gridMask && 
                        this.game.config.gridMask[obj.gridY + y] && 
                        this.game.config.gridMask[obj.gridY + y][obj.gridX + x] === 0) {
                        this.game.state.grid[obj.gridY + y][obj.gridX + x] = 'blocked';
                    } else {
                        this.game.state.grid[obj.gridY + y][obj.gridX + x] = null;
                    }
                }
            }
        }
        
        // Update object state
        obj.isPlaced = false;
        obj.gridX = -1;
        obj.gridY = -1;
        // Keep pixelX and pixelY - they're already correct for dragging
        
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