/**
 * FINAL BUILD SCRIPT: Bundles the polished Backpack Minigame into Twine
 * Run with: node build-twine-bundle.js
 * 
 * IMPORTANT: Replace js/game.js and js/input.js with the polished versions first!
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
        'js/input.js',   // Use the polished version with hover tracking
        'js/game.js'      // Use the polished version with UI updates
    ],
    
    cssFiles: [
        'css/game.css'
    ],

    storyFile: 'twine/JansPortal.twee',
//    storyFile: 'test/sample-scene.twee',
    
    // All sprite files to embed as base64
    spriteFiles: {
        'backpack': 'assets/sprites/backpack_bg.png',
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
        'shield': 'assets/sprites/sheild.png',
        'smokes': 'assets/sprites/smokes.png',
        'spade': 'assets/sprites/spade.png',
        'trophy': 'assets/sprites/trophy.png',
    },
    
    // Output file
    outputFile: 'backpack-bundle.twee',
    
    // Whether to minify (requires installing terser: npm install terser)
    minify: false
};

// ================================
// UPDATED ITEM DATABASE FROM test-data.js
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
        name: 'Bong',
        width: 2,
        height: 4,
        color: 'hsl(20, 70%, 60%)',
        sprite: 'bong',
        description: 'Purple haze, man'
    },
    'burtreyn': {
        id: 'burtreynolds',
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
        name: 'Cell Phone',
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
        description: 'Not even Flamin Hot'
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
        name: 'Jester Pants',
        width: 3,
        height: 1,
        color: 'hsl(130, 70%, 60%)',
        sprite: 'jesterpant',
        description: 'Polyester always gives you swamp crack'
    },
    'jestervest': {
        id: 'jestervest',
        name: 'Jester Vest',
        width: 3,
        height: 1,
        color: 'hsl(180, 70%, 60%)',
        sprite: 'jestervest',
        description: 'When you need to look your fruitiest'
    },
    'lighterern': {
        id: 'lighterern',
        name: 'Lighter',
        width: 1,
        height: 1,
        color: 'hsl(200, 70%, 60%)',
        sprite: 'lighterern',
        description: 'You ganked it from Ernesto'
    },
    'lightergrt': {
        id: 'lightergrt',
        name: 'Lighter',
        width: 1,
        height: 1,
        color: 'hsl(220, 70%, 60%)',
        sprite: 'lightergrt',
        description: 'Obviously belongs to Greta'
    },
    'lighterram': {
        id: 'lighterram',
        name: 'Lighter',
        width: 1,
        height: 1,
        color: 'hsl(240, 70%, 60%)',
        sprite: 'lighterram',
        description: 'This one is from Rambo'
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
        id: 'papertowels',
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
        id: 'romancandel',
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
        name: 'Cigarettes',
        width: 1,
        height: 2,
        color: 'hsl(60, 70%, 60%)',
        sprite: 'smokes',
        description: 'Pack of smokes belonging to Greta.'
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
 * Main build function
 */
async function build() {
    console.log('🔨 Building Twine Bundle...\n');
    
    // ================================
    // 1. COMBINE JAVASCRIPT
    // ================================
    console.log('📦 Combining JavaScript files...');
    let jsContent = '';
    
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
    // 4. CREATE TWEE FILE
    // ================================
    console.log('\n  Importing story...');
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
/* Embedded game styles */
${cssContent}

:: BackpackGameScript [script]
/* Fixed Backpack Minigame with Scaling Support */
(function() {
    'use strict';
    
    // ================================
    // EMBEDDED SPRITES
    // ================================
    window.BACKPACK_SPRITES = ${JSON.stringify(sprites, null, 2)};
    
    // ================================
    // ITEM DATABASE
    // ================================
    window.BACKPACK_ITEMS = ${JSON.stringify(ITEM_DATABASE, null, 2)};
    
    // ================================
    // GAME CODE
    // ================================
    ${jsContent}
    
    // ================================
    // TWINE INTEGRATION
    // ================================
    window.BackpackMinigame = {
        currentGame: null,
        
        /**
         * Start game with item IDs from Twine variables
         * @param {string[]} itemIds - Array of item ID strings
         * @returns {BackpackGame} Game instance
         */
        start: function(itemIds) {
            console.log('Starting Backpack Minigame with items:', itemIds);
            
            // Convert item IDs to full objects with descriptions
            const objects = [];
            for (const id of itemIds) {
                if (window.BACKPACK_ITEMS[id]) {
                    // Make sure to include ALL properties including description
                    const itemData = window.BACKPACK_ITEMS[id];
                    objects.push({
                        id: itemData.id,
                        name: itemData.name,
                        width: itemData.width,
                        height: itemData.height,
                        color: itemData.color,
                        sprite: itemData.sprite,
                        description: itemData.description || ''  // Ensure description is included
                    });
                } else {
                    console.warn('Unknown item ID:', id);
                }
            }
            
            // Build config
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
                onComplete: function(placedObjects) {
                    // Store results in Twine variables
                    State.variables.packedItems = Object.keys(placedObjects);
                    State.variables.packedCount = Object.keys(placedObjects).length;
                    
                    // Navigate to next passage
                    const nextPassage = /*State.variables.nextPassage ||*/ 'BackpackComplete';
                    Engine.play(nextPassage);
                }
            };
            
            // Create game
            this.currentGame = new BackpackGame('backpack-canvas', config);
            this.currentGame.startGame();
            
            // Set canvas to scale properly
            const canvas = document.getElementById('backpack-canvas');
            if (canvas) {
                canvas.style.width = '100%';
                canvas.style.height = 'auto';
                canvas.style.maxWidth = '1600px';
                canvas.style.display = 'block';
                canvas.style.margin = '0 auto';
            }
            
            return this.currentGame;
        },
        
        /**
         * Stop current game
         */
        stop: function() {
            if (this.currentGame) {
                this.currentGame.endGame();
                this.currentGame = null;
            }
        }
    };
})();
`;
    
    // ================================
    // 5. WRITE FILE
    // ================================
    fs.writeFileSync(config.outputFile, tweeContent);
    
    const stats = fs.statSync(config.outputFile);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    console.log('\n✅ Build complete!');
    console.log(`📄 Output: ${config.outputFile} (${sizeMB} MB)`);
    console.log('\n📋 Next steps:');
    console.log('1. Open Twine 2');
    console.log('2. Click "Import From File"');
    console.log('3. Select backpack-bundle.twee');
    console.log('4. Your game is ready!\n');
}

// ================================
// RUN BUILD
// ================================
build().catch(error => {
    console.error('❌ Build failed:', error);
    process.exit(1);
});