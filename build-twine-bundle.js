/**
 * FINAL BUILD SCRIPT: Bundles the polished Backpack Minigame into Twine
 * SCALED VERSION: Includes responsive scaling support
 * SHAPES VERSION: Added support for irregular object shapes
 * Run with: node build-twine-bundle.js
 */

const fs = require('fs');
const path = require('path');

// ================================
// CONFIGURATION
// ================================
const config = {
    // Input files (order matters!)
    jsFiles: [
        'js/grid.js',
        'js/objects.js',
        'js/renderer.js',
        'js/input.js',
        'js/game.js',
        'js/audio.js'
    ],
    
    cssFiles: [
        'css/game.css'
    ],

    storyFile: 'twine/JansPortal.twee',
    
    // All sprite files to embed as base64
    spriteFiles: {
        // backpack mini-game UI
        'backpack': 'assets/sprites/backpack_bg.png',
        // backpack mini-game objects
        'baseball': 'assets/sprites/baseball.png',
        'burtreyn': 'assets/sprites/burtreyn.png',
        'bong': 'assets/sprites/bong.png',
        'cash1': 'assets/sprites/cash1.png',
        'cash401': 'assets/sprites/cash401.png',
        'cellphone': 'assets/sprites/cellphone.png',
        'cheetos': 'assets/sprites/cheetos.png',
        'cups': 'assets/sprites/cups.png',
        'dice': 'assets/sprites/dice.png',
        'fabreeze': 'assets/sprites/fabreeze.png',
        'fleacollar': 'assets/sprites/fleacollar.png',
        'jestervest': 'assets/sprites/jestervest.png',
        'jesterpant': 'assets/sprites/jesterpant.png',
        'lighterern': 'assets/sprites/lighterern.png',
        'lightergrt': 'assets/sprites/lightergrt.png',
        'lighterram': 'assets/sprites/lighterram.png',
        'lollipops': 'assets/sprites/lollipops.png',
        'matchbook': 'assets/sprites/matchbook.png',
        'orcking': 'assets/sprites/orcking.png',
        'papertow': 'assets/sprites/papertow.png',
        'pointer': 'assets/sprites/pointer.png',
        'romancand': 'assets/sprites/romancand.png',
        'shield': 'assets/sprites/shield.png',
        'smokes': 'assets/sprites/smokes.png',
        'spade': 'assets/sprites/spade.png',
        'trophy': 'assets/sprites/trophy.png',
        // other png assets
        'title_screen': 'assets/sprites/title_screen.jpg',
        'frame_left': 'assets/sprites/lh_frame.jpg',
        'frame_right': 'assets/sprites/rh_frame.jpg',
    },

    // Audio files to embed as base64
    audioFiles: {
        'backpack_impacts': 'assets/audio/backpack_impacts-001.ogg',        
        'backpack_open': 'assets/audio/backpack_open-001.ogg',
        'backpack_zip_close': 'assets/audio/backpack_zip_close-001.ogg',
        'backpack_zip_open': 'assets/audio/backpack_zip_open-001.ogg',
        'fan_grab': 'assets/audio/fan_grab-001.ogg',
        'glass_clink': 'assets/audio/glass_clinking-001.ogg',
        'lighter_flick': 'assets/audio/lighter_flick-001.ogg',
        'paper_grab': 'assets/audio/paper_grab-001.ogg',
        'paper_release': 'assets/audio/paper_release-001.ogg',
        'plastic_metal_grab': 'assets/audio/plastic_metal_grab-001.ogg',
        'plastic_metal_release': 'assets/audio/plastic_metal_release-001.ogg',
        'portal': 'assets/audio/portal_reversed_cymbal.ogg',
        'rubber_ball_grab': 'assets/audio/rubber_ball_grab-001.ogg',
        'rubber_ball_release': 'assets/audio/rubber_ball_release-001.ogg',
    },
    
    // Output file
    outputFile: 'BackPackWard.twee',
    
    // Whether to minify (requires installing terser: npm install terser)
    minify: false
};

// ================================
// UPDATED ITEM DATABASE WITH SHAPE SUPPORT
// ================================
const ITEM_DATABASE = {
    'baseball': {
        id: 'baseball',
        name: 'Baseball',
        width: 1,
        height: 1,
        color: 'hsl(50, 70%, 60%)',
        sprite: 'baseball',
        description: 'You never got a hit'
    },
    'bong': {
        id: 'bong',
        name: 'Your Bong',
        width: 2,
        height: 4,
        shape: [
            [1, 0],
            [1, 0],
            [1, 1],
            [1, 0]
        ],
        color: 'hsl(20, 70%, 60%)',
        sprite: 'bong',
        description: 'The original heavy hitter'
    },
    'burtreyn': {
        id: 'burtreyn',
        name: 'Framed Portrait',
        width: 2,
        height: 2,
        color: 'hsl(70, 70%, 60%)',
        sprite: 'burtreyn',
        description: 'The other Burt Reynolds'
    },
    'cash1': {
        id: 'cash1',
        name: 'One Dollar',
        width: 1,
        height: 1,
        color: 'hsl(90, 70%, 60%)',
        sprite: 'cash1',
        description: 'Doesn\'t buy shit'
    },
    'cash401': {
        id: 'cash401',
        name: '$401',
        width: 1,
        height: 2,
        color: 'hsl(110, 70%, 60%)',
        sprite: 'cash401',
        description: 'That\'s a lot of cash'
    },
    'cellphone': {
        id: 'cellphone',
        name: 'Your Cell Phone',
        width: 1,
        height: 2,
        color: 'hsl(60, 70%, 60%)',
        sprite: 'cellphone',
        description: 'The only game it has is Snake'
    },
    'cheetos': {
        id: 'cheetos',
        name: 'Cheetos',
        width: 1,
        height: 2,
        color: 'hsl(80, 70%, 60%)',
        sprite: 'cheetos',
        description: 'Not even Flamin\' Hot'
    },
    'cheetos2': {
        id: 'cheetos2',
        name: 'Cheetos 2',
        width: 1,
        height: 2,
        color: 'hsl(85, 70%, 60%)',
        sprite: 'cheetos',
        description: 'Another bag of Cheetos.'
    },
    'cups': {
        id: 'cups',
        name: 'Smoothie Cups',
        width: 1,
        height: 3,
        color: 'hsl(100, 70%, 60%)',
        sprite: 'cups',
        description: 'Just a pile of work'
    },
    'dice': {
        id: 'dice',
        name: '6-sided Die',
        width: 1,
        height: 1,
        color: 'hsl(120, 70%, 60%)',
        sprite: 'dice',
        description: 'Supposedly lucky'
    },
    'fabreeze': {
        id: 'fabreeze',
        name: 'Fabreeze',
        width: 1,
        height: 3,
        color: 'hsl(140, 70%, 60%)',
        sprite: 'fabreeze',
        description: 'Ancient Meadow scent'
    },
    'fleacollar': {
        id: 'fleacollar',
        name: 'Flea Collar',
        width: 1,
        height: 1,
        color: 'hsl(160, 70%, 60%)',
        sprite: 'fleacollar',
        description: 'With pink rhinestones'
    },
    'jesterpant': {
        id: 'jesterpant',
        name: 'Your Jester Pants',
        width: 3,
        height: 1,
        color: 'hsl(130, 70%, 60%)',
        sprite: 'jesterpant',
        description: 'Polyester always gives you swamp crack'
    },
    'jestervest': {
        id: 'jestervest',
        name: 'Your Jester Vest',
        width: 3,
        height: 1,
        color: 'hsl(180, 70%, 60%)',
        sprite: 'jestervest',
        description: 'When you need to look your fruitiest'
    },
    'lighterern': {
        id: 'lighterern',
        name: 'Ernesto\'s Lighter',
        width: 1,
        height: 1,
        color: 'hsl(200, 70%, 60%)',
        sprite: 'lighterern',
        description: 'You ganked it from him'
    },
    'lightergrt': {
        id: 'lightergrt',
        name: 'Batwing Lighter',
        width: 1,
        height: 1,
        color: 'hsl(220, 70%, 60%)',
        sprite: 'lightergrt',
        description: 'Obviously belongs to Greta'
    },
    'lighterram': {
        id: 'lighterram',
        name: 'Rambo\'s Lighter',
        width: 1,
        height: 1,
        color: 'hsl(240, 70%, 60%)',
        sprite: 'lighterram',
        description: 'Built tough. Unlike you'
    },
    'lollipops': {
        id: 'lollipops',
        name: 'Lollipops',
        width: 1,
        height: 1,
        color: 'hsl(260, 70%, 60%)',
        sprite: 'lollipops',
        description: 'Fruit punch flavor'
    },
    'matchbook': {
        id: 'matchbook',
        name: 'Matchbook',
        width: 1,
        height: 1,
        color: 'hsl(280, 70%, 60%)',
        sprite: 'matchbook',
        description: 'Start a fire without a spark'
    },
    'orcking': {
        id: 'orcking',
        name: 'Orc King',
        width: 1,
        height: 1,
        color: 'hsl(300, 70%, 60%)',
        sprite: 'orcking',
        description: 'Gwarkcrotch the Disgustful'
    },
    'papertow': {
        id: 'papertow',
        name: 'Paper Towels',
        width: 2,
        height: 3,
        color: 'hsl(320, 70%, 60%)',
        sprite: 'papertow',
        description: 'Extra absorbent'
    },
    'pointer': {
        id: 'pointer',
        name: 'Laser Pointer',
        width: 1,
        height: 1,
        color: 'hsl(340, 70%, 60%)',
        sprite: 'pointer',
        description: 'Good for cats or presentations'
    },
    'romancand': {
        id: 'romancand',
        name: 'Roman Candle',
        width: 1,
        height: 5,
        color: 'hsl(360, 70%, 60%)',
        sprite: 'romancand',
        description: 'The Wizard Whanger'
    },
    'shield': {
        id: 'shield',
        name: 'Shield of Ernesto',
        width: 3,
        height: 5,
        color: 'hsl(30, 70%, 60%)',
        sprite: 'shield',
        description: 'You broke it in half'
    },
    'smokes': {
        id: 'smokes',
        name: 'Pack of Smokes',
        width: 1,
        height: 2,
        color: 'hsl(60, 70%, 60%)',
        sprite: 'smokes',
        description: 'Greta doesn\'t smoke lights'
    },
    'spade': {
        id: 'spade',
        name: 'Spade',
        width: 1,
        height: 3,
        color: 'hsl(150, 70%, 60%)',
        sprite: 'spade',
        description: 'For gardening gnomes'
    },
    'trophy': {
        id: 'trophy',
        name: 'Softball Trophy',
        width: 2,
        height: 3,
        color: 'hsl(170, 70%, 60%)',
        sprite: 'trophy',
        description: 'You won it sitting on the bench'
    }
};

// ================================
// BUILD FUNCTIONS
// ================================

/**
 * Convert image file to base64 data URL
 */
function imageToBase64(filepath) {
    try {
        const buffer = fs.readFileSync(filepath);
        const ext = path.extname(filepath).slice(1).toLowerCase();
        const mimeType = ext === 'jpg' ? 'jpeg' : ext;
        const base64 = buffer.toString('base64');
        return `data:image/${mimeType};base64,${base64}`;
    } catch (error) {
        console.warn(`⚠️  Could not load sprite: ${filepath}`);
        return null;
    }
}

/**
 * Convert audio file to base64 data URL
 */
function audioToBase64(filepath) {
    try {
        const buffer = fs.readFileSync(filepath);
        const ext = path.extname(filepath).slice(1).toLowerCase();
        let mimeType;
        
        // Map file extensions to MIME types
        switch (ext) {
            case 'wav':
                mimeType = 'audio/wav';
                break;
            case 'mp3':
                mimeType = 'audio/mpeg';
                break;
            case 'ogg':
                mimeType = 'audio/ogg';
                break;
            case 'webm':
                mimeType = 'audio/webm';
                break;
            default:
                mimeType = 'audio/wav'; // Default fallback
        }
        
        const base64 = buffer.toString('base64');
        return `data:${mimeType};base64,${base64}`;
    } catch (error) {
        console.warn(`⚠️  Could not load audio: ${filepath}`);
        return null;
    }
}

/**
 * Main build function
 */
async function build() {
    console.log('🔨 Building Twine Bundle...\n');
    
    // ================================
    // 1. COMBINE JAVASCRIPT
    // ================================
    console.log('📦 Combining JavaScript files...');
    let jsContent = '';
    
    // Add shape utility functions at the beginning
    jsContent += `
    // ================================
    // SHAPE UTILITIES
    // ================================
    
    /**
     * Generate a rectangular shape grid from width and height
     */
    function generateRectangularShape(width, height) {
        const shape = [];
        for (let y = 0; y < height; y++) {
            const row = [];
            for (let x = 0; x < width; x++) {
                row.push(1);
            }
            shape.push(row);
        }
        return shape;
    }
    
    /**
     * Rotate a shape 90 degrees clockwise
     */
    function rotateShapeClockwise(shape) {
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
     * Normalize an object to ensure it has a shape property
     */
    function normalizeObjectShape(obj) {
        // Store original dimensions if not already stored
        if (obj.originalWidth === undefined) {
            obj.originalWidth = obj.width;
            obj.originalHeight = obj.height;
        }
        
        if (!obj.shape) {
            // Generate shape from width and height
            obj.shape = generateRectangularShape(obj.width, obj.height);
        }
        
        // Store the base shape if not already stored
        if (!obj.baseShape) {
            obj.baseShape = JSON.parse(JSON.stringify(obj.shape));
        }
        
        // Initialize rotation if not set
        if (obj.rotation === undefined) {
            obj.rotation = 0;
        }
        
        // Ensure width and height match shape dimensions
        if (obj.shape && obj.shape.length > 0) {
            obj.height = obj.shape.length;
            obj.width = obj.shape[0].length;
        }
        
        return obj;
    }
    `;
    
    for (const file of config.jsFiles) {
        if (fs.existsSync(file)) {
            const content = fs.readFileSync(file, 'utf8');
            jsContent += `\n// ===== ${file} =====\n${content}\n`;
            console.log(`   ✓ ${file}`);
        } else {
            console.warn(`   ✗ ${file} not found`);
        }
    }
    
    // ================================
    // 2. COMBINE CSS
    // ================================
    console.log('\n🎨 Combining CSS files...');
    let cssContent = '';
    
    for (const file of config.cssFiles) {
        if (fs.existsSync(file)) {
            const content = fs.readFileSync(file, 'utf8');
            const escaped = content.replace(/`/g, '\\`');
            cssContent += `\n/* ===== ${file} ===== */\n${escaped}\n`;
            console.log(`   ✓ ${file}`);
        } else {
            console.warn(`   ✗ ${file} not found`);
        }
    }
    
    // ================================
    // 3. CONVERT SPRITES TO BASE64
    // ================================
    console.log('\n🖼️  Converting sprites to base64...');
    const sprites = {};
    let totalSpriteSize = 0;
    
    for (const [key, filepath] of Object.entries(config.spriteFiles)) {
        const dataUrl = imageToBase64(filepath);
        if (dataUrl) {
            sprites[key] = dataUrl;
            const sizeKB = (dataUrl.length / 1024).toFixed(1);
            totalSpriteSize += dataUrl.length;
            console.log(`   ✓ ${key} (${sizeKB} KB)`);
        } else {
            console.log(`   ✗ ${key} - file not found`);
        }
    }
    
    console.log(`\n📊 Total sprite size: ${(totalSpriteSize / 1024).toFixed(1)} KB`);
    
    // ================================
    // 4. CONVERT AUDIO TO BASE64
    // ================================
    console.log('\n🔊 Converting audio files to base64...');
    const audioFiles = {};
    let totalAudioSize = 0;
    
    for (const [key, filepath] of Object.entries(config.audioFiles)) {
        const dataUrl = audioToBase64(filepath);
        if (dataUrl) {
            audioFiles[key] = dataUrl;
            const sizeKB = (dataUrl.length / 1024).toFixed(1);
            totalAudioSize += dataUrl.length;
            console.log(`   ✓ ${key} (${sizeKB} KB)`);
        } else {
            console.log(`   ✗ ${key} - file not found`);
        }
    }
    
    console.log(`\n📊 Total audio size: ${(totalAudioSize / 1024).toFixed(1)} KB`);
    
    // ================================
    // 5. BUILD TWEE CONTENT
    // ================================
    console.log('\n📝 Building Twee content...');
    
    // Read story file
    let storyContent = '';
    if (fs.existsSync(config.storyFile)) {
        storyContent = fs.readFileSync(config.storyFile, 'utf8');
        console.log(`   ✓ ${config.storyFile}`);
    } else {
        console.warn(`   ✗ ${config.storyFile} not found`);
    }
    
    // ================================
    // 5. CREATE TWEE FILE
    // ================================
    console.log('\n📚 Importing story...');
    let story = '';

    if (fs.existsSync(config.storyFile)) {
        story += fs.readFileSync(config.storyFile, 'utf8');
        console.log(`   ✓ ${config.storyFile}`);
    } else {
        console.warn(`   ✗ ${config.storyFile} not found`);
    }

    console.log('\n📝 Creating Twine passages...');
    
    const tweeContent = `
${story}

:: BackpackGameStyles [stylesheet]
/* Embedded game styles with responsive scaling */
${cssContent}

:: BackpackGameScript [script]
/* Backpack Minigame with Responsive Scaling Support */
(function() {
    'use strict';
    
    // ================================
    // EMBEDDED SPRITES
    // ================================
    window.BACKPACK_SPRITES = ${JSON.stringify(sprites, null, 2)};
    
    // ================================
    // EMBEDDED AUDIO (Base64)
    // ================================
    window.BACKPACK_AUDIO = ${JSON.stringify(audioFiles, null, 2)};
    
    // ================================
    // ITEM DATABASE
    // ================================
    window.BACKPACK_ITEMS = ${JSON.stringify(ITEM_DATABASE, null, 2)};
    
    // ================================
    // GAME CODE
    // ================================
    ${jsContent}
    
    // ================================
    // HELPER FUNCTIONS FOR SCALING
    // ================================
    
    /**
     * Create wrapper div with proper aspect ratio
     */
    function createCanvasWrapper(canvasId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return false;
        
        // Check if wrapper already exists
        if (canvas.parentElement && canvas.parentElement.classList.contains('canvas-wrapper')) {
            return true;
        }
        
        // Create wrapper
        const wrapper = document.createElement('div');
        wrapper.className = 'canvas-wrapper';
        
        // Insert wrapper and move canvas into it
        canvas.parentNode.insertBefore(wrapper, canvas);
        wrapper.appendChild(canvas);
        
        // Ensure canvas is positioned to fill wrapper
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        
        return true;
    }
    
    /**
     * Ensure container has proper structure for responsive display
     */
    function prepareGameContainer() {
        const container = document.getElementById('backpack-game-container');
        if (!container) {
            console.error('Backpack game container not found!');
            return false;
        }
        
        // Add loading class
        container.classList.add('loading');
        
        // Ensure canvas has wrapper
        if (!createCanvasWrapper('backpack-canvas')) {
            console.error('Failed to create canvas wrapper');
            return false;
        }
        
        return true;
    }

    // ================================
    // TWINE INTEGRATION WITH AUDIO SUPPORT
    // ================================
    window.BackpackMinigame = {
        currentGame: null,
        
        /**
         * Start game with item IDs from Twine variables
         * @param {string[]} itemIds - Array of item ID strings
         * @param {Object} memoryData - Optional memory data for persistence
         * @returns {BackpackGame} Game instance
         */
        start: function(itemIds, memoryData) {
            console.log('Starting Backpack Minigame...');
            console.log('Items:', itemIds);
            console.log('Memory data:', memoryData);
            
            // Initialize audio system
            if (!window.AudioManager.audioContext) {
                window.AudioManager.init();
            }
            
            // Prepare container for responsive display
            if (!prepareGameContainer()) {
                console.error('Failed to prepare game container');
                return null;
            }
            
            // Convert item IDs to full objects with descriptions and shapes
            const objects = [];
            for (const id of itemIds) {
                if (window.BACKPACK_ITEMS[id]) {
                    const itemData = window.BACKPACK_ITEMS[id];
                    // Normalize shape data
                    const normalizedItem = normalizeObjectShape({
                        id: itemData.id,
                        name: itemData.name,
                        width: itemData.width,
                        height: itemData.height,
                        originalWidth: itemData.width,  // Store original dimensions
                        originalHeight: itemData.height, // Store original dimensions
                        shape: itemData.shape,
                        color: itemData.color,
                        sprite: itemData.sprite,
                        description: itemData.description || ''
                    });
                    objects.push(normalizedItem);
                } else {
                    console.warn('Unknown item ID:', id);
                }
            }
            
            // Build config with memory support and audio callbacks
            const config = {
                backpackWidth: 5,
                backpackHeight: 5,
                gridXOffset: -40,
                gridYOffset: -23,
                gridMask: [
                    [0, 1, 1, 1, 1],
                    [0, 1, 1, 1, 1],
                    [0, 1, 1, 1, 1],
                    [1, 1, 1, 1, 1],
                    [1, 1, 1, 1, 1]
                ],
                objects: objects,
                sprites: window.BACKPACK_SPRITES,
                memoryData: memoryData || {}, // Add memory data to config
                onComplete: function(placedObjects, memory) {
                    // Play success sound
                    window.AudioManager.play('backpack_zip_close');
                    
                    // Store results in Twine variables
                    State.variables.packedItems = Object.keys(placedObjects);
                    State.variables.packedCount = Object.keys(placedObjects).length;
                    State.variables.backpackMemory = memory; // Store memory data
                    
                    // Navigate to next passage
                    const nextPassage = 'BackpackComplete';
                    Engine.play(nextPassage);
                }
            };
            
            // Clean up previous game if exists
            if (this.currentGame) {
                this.currentGame.endGame();
                this.currentGame = null;
            }
            
            // Create game with scaling and persistence support
            this.currentGame = new BackpackGame('backpack-canvas', config);
            
            // Add audio event handlers to the game
            this.addAudioEventHandlers(this.currentGame);
            
            this.currentGame.startGame();
            
            // Play opening sound
            setTimeout(() => {
                window.AudioManager.play('backpack_zip_open');
            }, 500);
            
            // Remove loading class after short delay
            setTimeout(function() {
                const container = document.getElementById('backpack-game-container');
                if (container) {
                    container.classList.remove('loading');
                }
            }, 500);
            
            return this.currentGame;
        },
        
        /**
         * Add audio event handlers to game instance
         */
        addAudioEventHandlers: function(game) {            
            // For pickup, we need to hook into the InputHandler since that's where pickup happens
            // We'll add this when the game creates its input handler
            const originalInitializeSubsystems = game.initializeSubsystems;
            game.initializeSubsystems = function() {
                const result = originalInitializeSubsystems.call(this);
                
                // Now hook into the input handler's pickup method
                if (this.inputHandler && this.inputHandler.pickUpPlacedObject) {
                    const originalPickUp = this.inputHandler.pickUpPlacedObject;
                    this.inputHandler.pickUpPlacedObject = function(obj) {
                        const result = originalPickUp.call(this, obj);
                        window.AudioManager.play('plastic_metal_grab', 0.6);
                        return result;
                    };
                }

                // Next hook into the input handler's endDrag method
                if (this.inputHandler && this.inputHandler.endDrag) {
                    const originalEndDrag = this.inputHandler.endDrag;
                    this.inputHandler.endDrag = function(obj) {
                        const result = originalEndDrag.call(this, obj);
                        if (result) {
                            window.AudioManager.play('backpack_impacts', 0.8);
                        } else {
                            window.AudioManager.play('plastic_metal_release');
                        }
                        return result;
                    };
                }

                // Next hook into the input handler's startDrag method
                if (this.inputHandler && this.inputHandler.startDrag) {
                    const originalStartDrag = this.inputHandler.startDrag;
                    this.inputHandler.startDrag = function(obj, position) {
                        const result = originalStartDrag.call(this, obj, position);
                        window.AudioManager.play('plastic_metal_grab', 0.6);
                        return result;
                    };
                }

                return result;
            };
        },

        /**
         * Stop current game
         */
        stop: function() {
            if (this.currentGame) {
                this.currentGame.endGame();
                this.currentGame = null;
            }
        },
        
        /**
         * Reset current game
         * @param {boolean} hardReset - If true, clears memory too
         */
        reset: function(hardReset) {
            if (this.currentGame) {
                this.currentGame.handleReset(hardReset);
            }
        },
        
        /**
         * Get current game state
         */
        getState: function() {
            if (this.currentGame) {
                return {
                    placedObjects: this.currentGame.state.placedObjects,
                    totalObjects: this.currentGame.state.objects.length,
                    isRunning: this.currentGame.state.isRunning,
                    scale: this.currentGame.scale,
                    memory: this.currentGame.buildMemorySnapshot()
                };
            }
            return null;
        },
        
        /**
         * Toggle fullscreen mode
         */
        toggleFullscreen: function() {
            const container = document.getElementById('backpack-game-container');
            if (container) {
                container.classList.toggle('fullscreen');
                if (this.currentGame) {
                    // Trigger resize to recalculate scale
                    this.currentGame.handleResize();
                }
            }
        }
    };
    
    // Listen for passage changes to clean up games
    $(document).on(':passageend', function() {
        // If we're leaving a passage with the game, clean it up
        if (window.BackpackMinigame.currentGame && 
            !document.getElementById('backpack-canvas')) {
            window.BackpackMinigame.stop();
        }
    });
    
    // Initialize audio on first user interaction
    $(document).ready(function() {
        // Enable audio on first user interaction
        if (!window.AudioManager.audioContext) {
            window.AudioManager.init();
        }
    });
})();
`;
    
    // ================================
    // 6. WRITE FILE
    // ================================
    fs.writeFileSync(config.outputFile, tweeContent);
    
    const stats = fs.statSync(config.outputFile);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    const totalAssetSize = (totalSpriteSize + totalAudioSize) / 1024;
    
    console.log('\n✅ Build complete!');
    console.log(`📄 Output: ${config.outputFile} (${sizeMB} MB)`);
    console.log(`🎵 Total asset size: ${totalAssetSize.toFixed(1)} KB`);
    console.log('\n📋 Next steps:');
    console.log('1. Open Twine 2');
    console.log('2. Click "Import From File"');
    console.log('3. Select BackPackWard.twee');
}

// ================================
// RUN BUILD
// ================================
build().catch(error => {
    console.error('❌ Build failed:', error);
    process.exit(1);
});