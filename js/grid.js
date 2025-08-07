/**
 * GridSystem - Manages the grid logic and collision detection
 */
class GridSystem {
    constructor(width, height, cellSize) {
        this.width = width;
        this.height = height;
        this.cellSize = cellSize;
        this.grid = this.createEmptyGrid();
    }

    createEmptyGrid() {
        const grid = [];
        for (let y = 0; y < this.height; y++) {
            grid[y] = [];
            for (let x = 0; x < this.width; x++) {
                grid[y][x] = null;
            }
        }
        return grid;
    }

    isValidPosition(x, y, width, height) {
        // Check boundaries
        if (x < 0 || y < 0 || x + width > this.width || y + height > this.height) {
            return false;
        }

        // Check for overlaps
        for (let dy = 0; dy < height; dy++) {
            for (let dx = 0; dx < width; dx++) {
                if (this.grid[y + dy][x + dx] !== null) {
                    return false;
                }
            }
        }

        return true;
    }

    placeObject(x, y, width, height, objectId) {
        for (let dy = 0; dy < height; dy++) {
            for (let dx = 0; dx < width; dx++) {
                this.grid[y + dy][x + dx] = objectId;
            }
        }
    }

    removeObject(x, y, width, height) {
        for (let dy = 0; dy < height; dy++) {
            for (let dx = 0; dx < width; dx++) {
                this.grid[y + dy][x + dx] = null;
            }
        }
    }

    clear() {
        this.grid = this.createEmptyGrid();
    }
}