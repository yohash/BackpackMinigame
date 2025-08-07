
// ===== renderer.js =====
/**
 * Renderer - Handles all canvas rendering operations
 */
class Renderer {
    constructor(ctx, config) {
        this.ctx = ctx;
        this.config = config;
        this.sprites = new Map();
    }

    async loadSprite(key, src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.sprites.set(key, img);
                resolve(img);
            };
            img.onerror = () => reject(`Failed to load sprite: ${src}`);
            img.src = src;
        });
    }

    clear() {
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }

    drawBackpack(x, y, width, height) {
        // Background
        this.ctx.fillStyle = this.config.backpackColor || '#ffffff';
        this.ctx.fillRect(x, y, width, height);

        // Border
        this.ctx.strokeStyle = this.config.backpackBorderColor || '#4a5568';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(x, y, width, height);
    }

    drawGrid(x, y, gridWidth, gridHeight, cellSize) {
        this.ctx.strokeStyle = this.config.gridLineColor || '#e2e8f0';
        this.ctx.lineWidth = 1;

        // Vertical lines
        for (let i = 1; i < gridWidth; i++) {
            const lineX = x + (i * cellSize);
            this.ctx.beginPath();
            this.ctx.moveTo(lineX, y);
            this.ctx.lineTo(lineX, y + (gridHeight * cellSize));
            this.ctx.stroke();
        }

        // Horizontal lines
        for (let i = 1; i < gridHeight; i++) {
            const lineY = y + (i * cellSize);
            this.ctx.beginPath();
            this.ctx.moveTo(x, lineY);
            this.ctx.lineTo(x + (gridWidth * cellSize), lineY);
            this.ctx.stroke();
        }
    }

    drawObject(obj, cellSize, alpha = 1.0) {
        this.ctx.globalAlpha = alpha;

        const width = obj.width * cellSize;
        const height = obj.height * cellSize;

        if (obj.sprite && this.sprites.has(obj.sprite)) {
            // Draw sprite
            this.ctx.drawImage(
                this.sprites.get(obj.sprite),
                obj.pixelX,
                obj.pixelY,
                width,
                height
            );
        } else {
            // Draw colored rectangle as placeholder
            this.ctx.fillStyle = obj.color;
            this.ctx.fillRect(obj.pixelX, obj.pixelY, width, height);

            // Border
            this.ctx.strokeStyle = '#2d3748';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(obj.pixelX, obj.pixelY, width, height);

            // Label
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(
                obj.name,
                obj.pixelX + width / 2,
                obj.pixelY + height / 2
            );
        }

        this.ctx.globalAlpha = 1.0;
    }

    drawPlacementPreview(x, y, width, height, isValid) {
        this.ctx.globalAlpha = 0.3;
        this.ctx.fillStyle = isValid ? '#48bb78' : '#f56565';
        this.ctx.fillRect(x, y, width, height);

        this.ctx.globalAlpha = 0.6;
        this.ctx.strokeStyle = isValid ? '#38a169' : '#e53e3e';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, width, height);

        this.ctx.globalAlpha = 1.0;
    }
}