
// ===== objects.js =====
/**
 * ObjectManager - Manages game objects and their states
 */
class ObjectManager {
    constructor(objectDefinitions) {
        this.objects = [];
        this.objectMap = new Map();
        this.initializeObjects(objectDefinitions);
    }

    initializeObjects(definitions) {
        this.objects = definitions.map(def => this.createObject(def));
        this.objects.forEach(obj => this.objectMap.set(obj.id, obj));
    }

    createObject(definition) {
        return {
            id: definition.id || this.generateId(),
            name: definition.name || 'Unknown Item',
            width: definition.width || 1,
            height: definition.height || 1,
            color: definition.color || '#9f7aea',
            sprite: definition.sprite || null,
            description: definition.description || '',
            isPlaced: false,
            gridX: -1,
            gridY: -1,
            pixelX: 0,
            pixelY: 0,
            required: definition.required || false
        };
    }

    generateId() {
        return 'obj_' + Math.random().toString(36).substr(2, 9);
    }

    getObject(id) {
        return this.objectMap.get(id);
    }

    getUnplacedObjects() {
        return this.objects.filter(obj => !obj.isPlaced);
    }

    getPlacedObjects() {
        return this.objects.filter(obj => obj.isPlaced);
    }

    resetAllObjects() {
        this.objects.forEach(obj => {
            obj.isPlaced = false;
            obj.gridX = -1;
            obj.gridY = -1;
        });
    }
}