/**
 * BackpackGame - Main game controller
 * Manages the overall game state and coordinates between subsystems
 */
class BackpackGame {
    constructor(canvasId, config) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        // Game configuration - merge config but ensure cellSize stays at 100
        this.config = {
            backpackWidth: 4,
            backpackHeight: 5,
            cellSize: 100, // Fixed 100px grid cells
            gridXOffset: 0, // Offset for grid positioning
            gridYOffset: 0, // Offset for grid positioning
            padding: 60,
            gridLineWidth: 1,
            gridLineColor: '#e2e8f0',
            backpackColor: '#ffffff',
            backpackBorderColor: '#4a5568',
            stagingAreaPadding: 20,
            ...config
        };

        // Ensure cellSize stays at 100px
        this.config.cellSize = 100;

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
            backpackNativeHeight: 0
        };

        // Calculate grid dimensions
        this.gridPixelWidth = this.config.backpackWidth * this.config.cellSize;
        this.gridPixelHeight = this.config.backpackHeight * this.config.cellSize;

        // These will be set after backpack sprite loads
        this.backpackX = 0;
        this.backpackY = 0;
        this.gridX = 0;
        this.gridY = 0;

        // Initialize subsystems (these will be defined in other files)
        this.gridSystem = null;
        this.objectManager = null;
        this.renderer = null;
        this.inputHandler = null;

        // Bind methods
        this.gameLoop = this.gameLoop.bind(this);
        this.handleObjectPlaced = this.handleObjectPlaced.bind(this);
        this.handleContinue = this.handleContinue.bind(this);
        this.handleReset = this.handleReset.bind(this);
    }

    /**
     * Initialize and start the game
     */
    startGame() {
        console.log('Starting Backpack Game...');

        // Set up canvas dimensions
        this.setupCanvas();

        // Initialize subsystems
        this.initializeSubsystems();

        // Load game assets
        this.loadAssets().then(() => {
            // Set up initial game state
            this.createGameState();

            // Position objects in staging area
            this.positionStagingObjects();

            // Set up UI
            this.setupUI();

            // Start game loop
            this.state.isRunning = true;
            this.gameLoop();

            console.log('Game started successfully!');
        }).catch(error => {
            console.error('Failed to start game:', error);
        });
    }

    /**
     * Set up canvas dimensions
     */
    setupCanvas() {
        // Fixed canvas size
        this.canvas.width = 1280;
        this.canvas.height = 720;

        // If backpack sprite is loaded, use its native dimensions
        if (this.state.sprites['backpack']) {
            this.state.backpackNativeWidth = this.state.sprites['backpack'].width;
            this.state.backpackNativeHeight = this.state.sprites['backpack'].height;

            // Center the backpack image
            this.backpackX = (this.canvas.width - this.state.backpackNativeWidth) / 2;
            this.backpackY = (this.canvas.height - this.state.backpackNativeHeight) / 2 - 30;

            // Center the grid on the backpack with offsets
            this.gridX = this.backpackX + (this.state.backpackNativeWidth - this.gridPixelWidth) / 2 + 14;
            this.gridY = this.backpackY + (this.state.backpackNativeHeight - this.gridPixelHeight) / 2 - 24;
        } else {
            // Fallback if no backpack sprite - center based on grid size
            this.backpackX = (this.canvas.width - this.gridPixelWidth) / 2;
            this.backpackY = (this.canvas.height - this.gridPixelHeight) / 2 - 30;
            this.gridX = this.backpackX;
            this.gridY = this.backpackY;
        }
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
        this.setupCanvas();
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
        // Initialize grid
        this.state.grid = this.createGrid(
            this.config.backpackWidth,
            this.config.backpackHeight
        );

        // Initialize objects from config
        this.state.objects = this.config.objects.map(objData => ({
            ...objData,
            id: objData.id || Math.random().toString(36).substr(2, 9),
            isPlaced: false,
            gridX: -1,
            gridY: -1,
            pixelX: 0,
            pixelY: 0,
            width: objData.width || 1,
            height: objData.height || 1
        }));

        // Update UI counters
        this.updateObjectCounter();
    }

    /**
     * Create empty grid
     */
    createGrid(width, height) {
        const grid = [];
        for (let y = 0; y < height; y++) {
            grid[y] = [];
            for (let x = 0; x < width; x++) {
                grid[y][x] = null;
            }
        }
        return grid;
    }

    /**
     * Position objects in staging area around backpack
     */
    positionStagingObjects() {
        const unplacedObjects = this.state.objects.filter(obj => !obj.isPlaced);
        const objectSpacing = 20;

        // Distribute objects around the canvas edges with more space
        let currentX = 50;
        let currentY = 80;
        let placedOnLeft = 0;
        let placedOnRight = 0;

        unplacedObjects.forEach((obj, index) => {
            // Alternate between left and right sides
            if (index % 2 === 0) {
                // Left side
                obj.pixelX = currentX;
                obj.pixelY = currentY + placedOnLeft * 130;
                placedOnLeft++;

                // Wrap to new column if needed
                if (obj.pixelY + obj.height * this.config.cellSize > this.canvas.height - 100) {
                    currentX += 150;
                    placedOnLeft = 0;
                    currentY = 80;
                }
            } else {
                // Right side
                obj.pixelX = this.canvas.width - 200 - (obj.width * this.config.cellSize);
                obj.pixelY = currentY + placedOnRight * 130;
                placedOnRight++;

                // Wrap to new column if needed
                if (obj.pixelY + obj.height * this.config.cellSize > this.canvas.height - 100) {
                    placedOnRight = 0;
                    currentY = 80;
                }
            }
        });
    }

    /**
     * Set up UI event handlers
     */
    setupUI() {
        const continueBtn = document.getElementById('continue-btn');
        const resetBtn = document.getElementById('reset-btn');

        if (continueBtn) {
            continueBtn.addEventListener('click', this.handleContinue);
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
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Render game
        this.render();

        // Continue loop
        requestAnimationFrame(this.gameLoop);
    }

    /**
     * Main render method
     */
    render() {
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
        });

        // Draw dragged object last (on top)
        if (this.state.draggedObject) {
            this.drawObject(this.state.draggedObject, true);
            this.drawGhostObject();
        }

        // Draw feedback message
        this.drawFeedback();
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
     * Draw the grid lines
     */
    drawGrid() {
        this.ctx.strokeStyle = '#2d3748'; // Darker color for better visibility
        this.ctx.lineWidth = this.config.gridLineWidth;
        this.ctx.globalAlpha = 0.5; // Semi-transparent over sprite

        // Draw border around grid area
        this.ctx.strokeRect(
            this.gridX,
            this.gridY,
            this.gridPixelWidth,
            this.gridPixelHeight
        );

        // Vertical lines
        for (let x = 1; x < this.config.backpackWidth; x++) {
            const pixelX = this.gridX + (x * this.config.cellSize);
            this.ctx.beginPath();
            this.ctx.moveTo(pixelX, this.gridY);
            this.ctx.lineTo(pixelX, this.gridY + this.gridPixelHeight);
            this.ctx.stroke();
        }

        // Horizontal lines
        for (let y = 1; y < this.config.backpackHeight; y++) {
            const pixelY = this.gridY + (y * this.config.cellSize);
            this.ctx.beginPath();
            this.ctx.moveTo(this.gridX, pixelY);
            this.ctx.lineTo(this.gridX + this.gridPixelWidth, pixelY);
            this.ctx.stroke();
        }

        this.ctx.globalAlpha = 1.0; // Reset alpha
    }

    /**
     * Draw an object
     */
    drawObject(obj, isDragging = false) {
        const width = obj.width * this.config.cellSize;
        const height = obj.height * this.config.cellSize;

        // Use sprite if available, otherwise draw colored rectangle
        if (this.state.sprites[obj.sprite]) {
            this.ctx.drawImage(
                this.state.sprites[obj.sprite],
                obj.pixelX,
                obj.pixelY,
                width,
                height
            );
        } else {
            // Placeholder rectangle
            this.ctx.fillStyle = obj.color || '#9f7aea';
            this.ctx.fillRect(obj.pixelX, obj.pixelY, width, height);

            // Border
            this.ctx.strokeStyle = '#4a5568';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(obj.pixelX, obj.pixelY, width, height);

            // Label
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(
                obj.name || obj.id,
                obj.pixelX + width / 2,
                obj.pixelY + height / 2
            );
        }

        if (isDragging) {
            this.ctx.globalAlpha = 0.7;
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
        // Add half cell size to get the nearest grid cell
        const snapX = obj.pixelX + this.config.cellSize / 2;
        const snapY = obj.pixelY + this.config.cellSize / 2;
        const gridPos = this.pixelToGrid(snapX, snapY);

        // Clamp to valid grid bounds
        const clampedX = Math.max(0, Math.min(gridPos.x, this.config.backpackWidth - obj.width));
        const clampedY = Math.max(0, Math.min(gridPos.y, this.config.backpackHeight - obj.height));

        if (this.isValidPlacement(clampedX, clampedY, obj)) {
            this.ctx.fillStyle = 'rgba(72, 187, 120, 0.3)';
        } else {
            this.ctx.fillStyle = 'rgba(245, 101, 101, 0.3)';
        }

        const pixelPos = this.gridToPixel(clampedX, clampedY);
        this.ctx.fillRect(
            pixelPos.x,
            pixelPos.y,
            obj.width * this.config.cellSize,
            obj.height * this.config.cellSize
        );
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
     * Check if placement is valid
     */
    isValidPlacement(gridX, gridY, obj) {
        // Check boundaries
        if (gridX < 0 || gridY < 0) return false;
        if (gridX + obj.width > this.config.backpackWidth) return false;
        if (gridY + obj.height > this.config.backpackHeight) return false;

        // Check for overlaps
        for (let y = 0; y < obj.height; y++) {
            for (let x = 0; x < obj.width; x++) {
                if (this.state.grid[gridY + y][gridX + x] !== null) {
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * Handle object placement
     */
    handleObjectPlaced(obj, gridX, gridY) {
        // Mark grid cells as occupied
        for (let y = 0; y < obj.height; y++) {
            for (let x = 0; x < obj.width; x++) {
                this.state.grid[gridY + y][gridX + x] = obj.id;
            }
        }

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

        // Show feedback
        this.showFeedback(`${obj.name} packed!`, 'success');
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
        const continueBtn = document.getElementById('continue-btn');
        if (continueBtn) {
            // Enable if at least one object is placed
            continueBtn.disabled = this.state.placedObjects.length === 0;
        }
    }

    /**
     * Show feedback message
     */
    showFeedback(message, type = 'info') {
        this.state.feedbackMessage = message;
        this.state.feedbackType = type;

        // Clear any existing timeout
        if (this.state.feedbackTimeout) {
            clearTimeout(this.state.feedbackTimeout);
        }

        // Set timeout to clear message
        this.state.feedbackTimeout = setTimeout(() => {
            this.state.feedbackMessage = '';
        }, 2000);
    }

    /**
     * Draw feedback message at bottom of canvas
     */
    drawFeedback() {
        if (!this.state.feedbackMessage) return;

        // Set font and measure text
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'bottom';

        // Draw background for better visibility
        const textWidth = this.ctx.measureText(this.state.feedbackMessage).width;
        const padding = 10;
        const bgX = (this.canvas.width - textWidth) / 2 - padding;
        const bgY = this.canvas.height - 45;

        // Draw semi-transparent background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(bgX, bgY, textWidth + padding * 2, 30);

        // Set color based on type
        if (this.state.feedbackType === 'success') {
            this.ctx.fillStyle = '#68d391';
        } else if (this.state.feedbackType === 'error') {
            this.ctx.fillStyle = '#fc8181';
        } else {
            this.ctx.fillStyle = '#e2e8f0';
        }

        // Draw text at bottom center
        this.ctx.fillText(
            this.state.feedbackMessage,
            this.canvas.width / 2,
            this.canvas.height - 20
        );
    }

    /**
     * Handle continue button click
     */
    handleContinue() {
        const placedData = {};
        this.state.placedObjects.forEach(obj => {
            placedData[obj.id] = true;
        });

        console.log('Game completed with placed objects:', placedData);

        if (this.config.onComplete) {
            this.config.onComplete(placedData);
        }

        // Send to Twine if integrated
        if (window.SugarCube && window.SugarCube.State) {
            window.SugarCube.State.variables.packedItems = placedData;
        }
    }

    /**
     * Handle reset button click
     */
    handleReset() {
        // Clear grid
        this.state.grid = this.createGrid(
            this.config.backpackWidth,
            this.config.backpackHeight
        );

        // Reset all objects
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
     * End the game
     */
    endGame() {
        this.state.isRunning = false;
        console.log('Game ended');
    }
}