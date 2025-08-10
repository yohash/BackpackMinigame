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
    
    // All sprite files to embed as base64
    spriteFiles: {
        'backpack': 'assets/sprites/backpack_bg.png',
        'bong': 'assets/sprites/bong.png',
        'cash': 'assets/sprites/cash401.png',
        'cellphone': 'assets/sprites/cellphone.png',
        'cheetos': 'assets/sprites/cheetos.png',
        'cups': 'assets/sprites/cups.png',
        'dice': 'assets/sprites/dice.png',
        'fabreeze': 'assets/sprites/fabreeze.png',
        'fleacollar': 'assets/sprites/fleacollar.png',
        'jestervest': 'assets/sprites/jestervest.png',
        'lighterern': 'assets/sprites/lighterern.png',
        'lightergrt': 'assets/sprites/lightergrt.png',
        'lighterram': 'assets/sprites/lighterram.png',
        'lollipops': 'assets/sprites/lollipops.png',
        'matchbook': 'assets/sprites/matchbook.png',
        'orcking': 'assets/sprites/orcking.png',
        'papertowels': 'assets/sprites/papertow.png',
        'pointer': 'assets/sprites/pointer.png',
        'romancandel': 'assets/sprites/romancand.png',
        'shield': 'assets/sprites/sheild.png',
        'smokes': 'assets/sprites/smokes.png'
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
    'bong': {
        id: 'bong',
        name: 'Bong',
        width: 2,
        height: 4,
        color: 'hsl(20, 70%, 60%)',
        sprite: 'bong',
        description: 'A glass bong.'
    },
    'cash': {
        id: 'cash',
        name: 'Cash',
        width: 1,
        height: 2,
        color: 'hsl(40, 70%, 60%)',
        sprite: 'cash',
        description: 'A stack of cash.'
    },
    'cellphone': {
        id: 'cellphone',
        name: 'Cellphone',
        width: 1,
        height: 2,
        color: 'hsl(60, 70%, 60%)',
        sprite: 'cellphone',
        description: 'A modern cellphone.'
    },
    'cheetos': {
        id: 'cheetos',
        name: 'Cheetos',
        width: 1,
        height: 2,
        color: 'hsl(80, 70%, 60%)',
        sprite: 'cheetos',
        description: 'A bag of Cheetos snacks.'
    },
    'cups': {
        id: 'cups',
        name: 'Cups',
        width: 1,
        height: 3,
        color: 'hsl(100, 70%, 60%)',
        sprite: 'cups',
        description: 'A stack of plastic cups.'
    },
    'dice': {
        id: 'dice',
        name: 'Dice',
        width: 1,
        height: 1,
        color: 'hsl(120, 70%, 60%)',
        sprite: 'dice',
        description: 'A pair of dice.'
    },
    'fabreeze': {
        id: 'fabreeze',
        name: 'Fabreeze',
        width: 1,
        height: 3,
        color: 'hsl(140, 70%, 60%)',
        sprite: 'fabreeze',
        description: 'A can of Fabreeze air freshener.'
    },
    'fleacollar': {
        id: 'fleacollar',
        name: 'Fleacollar',
        width: 1,
        height: 1,
        color: 'hsl(160, 70%, 60%)',
        sprite: 'fleacollar',
        description: 'A flea collar for pets.'
    },
    'jestervest': {
        id: 'jestervest',
        name: 'Jestervest',
        width: 3,
        height: 1,
        color: 'hsl(180, 70%, 60%)',
        sprite: 'jestervest',
        description: 'A colorful jester vest.'
    },
    'lighterern': {
        id: 'lighterern',
        name: 'Lighterern',
        width: 1,
        height: 1,
        color: 'hsl(200, 70%, 60%)',
        sprite: 'lighterern',
        description: 'A lighter (ern style).'
    },
    'lightergrt': {
        id: 'lightergrt',
        name: 'Lightergrt',
        width: 1,
        height: 1,
        color: 'hsl(220, 70%, 60%)',
        sprite: 'lightergrt',
        description: 'A lighter (grt style).'
    },
    'lighterram': {
        id: 'lighterram',
        name: 'Lighterram',
        width: 1,
        height: 1,
        color: 'hsl(240, 70%, 60%)',
        sprite: 'lighterram',
        description: 'A lighter (ram style).'
    },
    'lollipops': {
        id: 'lollipops',
        name: 'Lollipops',
        width: 1,
        height: 1,
        color: 'hsl(260, 70%, 60%)',
        sprite: 'lollipops',
        description: 'A handful of lollipops.'
    },
    'matchbook': {
        id: 'matchbook',
        name: 'Matchbook',
        width: 1,
        height: 1,
        color: 'hsl(280, 70%, 60%)',
        sprite: 'matchbook',
        description: 'A small matchbook.'
    },
    'orcking': {
        id: 'orcking',
        name: 'Orcking',
        width: 1,
        height: 1,
        color: 'hsl(300, 70%, 60%)',
        sprite: 'orcking',
        description: 'A mysterious orc king figurine.'
    },
    'papertowels': {
        id: 'papertowels',
        name: 'Papertowels',
        width: 2,
        height: 3,
        color: 'hsl(320, 70%, 60%)',
        sprite: 'papertowels',
        description: 'A roll of paper towels.'
    },
    'pointer': {
        id: 'pointer',
        name: 'Pointer',
        width: 1,
        height: 1,
        color: 'hsl(340, 70%, 60%)',
        sprite: 'pointer',
        description: 'A laser pointer.'
    },
    'romancandel': {
        id: 'romancandel',
        name: 'Romancandel',
        width: 1,
        height: 5,
        color: 'hsl(360, 70%, 60%)',
        sprite: 'romancandel',
        description: 'A roman candle firework.'
    },
    'shield': {
        id: 'shield',
        name: 'Shield',
        width: 3,
        height: 5,
        color: 'hsl(30, 70%, 60%)',
        sprite: 'shield',
        description: 'A small shield.'
    },
    'smokes': {
        id: 'smokes',
        name: 'Smokes',
        width: 1,
        height: 2,
        color: 'hsl(60, 70%, 60%)',
        sprite: 'smokes',
        description: 'A pack of cigarettes.'
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
    console.log('🔨 Building Polished Twine Bundle...\n');
    
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
    console.log('\n📝 Creating Twine passages...');
    
    const tweeContent = `:: StoryTitle
Backpack Party Adventure

:: StoryData
{
    "ifid": "BACKPACK-GAME-2024",
    "format": "SugarCube",
    "format-version": "2.36.1"
}

:: BackpackGameStyles [stylesheet]
/* Embedded game styles */
${cssContent}

/* Additional Twine-specific styles */
.passage {
    max-width: none !important;
    margin: 0 !important;
    padding: 0 !important;
}

#backpack-game-container {
    position: relative;
    width: 100vw;
    height: 100vh;
    left: 50%;
    right: 50%;
    margin-left: -50vw;
    margin-right: -50vw;
}

#ui-header {
    display: none !important;
}

#ui-bar {
    display: none !important;
}

.passage .backpack-active {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* FIXED: Ensure buttons are visible and properly positioned */
#backpack-game-container #reset-btn {
    position: fixed !important;
    top: 20px !important;
    left: 20px !important;
    z-index: 1000 !important;
    display: block !important;
    visibility: visible !important;
}

#backpack-game-container #done-btn {
    position: fixed !important;
    top: 20px !important;
    right: 20px !important;
    z-index: 1000 !important;
    display: block !important;
    visibility: visible !important;
}

/* Ensure canvas scales properly */
#backpack-canvas {
    max-width: 100%;
    height: auto;
}

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
                    
                    // Hide game and navigate
                    document.getElementById('backpack-game-container').style.display = 'none';
                    
                    // Re-enable Twine UI
                    document.getElementById('ui-bar').style.display = '';
                    document.querySelector('.passage').classList.remove('backpack-active');
                    
                    // Navigate to next passage
                    const nextPassage = State.variables.nextPassage || 'BackpackComplete';
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

:: Start
# The Party Invitation

Your phone buzzes with a text from Jake:

"Party at my place in 30 mins! Don't forget to bring... you know 😉"

You look around your messy room. Time to pack your backpack!

[[Check what you have->Inventory]]

:: Inventory
# Your Room

You scan your room and take inventory:

<<set $foundItems to ["cellphone", "cash", "cheetos", "cups", "bong", "fabreeze", "dice", "lighterern", "lollipops"]>>

* Your cellphone (obviously)
* Some cash from your wallet
* A bag of Cheetos
* Stack of red solo cups
* Your "special" glassware (hidden in the closet)
* Fabreeze (essential)
* Some dice from game night
* A lighter
* Lollipops from yesterday

You can't take everything - choose wisely!

[[Pack your backpack->PackBackpack]]

:: PackBackpack
<<set $availableItems to $foundItems>>
<<set $nextPassage to "LeaveForParty">>

<div id="backpack-game-container">
    <canvas id="backpack-canvas"></canvas>
    <div id="ui-overlay">
        <div id="object-counter">
            <span id="placed-count">0</span> / <span id="total-count">0</span> items packed
        </div>
    </div>
    <!-- FIXED: Buttons outside ui-overlay for proper visibility -->
    <button id="reset-btn" class="game-btn secondary">Reset</button>
    <button id="done-btn" class="game-btn primary" disabled>Done</button>
</div>

<<done>>
<<script>>
    // Hide Twine UI and make fullscreen
    document.getElementById('ui-bar').style.display = 'none';
    document.querySelector('.passage').classList.add('backpack-active');
    
    // Start the game
    setTimeout(function() {
        BackpackMinigame.start(State.variables.availableItems);
    }, 100);
<</script>>
<</done>>

:: BackpackComplete
# All Packed!

You managed to fit $packedCount items in your backpack:

<<for _item range $packedItems>>
* _item
<</for>>

<<if $packedItems.includes("cellphone")>>
✅ Good - you have your phone.
<<else>>
❌ You forgot your phone!
<</if>>

<<if $packedItems.includes("cash")>>
✅ Smart thinking with the cash.
<<else>>
⚠️ No money? That could be a problem...
<</if>>

<<if $packedItems.includes("bong")>>
🎉 The party essential made it in!
<<else>>
😅 Jake's going to be disappointed...
<</if>>

[[Continue->$nextPassage]]

:: LeaveForParty
# Time to Go!

With your backpack ready, you head out into the night.

<<if $packedCount gte 5>>
Your backpack feels heavy but complete.
<<elseif $packedCount gte 3>>
You've got the basics covered.
<<else>>
You're traveling light tonight.
<</if>>

The party awaits...

[[Arrive at the party->PartyScene]]

:: PartyScene
# The Party

You arrive at Jake's house. Music pulses from inside.

<<if $packedItems.includes("bong")>>
Jake greets you at the door: "My hero! You brought it!"

The party kicks into high gear.
<<else>>
Jake looks at your backpack hopefully: "Did you...?"

You shake your head. "Sorry man, couldn't fit it."

"Ah well, we'll survive!"
<</if>>

<<if $packedItems.includes("cups")>>
Later, someone yells: "We're out of cups!"

You save the day by pulling out your stack.
<</if>>

<<if not $packedItems.includes("cellphone")>>
You reach for your phone to capture the moment... but it's not there.

You'll have to rely on other people's photos.
<</if>>

THE END

Your packing score: <<print $packedCount * 10>> points!

[[Play again->Start]]`;
    
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
    console.log('4. Your polished game is ready!\n');
}

// ================================
// RUN BUILD
// ================================
build().catch(error => {
    console.error('❌ Build failed:', error);
    process.exit(1);
});