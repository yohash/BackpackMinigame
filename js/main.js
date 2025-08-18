/**
 * Main entry point for the Backpack Minigame
 * SCALED VERSION: Updated for responsive scaling support
 */

// Global game instance
let backpackGame = null;

/**
 * Initialize the game when DOM is ready
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('Backpack Minigame: DOM Ready');
    
    // Check if we're in Twine environment
    if (window.SugarCube && window.SugarCube.State) {
        console.log('Twine environment detected');
        initTwineGame();
    } else {
        console.log('Standalone mode - use test controls to start');
        // In standalone mode, wait for manual initialization
    }
});

/**
 * Initialize game from Twine
 */
function initTwineGame() {
    // Get configuration from Twine variables
    const twineVars = window.SugarCube.State.variables;
    
    const config = {
        backpackWidth: twineVars.backpackWidth || 5,
        backpackHeight: twineVars.backpackHeight || 5,
        gridXOffset: twineVars.gridXOffset || -40,
        gridYOffset: twineVars.gridYOffset || -23,
        gridMask: twineVars.gridMask || [
            [0, 1, 1, 1, 1],
            [0, 1, 1, 1, 1],
            [0, 1, 1, 1, 1],
            [1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1]
        ],
        objects: parseTwineObjects(twineVars.objects),
        sprites: twineVars.sprites || {},
        onComplete: handleTwineComplete
    };
    
    startBackpackGame(config);
}

/**
 * Parse objects from Twine format
 */
function parseTwineObjects(twineObjects) {
    if (!twineObjects) return [];
    
    // Convert Twine object format to game format
    return twineObjects.map(obj => ({
        id: obj.id,
        name: obj.name || obj.id,
        width: obj.width || 1,
        height: obj.height || 1,
        color: obj.color || '#9f7aea',
        sprite: obj.sprite || null,
        required: obj.required || false,
        description: obj.description || ''
    }));
}

/**
 * Handle game completion for Twine
 */
function handleTwineComplete(placedObjects) {
    // Store results in Twine variables
    if (window.SugarCube && window.SugarCube.State) {
        window.SugarCube.State.variables.packedItems = placedObjects;
        
        // Check if required items were packed
        const requiredItems = window.SugarCube.State.variables.requiredItems || [];
        const allRequiredPacked = requiredItems.every(item => placedObjects[item]);
        window.SugarCube.State.variables.allRequiredPacked = allRequiredPacked;
        
        // Navigate to next passage
        window.SugarCube.Engine.play(
            window.SugarCube.State.variables.nextPassage || 'backpack_complete'
        );
    }
}

/**
 * Create wrapper div with proper aspect ratio
 */
function createCanvasWrapper(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    // Check if wrapper already exists
    if (canvas.parentElement && canvas.parentElement.classList.contains('canvas-wrapper')) {
        return;
    }
    
    // Create wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'canvas-wrapper';
    
    // Insert wrapper and move canvas into it
    canvas.parentNode.insertBefore(wrapper, canvas);
    wrapper.appendChild(canvas);
}

/**
 * Start the backpack game with given configuration
 */
function startBackpackGame(config) {
    // Clean up any existing game
    if (backpackGame) {
        backpackGame.endGame();
    }
    
    // Ensure canvas has proper wrapper for aspect ratio
    createCanvasWrapper('backpack-canvas');
    
    // Create new game instance with scaling support
    backpackGame = new BackpackGame('backpack-canvas', config);
    backpackGame.startGame();
    
    // Add loading class initially
    const container = document.getElementById('backpack-game-container');
    if (container) {
        container.classList.add('loading');
        
        // Remove loading class when game is ready
        setTimeout(() => {
            container.classList.remove('loading');
        }, 500);
    }
    
    return backpackGame;
}

/**
 * Global function for Twine to call
 */
window.BackpackMinigame = {
    start: startBackpackGame,
    
    end: function() {
        if (backpackGame) {
            backpackGame.endGame();
            backpackGame = null;
        }
    },
    
    reset: function() {
        if (backpackGame) {
            backpackGame.handleReset();
        }
    },
    
    getState: function() {
        if (backpackGame) {
            return {
                placedObjects: backpackGame.state.placedObjects,
                totalObjects: backpackGame.state.objects.length,
                isRunning: backpackGame.state.isRunning,
                scale: backpackGame.scale
            };
        }
        return null;
    },
    
    toggleFullscreen: function() {
        const container = document.getElementById('backpack-game-container');
        if (container) {
            container.classList.toggle('fullscreen');
            if (backpackGame) {
                // Trigger resize to recalculate scale
                backpackGame.handleResize();
            }
        }
    }
};

/**
 * Test initialization function (for development)
 */
window.initTestGame = function() {
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
        objects: window.testObjects || [],
        sprites: window.testSprites || {},
        onComplete: function(placedObjects) {
            console.log('Test game completed!');
            console.log('Placed objects:', placedObjects);
            console.log('Current scale:', backpackGame.scale);
        }
    };
    
    return startBackpackGame(config);
};

// Auto-initialize test game if in development mode
if (typeof window.testObjects !== 'undefined' && !window.SugarCube) {
    window.addEventListener('load', function() {
        // Auto-start the test game after a short delay
        setTimeout(window.initTestGame, 100);
    });
}