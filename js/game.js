/**
 * BackpackGame - Main game controller
 * Manages the overall game state and coordinates between subsystems
 */
class BackpackGame {
    constructor(canvasId, config) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        // Game configuration
        this.config = {
            backpackWidth: config.backpackWidth || 5,
            backpackHeight: config.backpackHeight || 6,
            cellSize: config.cellSize || 50,
            padding: config.padding || 60,
            gridLineWidth: 1,
            gridLineColor: '#e2e8f0',
            backpackColor: '#ffffff',
            backpackBorderColor: '#4a5568',
            stagingAreaPadding: 20,
            ...config
        };

        // Game state
        this.state = {
            isRunning: false,
            isDragging: false,
            draggedObject: null,
            dragOffset: { x: 0, y: 0 },
            ghostPosition: { x: 0, y: 0 },
            objects: [],
            placedObjects: [],
            grid: null,
            sprites: {},
            lastFrameTime: 0
        };

        // Calculate dimensions
        this.backpackPixelWidth = this.config.backpackWidth * this.config.cellSize;
        this.backpackPixelHeight = this.config.backpackHeight * this.config.cellSize;
        this.backpackX = 0;
        this.backpackY = 0;

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
        // Calculate total canvas size including staging areas
        const stagingWidth = this.config.stagingAreaPadding * 2 + 100; // Extra width for objects
        const stagingHeight = this.config.stagingAreaPadding * 2;

        this.canvas.width = this.backpackPixelWidth + this.config.padding * 2 + stagingWidth;
        this.canvas.height = this.backpackPixelHeight + this.config.padding * 2 + stagingHeight;

        // Center the backpack in the canvas
        this.backpackX = (this.canvas.width - this.backpackPixelWidth) / 2;
        this.backpackY = (this.canvas.height - this.backpackPixelHeight) / 2 + 30; // Offset for header
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
        const objectSpacing = 10;

        let currentX = this.backpackX - 100;
        let currentY = this.backpackY;

        unplacedObjects.forEach((obj, index) => {
            // Simple left-side staging for now
            obj.pixelX = currentX;
            obj.pixelY = currentY;

            currentY += (obj.height * this.config.cellSize) + objectSpacing;

            // Wrap to right side if needed
            if (currentY > this.canvas.height - 100) {
                currentX = this.backpackX + this.backpackPixelWidth + 20;
                currentY = this.backpackY;
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
    }

    /**
     * Draw the backpack container
     */
    drawBackpack() {
        // Background
        this.ctx.fillStyle = this.config.backpackColor;
        this.ctx.fillRect(
            this.backpackX,
            this.backpackY,
            this.backpackPixelWidth,
            this.backpackPixelHeight
        );

        // Border
        this.ctx.strokeStyle = this.config.backpackBorderColor;
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(
            this.backpackX,
            this.backpackY,
            this.backpackPixelWidth,
            this.backpackPixelHeight
        );
    }

    /**
     * Draw the grid lines
     */
    drawGrid() {
        this.ctx.strokeStyle = this.config.gridLineColor;
        this.ctx.lineWidth = this.config.gridLineWidth;

        // Vertical lines
        for (let x = 1; x < this.config.backpackWidth; x++) {
            const pixelX = this.backpackX + (x * this.config.cellSize);
            this.ctx.beginPath();
            this.ctx.moveTo(pixelX, this.backpackY);
            this.ctx.lineTo(pixelX, this.backpackY + this.backpackPixelHeight);
            this.ctx.stroke();
        }

        // Horizontal lines
        for (let y = 1; y < this.config.backpackHeight; y++) {
            const pixelY = this.backpackY + (y * this.config.cellSize);
            this.ctx.beginPath();
            this.ctx.moveTo(this.backpackX, pixelY);
            this.ctx.lineTo(this.backpackX + this.backpackPixelWidth, pixelY);
            this.ctx.stroke();
        }
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

        // Calculate grid position
        const gridPos = this.pixelToGrid(
            this.state.ghostPosition.x,
            this.state.ghostPosition.y
        );

        if (this.isValidPlacement(gridPos.x, gridPos.y, this.state.draggedObject)) {
            this.ctx.fillStyle = 'rgba(72, 187, 120, 0.3)';
        } else {
            this.ctx.fillStyle = 'rgba(245, 101, 101, 0.3)';
        }

        const pixelPos = this.gridToPixel(gridPos.x, gridPos.y);
        this.ctx.fillRect(
            pixelPos.x,
            pixelPos.y,
            this.state.draggedObject.width * this.config.cellSize,
            this.state.draggedObject.height * this.config.cellSize
        );
    }

    /**
     * Convert pixel coordinates to grid coordinates
     */
    pixelToGrid(x, y) {
        return {
            x: Math.floor((x - this.backpackX) / this.config.cellSize),
            y: Math.floor((y - this.backpackY) / this.config.cellSize)
        };
    }

    /**
     * Convert grid coordinates to pixel coordinates
     */
    gridToPixel(gridX, gridY) {
        return {
            x: this.backpackX + (gridX * this.config.cellSize),
            y: this.backpackY + (gridY * this.config.cellSize)
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
        this.showFeedback('Item placed!', 'success');
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
    showFeedback(message, type) {
        const overlay = document.getElementById('feedback-overlay');
        if (!overlay) return;

        overlay.textContent = message;
        overlay.className = type;

        setTimeout(() => {
            overlay.className = 'hidden';
        }, 1500);
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

        this.showFeedback('Game reset!', 'success');
    }

    /**
     * End the game
     */
    endGame() {
        this.state.isRunning = false;
        console.log('Game ended');
    }
}