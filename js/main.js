/**
 * Main entry point for the Backpack Minigame
 * Handles initialization and Twine integration
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
        gridXOffset: twineVars.gridXOffset || 0,
        gridYOffset: twineVars.gridYOffset || 0,
        gridMask: twineVars.gridMask || null, // Grid mask for irregular shapes
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
        required: obj.required || false
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
 * Start the backpack game with given configuration
 */
function startBackpackGame(config) {
    // Clean up any existing game
    if (backpackGame) {
        backpackGame.endGame();
    }
    
    // Create new game instance
    backpackGame = new BackpackGame('backpack-canvas', config);
    backpackGame.startGame();
    
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
                isRunning: backpackGame.state.isRunning
            };
        }
        return null;
    }
};

/**
 * Test initialization function (for development)
 * 
 * Grid Mask Examples:
 * 
 * L-Shape:
 * [1, 1, 1, 0, 0],
 * [1, 0, 1, 0, 0],
 * [1, 0, 1, 1, 1],
 * [1, 0, 0, 0, 1],
 * [1, 1, 1, 1, 1]
 * 
 * Diamond:
 * [0, 0, 1, 0, 0],
 * [0, 1, 1, 1, 0],
 * [1, 1, 1, 1, 1],
 * [0, 1, 1, 1, 0],
 * [0, 0, 1, 0, 0]
 * 
 * Cross:
 * [0, 1, 1, 1, 0],
 * [0, 1, 1, 1, 0],
 * [1, 1, 1, 1, 1],
 * [1, 1, 1, 1, 1],
 * [0, 1, 1, 1, 0]
 */
window.initTestGame = function() {
    const config = {
        backpackWidth: 5,
        backpackHeight: 5,
        gridXOffset: 0, // Try changing these values to move the grid!
        gridYOffset: 0, // For example: gridXOffset: 50, gridYOffset: -20
        // Irregular grid shape - 0 means blocked, 1 means usable
        gridMask: [
            [0, 1, 1, 1, 1],  // Row 0: First cell blocked
            [0, 1, 1, 1, 1],  // Row 1: First cell blocked
            [0, 1, 1, 1, 1],  // Row 2: First cell blocked
            [1, 1, 1, 1, 1],  // Row 3: All cells usable
            [1, 1, 1, 1, 1]   // Row 4: All cells usable
        ],
        objects: window.testObjects || [],
        sprites: window.testSprites || {},
        onComplete: function(placedObjects) {
            console.log('Test game completed!');
            console.log('Placed objects:', placedObjects);
        }
    };
    
    return startBackpackGame(config);
};