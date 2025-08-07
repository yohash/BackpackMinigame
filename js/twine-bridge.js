
// ===== twine-bridge.js =====
/**
 * TwineBridge - Handles communication between the game and Twine
 */
class TwineBridge {
    constructor() {
        this.isInTwine = this.detectTwineEnvironment();
    }

    detectTwineEnvironment() {
        return !!(window.SugarCube && window.SugarCube.State);
    }

    getVariable(name, defaultValue = null) {
        if (this.isInTwine) {
            return window.SugarCube.State.variables[name] || defaultValue;
        }
        return defaultValue;
    }

    setVariable(name, value) {
        if (this.isInTwine) {
            window.SugarCube.State.variables[name] = value;
        }
    }

    navigateToPassage(passageName) {
        if (this.isInTwine && window.SugarCube.Engine) {
            window.SugarCube.Engine.play(passageName);
        }
    }

    parsePassageData(passageContent) {
        // Parse data attributes from Twine passage HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(passageContent, 'text/html');

        const config = {};

        // Look for data attributes
        const gameElement = doc.querySelector('[data-backpack-config]');
        if (gameElement) {
            try {
                config.backpack = JSON.parse(gameElement.dataset.backpackConfig);
            } catch (e) {
                console.error('Failed to parse backpack config:', e);
            }
        }

        // Look for object definitions
        const objectElements = doc.querySelectorAll('[data-object]');
        config.objects = Array.from(objectElements).map(el => {
            try {
                return JSON.parse(el.dataset.object);
            } catch (e) {
                console.error('Failed to parse object data:', e);
                return null;
            }
        }).filter(obj => obj !== null);

        return config;
    }

    exportGameState(placedObjects, allObjects) {
        const result = {
            packedItems: {},
            totalPacked: 0,
            totalAvailable: allObjects.length,
            timestamp: new Date().toISOString()
        };

        // Convert placed objects to boolean flags
        placedObjects.forEach(obj => {
            result.packedItems[obj.id] = true;
        });

        result.totalPacked = placedObjects.length;

        // Store in Twine if available
        if (this.isInTwine) {
            this.setVariable('backpackResult', result);
        }

        return result;
    }
}

// Make classes globally available
window.GridSystem = GridSystem;
window.ObjectManager = ObjectManager;
window.Renderer = Renderer;
window.TwineBridge = TwineBridge;