/**
 * BackpackGame - Main game controller
 * SCALED VERSION: Added responsive scaling with coordinate remapping
 * PERSISTENCE VERSION: Added full position memory support
 * SHAPES VERSION: Added support for irregular object shapes
 */
class BackpackGame {
    constructor(canvasId, config) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        // Scaling properties
        this.baseWidth = 1600;
        this.baseHeight = 900;
        this.scale = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        this.config = {
            backpackWidth: 5,
            backpackHeight: 5,
            cellSize: 100, // Base cell size at 1:1 scale
            gridXOffset: 0,
            gridYOffset: 0,
            padding: 60,
            gridLineWidth: 1,
            gridLineColor: '#e2e8f0',
            backpackColor: '#ffffff',
            backpackBorderColor: '#4a5568',
            stagingAreaPadding: 20,
            gridMask: [
                [0, 1, 1, 1, 1],
                [0, 1, 1, 1, 1],
                [0, 1, 1, 1, 1],
                [1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1]
            ],
            memoryData: {} // Add memory data to config
        };
        
        // Apply user config on top of defaults
        if (config) {
            Object.assign(this.config, config);
        }
        
        // Game state
        this.state = {
            isRunning: false,
            isDragging: false,
            draggedObject: null,
            dragOffset: { x: 0, y: 0 },
            objects: [],
            placedObjects: [],
            grid: null,
            sprites: {},
            lastFrameTime: 0,
            feedbackMessage: '',
            feedbackTimeout: null,
            feedbackType: 'info',
            backpackNativeWidth: 0,
            backpackNativeHeight: 0,
            hoveredObject: null,
            shapeOverlayState: null // Track overlay state: 'hover', 'dragging', 'valid', 'invalid'
        };
        
        // Calculate base grid dimensions (at 1:1 scale)
        this.gridPixelWidth = this.config.backpackWidth * this.config.cellSize;
        this.gridPixelHeight = this.config.backpackHeight * this.config.cellSize;
        
        // These will be set after backpack sprite loads
        this.backpackX = 0;
        this.backpackY = 0;
        this.gridX = 0;
        this.gridY = 0;
        
        // Initialize subsystems
        this.gridSystem = null;
        this.objectManager = null;
        this.renderer = null;
        this.inputHandler = null;
        this.debugConsole = null;
        
        // Bind methods
        this.gameLoop = this.gameLoop.bind(this);
        this.handleObjectPlaced = this.handleObjectPlaced.bind(this);
        this.handleContinue = this.handleContinue.bind(this);
        this.handleReset = this.handleReset.bind(this);
        this.handleResize = this.handleResize.bind(this);
        
        // Set up resize listener
        window.addEventListener('resize', this.handleResize);
    }
    
    /**
     * Normalize object shape - ensure it has a shape grid
     */
    normalizeObjectShape(obj) {
        // Store original dimensions if not already stored
        if (obj.originalWidth === undefined) {
            obj.originalWidth = obj.width;
            obj.originalHeight = obj.height;
        }
        
        if (!obj.shape) {
            // Generate rectangular shape from width and height
            obj.shape = [];
            for (let y = 0; y < obj.height; y++) {
                const row = [];
                for (let x = 0; x < obj.width; x++) {
                    row.push(1);
                }
                obj.shape.push(row);
            }
        }
        
        // Store the base shape if not already stored
        if (!obj.baseShape) {
            obj.baseShape = JSON.parse(JSON.stringify(obj.shape));
        }
        
        // Initialize rotation if not set
        if (obj.rotation === undefined) {
            obj.rotation = 0;
        }
        
        // Ensure width and height match shape
        if (obj.shape && obj.shape.length > 0) {
            obj.height = obj.shape.length;
            obj.width = obj.shape[0].length;
        }
        
        return obj;
    }
    
    /**
     * Rotate a shape 90 degrees clockwise
     */
    rotateShapeClockwise(shape) {
        if (!shape || shape.length === 0) return shape;
        
        const oldHeight = shape.length;
        const oldWidth = shape[0].length;
        const newShape = [];
        
        // Create new shape with swapped dimensions
        for (let x = 0; x < oldWidth; x++) {
            const newRow = [];
            for (let y = oldHeight - 1; y >= 0; y--) {
                newRow.push(shape[y][x]);
            }
            newShape.push(newRow);
        }
        
        return newShape;
    }
    
    /**
     * Rotate an object 90 degrees clockwise
     */
    rotateObject(obj) {
        // Don't rotate while dragging
        if (this.state.isDragging) {
            return false;
        }
        
        // Calculate new shape
        const newShape = this.rotateShapeClockwise(obj.shape);
        const newWidth = newShape[0].length;
        const newHeight = newShape.length;
        
        // For placed objects, validate the rotation
        if (obj.isPlaced) {
            // Check if rotation would be valid
            if (!this.canRotateInPlace(obj, newShape, newWidth, newHeight)) {
                this.showFeedback("Can't rotate here - collision detected", 'error');
                return false;
            }
            
            // Clear old position from grid
            this.markGridCellsWithShape(obj, obj.gridX, obj.gridY, false);
        } else {
            // For objects in staging area, adjust position if needed to keep on screen
            const rightEdge = obj.pixelX + newWidth * this.config.cellSize;
            const bottomEdge = obj.pixelY + newHeight * this.config.cellSize;
            
            // Push object inward if it would go off screen
            if (rightEdge > this.baseWidth - 50) {
                obj.pixelX = this.baseWidth - 50 - newWidth * this.config.cellSize;
            }
            if (bottomEdge > this.baseHeight - 50) {
                obj.pixelY = this.baseHeight - 50 - newHeight * this.config.cellSize;
            }
            if (obj.pixelX < 50) {
                obj.pixelX = 50;
            }
            if (obj.pixelY < 50) {
                obj.pixelY = 50;
            }
        }
        
        // Apply rotation
        obj.shape = newShape;
        obj.width = newWidth;
        obj.height = newHeight;
        obj.rotation = (obj.rotation + 90) % 360;
        
        // For placed objects, re-mark the grid
        if (obj.isPlaced) {
            this.markGridCellsWithShape(obj, obj.gridX, obj.gridY, true);
        }
        
        // Visual feedback - brief highlight
        this.flashObject(obj);
        
        console.log(`Rotated ${obj.name} to ${obj.rotation}°`);
        return true;
    }
    
    /**
     * Check if an object can rotate in its current grid position
     */
    canRotateInPlace(obj, newShape, newWidth, newHeight) {
        const gridX = obj.gridX;
        const gridY = obj.gridY;
        
        // Check if new dimensions would fit
        if (gridX + newWidth > this.config.backpackWidth) return false;
        if (gridY + newHeight > this.config.backpackHeight) return false;
        
        // Check each cell in the new shape
        for (let y = 0; y < newShape.length; y++) {
            for (let x = 0; x < newShape[y].length; x++) {
                if (newShape[y][x] === 1) {
                    const checkY = gridY + y;
                    const checkX = gridX + x;
                    
                    // Check if this cell is blocked by the mask
                    if (this.config.gridMask && 
                        this.config.gridMask[checkY] && 
                        this.config.gridMask[checkY][checkX] === 0) {
                        return false;
                    }
                    
                    // Check if cell is occupied by another object
                    const cellValue = this.state.grid[checkY][checkX];
                    if (cellValue !== null && cellValue !== obj.id && cellValue !== 'blocked') {
                        return false;
                    }
                }
            }
        }
        
        return true;
    }
    
    /**
     * Flash an object briefly for visual feedback
     */
    flashObject(obj) {
        // Store original state
        const originalFlash = obj.isFlashing;
        
        // Start flash
        obj.isFlashing = true;
        
        // End flash after 200ms
        setTimeout(() => {
            obj.isFlashing = false;
        }, 200);
    }
    
    /**
     * Update canvas size and calculate scale
     */
    updateCanvasSize() {
        // Get the wrapper element which maintains aspect ratio
        const wrapper = this.canvas.parentElement;
        if (!wrapper || !wrapper.classList.contains('canvas-wrapper')) {
            console.warn('Canvas wrapper not found, scaling may not work properly');
            return;
        }
        
        // Get actual rendered size of the wrapper
        const wrapperRect = wrapper.getBoundingClientRect();
        const displayWidth = wrapperRect.width;
        const displayHeight = wrapperRect.height;
        
        // Calculate scale based on wrapper size vs base dimensions
        this.scale = Math.min(displayWidth / this.baseWidth, displayHeight / this.baseHeight, 1);
        
        // Canvas should fill its wrapper completely
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        
        // Set internal canvas resolution to base dimensions
        // This ensures we always render at the same resolution internally
        if (this.canvas.width !== this.baseWidth || this.canvas.height !== this.baseHeight) {
            this.canvas.width = this.baseWidth;
            this.canvas.height = this.baseHeight;
            
            // Update positions after canvas resize
            this.updatePositions();
        }
    }
    
    /**
     * Update all positions after scaling
     */
    updatePositions() {
        // Recalculate backpack and grid positions
        if (this.state.sprites['backpack']) {
            this.state.backpackNativeWidth = this.state.sprites['backpack'].width;
            this.state.backpackNativeHeight = this.state.sprites['backpack'].height;
            
            // Center the backpack image
            this.backpackX = (this.baseWidth - this.state.backpackNativeWidth) / 2;
            this.backpackY = (this.baseHeight - this.state.backpackNativeHeight) / 2 - 30;
            
            // Center the grid on the backpack with offsets
            this.gridX = this.backpackX + (this.state.backpackNativeWidth - this.gridPixelWidth) / 2 + this.config.gridXOffset;
            this.gridY = this.backpackY + (this.state.backpackNativeHeight - this.gridPixelHeight) / 2 + this.config.gridYOffset;
        } else {
            // Fallback if no backpack sprite
            this.backpackX = (this.baseWidth - this.gridPixelWidth) / 2;
            this.backpackY = (this.baseHeight - this.gridPixelHeight) / 2 - 30;
            this.gridX = this.backpackX + this.config.gridXOffset;
            this.gridY = this.backpackY + this.config.gridYOffset;
        }
        
        // Reposition staging objects if game is running
        if (this.state.isRunning) {
            this.positionStagingObjects();
        }
    }
    
    /**
     * Handle window resize events
     */
    handleResize() {
        // Debounce resize events
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => {
            this.updateCanvasSize();
            // Force a re-render
            if (this.state.isRunning) {
                this.render();
            }
        }, 100);
    }
    
    /**
     * Convert screen coordinates to game coordinates
     */
    screenToGame(screenX, screenY) {
        return {
            x: screenX / this.scale,
            y: screenY / this.scale
        };
    }
    
    /**
     * Convert game coordinates to screen coordinates
     */
    gameToScreen(gameX, gameY) {
        return {
            x: gameX * this.scale,
            y: gameY * this.scale
        };
    }
    
    /**
     * Initialize and start the game
     */
    startGame() {
        console.log('Starting Backpack Game with persistence...');
        console.log('Grid offsets - X:', this.config.gridXOffset, 'Y:', this.config.gridYOffset);
        console.log('Memory data:', this.config.memoryData);
        
        // Ensure canvas is properly set up first
        this.updateCanvasSize();
        
        // Initialize subsystems
        this.initializeSubsystems();
        
        // Load game assets
        this.loadAssets().then(() => {
            // Set up initial game state
            this.createGameState();
            
            // Apply memory data to restore previous positions
            this.applyMemoryData();
            
            // Position objects in staging area (only those without memory)
            this.positionStagingObjects();
            
            // Set up UI
            this.setupUI();
            
            // Do another size update after everything is loaded
            this.updateCanvasSize();
            
            // Start game loop
            this.state.isRunning = true;
            this.gameLoop();
            
            console.log('Game started successfully with persistence!');
        }).catch(error => {
            console.error('Failed to start game:', error);
        });
    }
    
    /**
     * Initialize all game subsystems
     */
    initializeSubsystems() {
        // These will reference the actual implementations from other files
        if (typeof GridSystem !== 'undefined') {
            this.gridSystem = new GridSystem(
                this.config.backpackWidth,
                this.config.backpackHeight,
                this.config.cellSize
            );
        }
        
        if (typeof ObjectManager !== 'undefined') {
            this.objectManager = new ObjectManager(this.config.objects);
        }
        
        if (typeof Renderer !== 'undefined') {
            this.renderer = new Renderer(this.ctx, this.config);
        }
        
        if (typeof InputHandler !== 'undefined') {
            this.inputHandler = new InputHandler(this.canvas, this);
        }
        
        if (typeof DebugConsole !== 'undefined' && window.testObjects) {
            this.debugConsole = new DebugConsole(this);
        }
    }
    
    /**
     * Load game assets (sprites, sounds, etc.)
     */
    async loadAssets() {
        // Load sprite images
        const spritePromises = [];
        
        if (this.config.sprites) {
            for (const [key, src] of Object.entries(this.config.sprites)) {
                const promise = this.loadSprite(key, src);
                spritePromises.push(promise);
            }
        }
        
        await Promise.all(spritePromises);
        console.log('All assets loaded');
        
        // Recalculate positions now that backpack sprite is loaded
        this.updatePositions();
    }
    
    /**
     * Load a single sprite
     */
    loadSprite(key, src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.state.sprites[key] = img;
                resolve();
            };
            img.onerror = () => reject(`Failed to load sprite: ${src}`);
            img.src = src;
        });
    }
    
    /**
     * Create initial game state
     */
    createGameState() {
        // Initialize grid with mask support
        this.state.grid = this.createGrid(
            this.config.backpackWidth,
            this.config.backpackHeight
        );
        
        // Initialize objects from config and normalize shapes
        this.state.objects = this.config.objects.map(objData => {
            const normalized = this.normalizeObjectShape({
                ...objData,
                id: objData.id || Math.random().toString(36).substring(2, 9),
                isPlaced: false,
                gridX: -1,
                gridY: -1,
                pixelX: 0,
                pixelY: 0,
                width: objData.width || 1,
                height: objData.height || 1,
                originalWidth: objData.originalWidth || objData.width || 1,
                originalHeight: objData.originalHeight || objData.height || 1,
                shape: objData.shape,
                baseShape: objData.baseShape,
                rotation: objData.rotation || 0,
                description: objData.description || '',
                isFlashing: false
            });
            
            return normalized;
        });
        
        // Update UI counters
        this.updateObjectCounter();
    }
    
    /**
     * Apply memory data to restore previous positions
     */
    applyMemoryData() {
        if (!this.config.memoryData || Object.keys(this.config.memoryData).length === 0) {
            console.log('No memory data to apply');
            return;
        }
        
        console.log('Applying memory data to objects...');
        
        this.state.objects.forEach(obj => {
            const memory = this.config.memoryData[obj.id];
            if (memory) {
                console.log(`Restoring position for ${obj.id}:`, memory);
                
                // Apply rotation first if needed
                if (memory.rotation && memory.rotation !== 0) {
                    // Rotate the shape to match saved rotation
                    let rotationsNeeded = memory.rotation / 90;
                    for (let i = 0; i < rotationsNeeded; i++) {
                        obj.shape = this.rotateShapeClockwise(obj.shape);
                    }
                    obj.width = obj.shape[0].length;
                    obj.height = obj.shape.length;
                    obj.rotation = memory.rotation;
                }
                
                // Apply position data
                obj.gridX = memory.gridX;
                obj.gridY = memory.gridY;
                obj.pixelX = memory.pixelX;
                obj.pixelY = memory.pixelY;
                obj.isPlaced = memory.isPlaced;
                
                // If it was placed in the grid, restore grid state with shape
                if (obj.isPlaced && obj.gridX >= 0 && obj.gridY >= 0) {
                    // Mark grid cells as occupied using shape
                    this.markGridCellsWithShape(obj, obj.gridX, obj.gridY, true);
                    
                    // Add to placed objects list
                    this.state.placedObjects.push(obj);
                    
                    // Make sure pixel position matches grid position
                    const pixelPos = this.gridToPixel(obj.gridX, obj.gridY);
                    obj.pixelX = pixelPos.x;
                    obj.pixelY = pixelPos.y;
                }
            }
        });
        
        // Update UI after applying memory
        this.updateObjectCounter();
        this.checkContinueButton();
    }
    
    /**
     * Mark or unmark grid cells based on object shape
     */
    markGridCellsWithShape(obj, gridX, gridY, mark = true) {
        for (let y = 0; y < obj.shape.length; y++) {
            for (let x = 0; x < obj.shape[y].length; x++) {
                if (obj.shape[y][x] === 1) {
                    const cellY = gridY + y;
                    const cellX = gridX + x;
                    
                    if (this.state.grid[cellY] && this.state.grid[cellY][cellX] !== undefined) {
                        if (mark) {
                            // Only mark if not blocked
                            if (this.state.grid[cellY][cellX] !== 'blocked') {
                                this.state.grid[cellY][cellX] = obj.id;
                            }
                        } else {
                            // When unmarking, check if cell should be blocked or null
                            if (this.config.gridMask && 
                                this.config.gridMask[cellY] && 
                                this.config.gridMask[cellY][cellX] === 0) {
                                this.state.grid[cellY][cellX] = 'blocked';
                            } else {
                                this.state.grid[cellY][cellX] = null;
                            }
                        }
                    }
                }
            }
        }
    }
    
    /**
     * Create empty grid with mask support
     */
    createGrid(width, height) {
        const grid = [];
        for (let y = 0; y < height; y++) {
            grid[y] = [];
            for (let x = 0; x < width; x++) {
                // Check if this cell is valid according to the mask
                if (this.config.gridMask && 
                    this.config.gridMask[y] && 
                    this.config.gridMask[y][x] === 0) {
                    grid[y][x] = 'blocked'; // Mark as blocked
                } else {
                    grid[y][x] = null; // Available for placement
                }
            }
        }
        return grid;
    }
    
    /**
     * Smart auto-positioning system for staging area objects
     * Uses 2D bin packing algorithm to arrange objects on left and right sides
     */
    positionStagingObjects() {
        // Only position objects that don't have memory positions
        const unplacedObjects = this.state.objects.filter(obj => {
            const hasMemory = this.config.memoryData && this.config.memoryData[obj.id];
            return !obj.isPlaced && !hasMemory;
        });
        
        if (unplacedObjects.length === 0) {
            console.log('All objects have memory positions, skipping staging');
            return;
        }
        
        console.log(`Smart positioning ${unplacedObjects.length} objects...`);
        
        // Define staging area boundaries
        const stagingAreas = this.calculateStagingAreas();
        
        // Split objects into two groups for left and right sides
        const { leftObjects, rightObjects } = this.splitObjectsForSides(unplacedObjects);
        
        // Position objects on each side using bin packing
        this.positionObjectsInArea(leftObjects, stagingAreas.left, 'left');
        this.positionObjectsInArea(rightObjects, stagingAreas.right, 'right');
        
        console.log('Smart positioning complete!');
    }
    
    /**
     * Calculate the available staging areas on left and right sides of backpack
     */
    calculateStagingAreas() {
        // Calculate backpack bounds
        const backpackBounds = {
            left: this.backpackX,
            right: this.backpackX + this.state.backpackNativeWidth,
            top: this.backpackY,
            bottom: this.backpackY + this.state.backpackNativeHeight
        };
        
        // Add some padding around the backpack
        const backpackPadding = 40;
        
        // Define left staging area
        const leftArea = {
            x: 50, // Canvas edge padding
            y: 100, // Top padding
            width: backpackBounds.left - backpackPadding - 50,
            height: this.baseHeight - 200 // Leave padding at top and bottom
        };
        
        // Define right staging area
        const rightArea = {
            x: backpackBounds.right + backpackPadding,
            y: 100,
            width: this.baseWidth - (backpackBounds.right + backpackPadding) - 50,
            height: this.baseHeight - 200
        };
        
        return { left: leftArea, right: rightArea };
    }
    
    /**
     * Split objects intelligently between left and right sides
     */
    splitObjectsForSides(objects) {
        // Sort objects by area (largest first for better packing)
        const sortedObjects = [...objects].sort((a, b) => {
            const areaA = a.width * a.height * this.config.cellSize * this.config.cellSize;
            const areaB = b.width * b.height * this.config.cellSize * this.config.cellSize;
            return areaB - areaA;
        });
        
        // Use alternating distribution with area balancing
        let leftArea = 0;
        let rightArea = 0;
        const leftObjects = [];
        const rightObjects = [];
        
        sortedObjects.forEach(obj => {
            const objArea = obj.width * obj.height * this.config.cellSize * this.config.cellSize;
            
            // Place on the side with less total area to balance
            if (leftArea <= rightArea) {
                leftObjects.push(obj);
                leftArea += objArea;
            } else {
                rightObjects.push(obj);
                rightArea += objArea;
            }
        });
        
        return { leftObjects, rightObjects };
    }
    
    /**
     * Position objects within a specific staging area using bin packing
     */
    positionObjectsInArea(objects, area, side) {
        if (objects.length === 0) return;
        
        // Bin packing state
        const bins = [];
        const objectPadding = 15; // Space between objects
        
        // Try to pack each object
        objects.forEach(obj => {
            const objWidth = obj.width * this.config.cellSize;
            const objHeight = obj.height * this.config.cellSize;
            
            // Find the best bin (row) for this object
            let bestBin = null;
            let bestX = 0;
            
            for (const bin of bins) {
                // Check if object fits in this bin's remaining width
                if (bin.currentX + objWidth <= area.x + area.width) {
                    if (!bestBin || bin.y < bestBin.y) {
                        bestBin = bin;
                        bestX = bin.currentX;
                    }
                }
            }
            
            // If no suitable bin found, create a new one
            if (!bestBin) {
                // Calculate Y position for new bin
                let newBinY = area.y;
                if (bins.length > 0) {
                    const lastBin = bins[bins.length - 1];
                    newBinY = lastBin.y + lastBin.maxHeight + objectPadding;
                }
                
                // Check if there's vertical space for a new bin
                if (newBinY + objHeight > area.y + area.height) {
                    // No space, try to squeeze into existing bins with overlap detection
                    this.squeezeObjectIntoArea(obj, area, objects, side);
                    return;
                }
                
                bestBin = {
                    y: newBinY,
                    currentX: area.x,
                    maxHeight: objHeight
                };
                bins.push(bestBin);
                bestX = area.x;
            }
            
            // Position the object
            obj.pixelX = bestX;
            obj.pixelY = bestBin.y;
            
            // Update bin state
            bestBin.currentX = bestX + objWidth + objectPadding;
            bestBin.maxHeight = Math.max(bestBin.maxHeight, objHeight);
            
            console.log(`Positioned ${obj.name} on ${side} at (${obj.pixelX}, ${obj.pixelY})`);
        });
    }
    
    /**
     * Fallback positioning when bin packing can't fit an object
     * Uses overlap detection to find the best available spot
     */
    squeezeObjectIntoArea(obj, area, otherObjects, side) {
        const objWidth = obj.width * this.config.cellSize;
        const objHeight = obj.height * this.config.cellSize;
        const stepSize = 20; // Grid step for searching positions
        
        // Try different positions in the area
        for (let y = area.y; y <= area.y + area.height - objHeight; y += stepSize) {
            for (let x = area.x; x <= area.x + area.width - objWidth; x += stepSize) {
                // Check if this position overlaps with any other object
                let hasOverlap = false;
                
                for (const other of otherObjects) {
                    if (other === obj) continue;
                    
                    const otherWidth = other.width * this.config.cellSize;
                    const otherHeight = other.height * this.config.cellSize;
                    
                    // Check for overlap
                    if (!(x >= other.pixelX + otherWidth ||
                          x + objWidth <= other.pixelX ||
                          y >= other.pixelY + otherHeight ||
                          y + objHeight <= other.pixelY)) {
                        hasOverlap = true;
                        break;
                    }
                }
                
                if (!hasOverlap) {
                    // Found a valid position!
                    obj.pixelX = x;
                    obj.pixelY = y;
                    console.log(`Squeezed ${obj.name} on ${side} at (${x}, ${y})`);
                    return;
                }
            }
        }
        
        // If absolutely no position found (shouldn't happen with proper areas),
        // place at area origin as last resort
        obj.pixelX = area.x;
        obj.pixelY = area.y;
        console.warn(`Warning: Could not find ideal position for ${obj.name}, placed at area origin`);
    }
    
    /**
     * Build memory snapshot of current state
     */
    buildMemorySnapshot() {
        const memory = {};
        
        this.state.objects.forEach(obj => {
            memory[obj.id] = {
                gridX: obj.gridX,
                gridY: obj.gridY,
                pixelX: obj.pixelX,
                pixelY: obj.pixelY,
                rotation: obj.rotation || 0,
                isPlaced: obj.isPlaced
            };
        });
        
        return memory;
    }
    
    /**
     * Save memory to Twine variables
     */
    saveMemoryToTwine() {
        const memory = this.buildMemorySnapshot();
        
        // Update Twine variables if available
        if (window.SugarCube && window.SugarCube.State) {
            window.SugarCube.State.variables.backpackMemory = memory;
            console.log('Saved memory to Twine:', memory);
        }
        
        return memory;
    }
    
    /**
     * Set up UI event handlers
     */
    setupUI() {
        const continueBtn = document.getElementById('continue-btn') || document.getElementById('done-btn');
        const resetBtn = document.getElementById('reset-btn');
        
        if (continueBtn) {
            continueBtn.addEventListener('click', this.handleContinue);
            continueBtn.disabled = false;
        }
        
        if (resetBtn) {
            resetBtn.addEventListener('click', this.handleReset);
        }
    }
    
    /**
     * Main game loop
     */
    gameLoop(timestamp = 0) {
        if (!this.state.isRunning) return;
        
        const deltaTime = timestamp - this.state.lastFrameTime;
        this.state.lastFrameTime = timestamp;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.baseWidth, this.baseHeight);
        
        // Update shape overlay state
        this.updateShapeOverlayState();
        
        // Render game at base resolution
        this.render();
        
        // Continue loop
        requestAnimationFrame(this.gameLoop);
    }
    
    /**
     * Update shape overlay state based on current interaction
     */
    updateShapeOverlayState() {
        if (this.state.isDragging && this.state.draggedObject) {
            // Check if current position is valid
            const obj = this.state.draggedObject;
            const snapX = obj.pixelX + this.config.cellSize / 2;
            const snapY = obj.pixelY + this.config.cellSize / 2;
            const gridPos = this.pixelToGrid(snapX, snapY);
            
            // Clamp to valid grid bounds
            const clampedX = Math.max(0, Math.min(gridPos.x, this.config.backpackWidth - obj.width));
            const clampedY = Math.max(0, Math.min(gridPos.y, this.config.backpackHeight - obj.height));
            
            if (this.isValidPlacementWithShape(clampedX, clampedY, obj)) {
                this.state.shapeOverlayState = 'valid';
            } else {
                this.state.shapeOverlayState = 'invalid';
            }
        } else if (this.state.hoveredObject) {
            this.state.shapeOverlayState = 'hover';
        } else {
            this.state.shapeOverlayState = null;
        }
    }
    
    /**
     * Main render method
     */
    render() {
        // Save context state
        this.ctx.save();
        
        // Draw everything at base resolution (1600x900)
        // The canvas CSS sizing handles the visual scaling
        
        // Draw backpack background
        this.drawBackpack();
        
        // Draw grid
        this.drawGrid();
        
        // Draw placed objects
        this.state.objects.filter(obj => obj.isPlaced).forEach(obj => {
            this.drawObject(obj);
        });
        
        // Draw unplaced objects
        this.state.objects.filter(obj => !obj.isPlaced && obj !== this.state.draggedObject).forEach(obj => {
            this.drawObject(obj);
            // Draw shape overlay for hovered objects
            if (obj === this.state.hoveredObject && this.state.shapeOverlayState === 'hover') {
                this.drawShapeOverlay(obj, 'hover');
            }
        });
        
        // Draw dragged object last (on top)
        if (this.state.draggedObject) {
            this.drawObject(this.state.draggedObject, true);
            this.drawShapeOverlay(this.state.draggedObject, this.state.shapeOverlayState || 'dragging');
            this.drawGhostObject();
        }
        
        // Draw feedback message
        this.drawFeedback();
        
        // Draw object info display
        this.drawObjectInfo();
        
        // Restore context state
        this.ctx.restore();
    }
    
    /**
     * Draw shape overlay on an object
     */
    drawShapeOverlay(obj, state) {
        const colors = {
            hover: 'rgba(255, 255, 255, 0.2)',
            dragging: 'rgba(100, 150, 255, 0.3)',
            valid: 'rgba(72, 187, 120, 0.3)',
            invalid: 'rgba(245, 101, 101, 0.3)'
        };
        
        this.ctx.fillStyle = colors[state] || colors.hover;
        
        // Draw each occupied cell in the shape
        for (let y = 0; y < obj.shape.length; y++) {
            for (let x = 0; x < obj.shape[y].length; x++) {
                if (obj.shape[y][x] === 1) {
                    const cellX = obj.pixelX + (x * this.config.cellSize);
                    const cellY = obj.pixelY + (y * this.config.cellSize);
                    
                    this.ctx.fillRect(
                        cellX,
                        cellY,
                        this.config.cellSize,
                        this.config.cellSize
                    );
                    
                    // Add a subtle border to each cell
                    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                    this.ctx.lineWidth = 1;
                    this.ctx.strokeRect(
                        cellX,
                        cellY,
                        this.config.cellSize,
                        this.config.cellSize
                    );
                }
            }
        }
    }
    
    /**
     * Draw the backpack container
     */
    drawBackpack() {
        // Check if backpack sprite is loaded
        if (this.state.sprites['backpack']) {
            // Draw backpack sprite at native size
            this.ctx.drawImage(
                this.state.sprites['backpack'],
                this.backpackX,
                this.backpackY,
                this.state.backpackNativeWidth,
                this.state.backpackNativeHeight
            );
        } else {
            // Fallback to colored rectangle based on grid size
            // Background
            this.ctx.fillStyle = this.config.backpackColor;
            this.ctx.fillRect(
                this.gridX,
                this.gridY,
                this.gridPixelWidth,
                this.gridPixelHeight
            );
            
            // Border
            this.ctx.strokeStyle = this.config.backpackBorderColor;
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(
                this.gridX,
                this.gridY,
                this.gridPixelWidth,
                this.gridPixelHeight
            );
        }
    }
    
    /**
     * Draw the grid lines for irregular grid (cleaned up)
     */
    drawGrid() {
        this.ctx.strokeStyle = '#2d3748';
        this.ctx.lineWidth = this.config.gridLineWidth;
        this.ctx.globalAlpha = 0.5;
        
        // Draw individual cell borders for valid cells only
        for (let y = 0; y < this.config.backpackHeight; y++) {
            for (let x = 0; x < this.config.backpackWidth; x++) {
                // Only draw if this cell is valid
                if (this.config.gridMask && 
                    this.config.gridMask[y] && 
                    this.config.gridMask[y][x] === 1) {
                    
                    const cellX = this.gridX + (x * this.config.cellSize);
                    const cellY = this.gridY + (y * this.config.cellSize);
                    
                    this.ctx.beginPath();
                    
                    // Draw borders intelligently
                    if (y === 0 || !this.config.gridMask[y-1] || this.config.gridMask[y-1][x] === 0) {
                        this.ctx.moveTo(cellX, cellY);
                        this.ctx.lineTo(cellX + this.config.cellSize, cellY);
                    }
                    
                    if (x === this.config.backpackWidth - 1 || 
                        !this.config.gridMask[y][x+1] || 
                        this.config.gridMask[y][x+1] === 0) {
                        this.ctx.moveTo(cellX + this.config.cellSize, cellY);
                        this.ctx.lineTo(cellX + this.config.cellSize, cellY + this.config.cellSize);
                    }
                    
                    if (y === this.config.backpackHeight - 1 || 
                        !this.config.gridMask[y+1] || 
                        this.config.gridMask[y+1][x] === 0) {
                        this.ctx.moveTo(cellX + this.config.cellSize, cellY + this.config.cellSize);
                        this.ctx.lineTo(cellX, cellY + this.config.cellSize);
                    }
                    
                    if (x === 0 || !this.config.gridMask[y][x-1] || this.config.gridMask[y][x-1] === 0) {
                        this.ctx.moveTo(cellX, cellY + this.config.cellSize);
                        this.ctx.lineTo(cellX, cellY);
                    }
                    
                    this.ctx.stroke();
                    
                    // Draw internal grid lines with lighter color
                    this.ctx.globalAlpha = 0.3;
                    this.ctx.strokeStyle = '#718096';
                    
                    // Draw right internal line if next cell is also valid
                    if (x < this.config.backpackWidth - 1 && 
                        this.config.gridMask[y][x+1] === 1) {
                        this.ctx.beginPath();
                        this.ctx.moveTo(cellX + this.config.cellSize, cellY);
                        this.ctx.lineTo(cellX + this.config.cellSize, cellY + this.config.cellSize);
                        this.ctx.stroke();
                    }
                    
                    // Draw bottom internal line if next cell is also valid
                    if (y < this.config.backpackHeight - 1 && 
                        this.config.gridMask[y+1] && 
                        this.config.gridMask[y+1][x] === 1) {
                        this.ctx.beginPath();
                        this.ctx.moveTo(cellX, cellY + this.config.cellSize);
                        this.ctx.lineTo(cellX + this.config.cellSize, cellY + this.config.cellSize);
                        this.ctx.stroke();
                    }
                    
                    this.ctx.globalAlpha = 0.5;
                    this.ctx.strokeStyle = '#2d3748';
                }
            }
        }
        
        this.ctx.globalAlpha = 1.0;
    }
    
    /**
     * Draw object information display
     */
    drawObjectInfo() {
        const objectToShow = this.state.draggedObject || this.state.hoveredObject;
        
        if (!objectToShow) return;
        
        // Position: centered below the backpack
        const infoX = this.baseWidth / 2;
        const infoY = this.gridY + this.gridPixelHeight + 60;
        
        // Draw name (large)
        this.ctx.font = 'bold 36px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'top';
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillText(objectToShow.name || objectToShow.id, infoX, infoY + 20);
        
        // Draw description (small)
        if (objectToShow.description && objectToShow.description.length > 0) {
            this.ctx.font = '24px Arial';
            this.ctx.fillStyle = '#AAAAAA';
            this.ctx.fillText(objectToShow.description, infoX, infoY + 80);
        }
    }
    
    /**
     * Draw an object
     */
    drawObject(obj, isDragging = false) {
        // Current logical dimensions (may be swapped due to rotation)
        const width = obj.width * this.config.cellSize;
        const height = obj.height * this.config.cellSize;
        
        // Original sprite dimensions (never change)
        const originalWidth = (obj.originalWidth || obj.width) * this.config.cellSize;
        const originalHeight = (obj.originalHeight || obj.height) * this.config.cellSize;
        
        if (isDragging) {
            this.ctx.globalAlpha = 0.7;
        }
        
        // Flash effect when rotating
        if (obj.isFlashing) {
            this.ctx.save();
            this.ctx.shadowBlur = 20;
            this.ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
        }
        
        // Use sprite if available, otherwise draw colored rectangle
        if (this.state.sprites[obj.sprite]) {
            // Save context for rotation
            this.ctx.save();
            
            // Calculate center of the object's current bounds
            const centerX = obj.pixelX + width / 2;
            const centerY = obj.pixelY + height / 2;
            
            // Apply rotation around center
            this.ctx.translate(centerX, centerY);
            this.ctx.rotate((obj.rotation || 0) * Math.PI / 180);
            
            // Draw sprite at its ORIGINAL dimensions, centered at origin
            this.ctx.drawImage(
                this.state.sprites[obj.sprite],
                -originalWidth / 2,
                -originalHeight / 2,
                originalWidth,
                originalHeight
            );
            
            this.ctx.restore();
        } else {
            // Placeholder rectangle (no rotation needed, shape handles it)
            this.ctx.fillStyle = obj.color || '#9f7aea';
            this.ctx.fillRect(obj.pixelX, obj.pixelY, width, height);
            
            // Border
            this.ctx.strokeStyle = '#4a5568';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(obj.pixelX, obj.pixelY, width, height);
            
            // Label (rotated with the object)
            this.ctx.save();
            const centerX = obj.pixelX + width / 2;
            const centerY = obj.pixelY + height / 2;
            this.ctx.translate(centerX, centerY);
            this.ctx.rotate((obj.rotation || 0) * Math.PI / 180);
            
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(obj.name || obj.id, 0, 0);
            
            this.ctx.restore();
        }
        
        if (obj.isFlashing) {
            this.ctx.restore();
        }
        
        if (isDragging) {
            this.ctx.globalAlpha = 1.0;
        }
    }
    
    /**
     * Draw ghost/preview of where object will be placed
     */
    drawGhostObject() {
        if (!this.state.draggedObject) return;
        
        const obj = this.state.draggedObject;
        
        // Check if object is over grid area
        const objBounds = {
            left: obj.pixelX,
            right: obj.pixelX + (obj.width * this.config.cellSize),
            top: obj.pixelY,
            bottom: obj.pixelY + (obj.height * this.config.cellSize)
        };
        
        const gridBounds = {
            left: this.gridX,
            right: this.gridX + this.gridPixelWidth,
            top: this.gridY,
            bottom: this.gridY + this.gridPixelHeight
        };
        
        // Only show ghost if overlapping grid
        const overlapsGrid = !(objBounds.right <= gridBounds.left || 
                               objBounds.left >= gridBounds.right || 
                               objBounds.bottom <= gridBounds.top || 
                               objBounds.top >= gridBounds.bottom);
        
        if (!overlapsGrid) return;
        
        // Calculate grid position using nearest grid snap point
        const snapX = obj.pixelX + this.config.cellSize / 2;
        const snapY = obj.pixelY + this.config.cellSize / 2;
        const gridPos = this.pixelToGrid(snapX, snapY);
        
        // Clamp to valid grid bounds
        const clampedX = Math.max(0, Math.min(gridPos.x, this.config.backpackWidth - obj.width));
        const clampedY = Math.max(0, Math.min(gridPos.y, this.config.backpackHeight - obj.height));
        
        const pixelPos = this.gridToPixel(clampedX, clampedY);
        
        // Draw ghost shape overlay
        const isValid = this.isValidPlacementWithShape(clampedX, clampedY, obj);
        this.ctx.fillStyle = isValid ? 'rgba(72, 187, 120, 0.3)' : 'rgba(245, 101, 101, 0.3)';
        
        // Draw each cell of the shape
        for (let y = 0; y < obj.shape.length; y++) {
            for (let x = 0; x < obj.shape[y].length; x++) {
                if (obj.shape[y][x] === 1) {
                    this.ctx.fillRect(
                        pixelPos.x + (x * this.config.cellSize),
                        pixelPos.y + (y * this.config.cellSize),
                        this.config.cellSize,
                        this.config.cellSize
                    );
                }
            }
        }
    }
    
    /**
     * Convert pixel coordinates to grid coordinates
     */
    pixelToGrid(x, y) {
        return {
            x: Math.floor((x - this.gridX) / this.config.cellSize),
            y: Math.floor((y - this.gridY) / this.config.cellSize)
        };
    }
    
    /**
     * Convert grid coordinates to pixel coordinates
     */
    gridToPixel(gridX, gridY) {
        return {
            x: this.gridX + (gridX * this.config.cellSize),
            y: this.gridY + (gridY * this.config.cellSize)
        };
    }
    
    /**
     * Check if placement is valid with shape support
     */
    isValidPlacementWithShape(gridX, gridY, obj) {
        // Check boundaries
        if (gridX < 0 || gridY < 0) return false;
        if (gridX + obj.width > this.config.backpackWidth) return false;
        if (gridY + obj.height > this.config.backpackHeight) return false;
        
        // Check each cell in the shape
        for (let y = 0; y < obj.shape.length; y++) {
            for (let x = 0; x < obj.shape[y].length; x++) {
                if (obj.shape[y][x] === 1) {
                    const checkY = gridY + y;
                    const checkX = gridX + x;
                    
                    // Check if this cell is blocked by the mask
                    if (this.config.gridMask && 
                        this.config.gridMask[checkY] && 
                        this.config.gridMask[checkY][checkX] === 0) {
                        return false;
                    }
                    
                    // Check if cell is already occupied
                    const cellValue = this.state.grid[checkY][checkX];
                    if (cellValue !== null && cellValue !== 'blocked') {
                        return false;
                    }
                    if (cellValue === 'blocked') {
                        return false;
                    }
                }
            }
        }
        
        return true;
    }
    
    /**
     * DEPRECATED: Use isValidPlacementWithShape instead
     */
    isValidPlacement(gridX, gridY, obj) {
        return this.isValidPlacementWithShape(gridX, gridY, obj);
    }
    
    /**
     * Handle object placement with shape support
     */
    handleObjectPlaced(obj, gridX, gridY) {
        // Mark grid cells as occupied using shape
        this.markGridCellsWithShape(obj, gridX, gridY, true);
        
        // Update object state
        obj.isPlaced = true;
        obj.gridX = gridX;
        obj.gridY = gridY;
        
        const pixelPos = this.gridToPixel(gridX, gridY);
        obj.pixelX = pixelPos.x;
        obj.pixelY = pixelPos.y;
        
        // Add to placed objects
        if (!this.state.placedObjects.includes(obj)) {
            this.state.placedObjects.push(obj);
        }
        
        // Update UI
        this.updateObjectCounter();
        this.checkContinueButton();
    }
    
    /**
     * Update object counter UI
     */
    updateObjectCounter() {
        const placedCount = this.state.objects.filter(obj => obj.isPlaced).length;
        const totalCount = this.state.objects.length;
        
        const placedElement = document.getElementById('placed-count');
        const totalElement = document.getElementById('total-count');
        
        if (placedElement) placedElement.textContent = placedCount;
        if (totalElement) totalElement.textContent = totalCount;
    }
    
    /**
     * Check if continue button should be enabled
     */
    checkContinueButton() {
        const continueBtn = document.getElementById('continue-btn') || document.getElementById('done-btn');
        if (continueBtn) {
            //continueBtn.disabled = this.state.placedObjects.length === 0;
            continueBtn.disabled = false;
        }
    }
    
    /**
     * Show feedback message
     */
    showFeedback(message, type = 'info') {
        this.state.feedbackMessage = message;
        this.state.feedbackType = type;
        
        if (this.state.feedbackTimeout) {
            clearTimeout(this.state.feedbackTimeout);
        }
        
        this.state.feedbackTimeout = setTimeout(() => {
            this.state.feedbackMessage = '';
        }, 2000);
    }
    
    /**
     * Draw feedback message at bottom of canvas
     */
    drawFeedback() {
        if (!this.state.feedbackMessage) return;
        
        this.ctx.font = '18px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'bottom';
        
        const textWidth = this.ctx.measureText(this.state.feedbackMessage).width;
        const padding = 12;
        const bgX = (this.baseWidth - textWidth) / 2 - padding;
        const bgY = this.baseHeight - 50;
        
        // Draw semi-transparent background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(bgX, bgY, textWidth + padding * 2, 35);
        
        // Set color based on type
        if (this.state.feedbackType === 'success') {
            this.ctx.fillStyle = '#68d391';
        } else if (this.state.feedbackType === 'error') {
            this.ctx.fillStyle = '#fc8181';
        } else {
            this.ctx.fillStyle = '#e2e8f0';
        }
        
        // Draw text
        this.ctx.fillText(
            this.state.feedbackMessage,
            this.baseWidth / 2,
            this.baseHeight - 25
        );
    }
    
    /**
     * Handle continue button click
     * MODIFIED: Save memory data when game ends
     */
    handleContinue() {
        // Save memory snapshot
        const memory = this.saveMemoryToTwine();
        
        const placedData = {};
        this.state.placedObjects.forEach(obj => {
            placedData[obj.id] = true;
        });
        
        console.log('Game completed with memory saved:', memory);
        console.log('Placed objects:', placedData);
        
        if (this.config.onComplete) {
            this.config.onComplete(placedData, memory);
        }
        
        // Send to Twine if integrated
        if (window.SugarCube && window.SugarCube.State) {
            window.SugarCube.State.variables.packedItems = placedData;
            // Memory already saved in saveMemoryToTwine()
        }
    }
    
    /**
     * Handle reset button click
     * MODIFIED: Options for soft reset (keep memory) vs hard reset
     */
    handleReset(hardReset = false) {
        if (hardReset) {
            // Clear memory completely
            if (window.SugarCube && window.SugarCube.State) {
                window.SugarCube.State.variables.backpackMemory = {};
            }
            this.config.memoryData = {};
        }
        
        // Clear grid (respecting mask)
        this.state.grid = this.createGrid(
            this.config.backpackWidth,
            this.config.backpackHeight
        );
        
        // Reset all objects but normalize shapes
        this.state.objects.forEach(obj => {
            obj.isPlaced = false;
            obj.gridX = -1;
            obj.gridY = -1;
        });
        
        // Clear placed objects
        this.state.placedObjects = [];
        
        // Reposition objects
        this.positionStagingObjects();
        
        // Update UI
        this.updateObjectCounter();
        this.checkContinueButton();
        
        // Show feedback
        this.showFeedback('Backpack cleared', 'info');
    }
    
    /**
     * Update objects (for debug console)
     */
    updateObjects(newObjects) {
        // Update the objects list and normalize shapes
        this.config.objects = newObjects.map(obj => this.normalizeObjectShape(obj));
        
        // Recreate game state with new objects
        this.createGameState();
        
        // Clear placed objects
        this.state.placedObjects = [];
        
        // Clear grid
        this.state.grid = this.createGrid(
            this.config.backpackWidth,
            this.config.backpackHeight
        );
        
        // Apply memory for objects that exist
        this.applyMemoryData();
        
        // Reposition objects without memory
        this.positionStagingObjects();
        
        // Update UI
        this.updateObjectCounter();
        this.checkContinueButton();
    }
    
    /**
     * End the game
     */
    endGame() {
        this.state.isRunning = false;
        window.removeEventListener('resize', this.handleResize);
        
        if (this.inputHandler) {
            this.inputHandler.destroy();
        }
        
        if (this.debugConsole) {
            this.debugConsole.destroy();
        }
        
        console.log('Game ended');
    }
}