/**
 * Debug Console for Backpack Minigame
 * Provides a floating, draggable panel with item checkboxes
 */
class DebugConsole {
    constructor(game) {
        this.game = game;
        this.isVisible = false;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        
        // Track which items are enabled
        this.enabledItems = new Set();
        
        // Initialize with all items enabled
        if (window.testObjects) {
            window.testObjects.forEach(obj => {
                this.enabledItems.add(obj.id);
            });
        }
        
        this.createConsole();
        this.setupEventListeners();
        this.hide(); // Start hidden
    }
    
    createConsole() {
        // Create main console container
        this.consoleElement = document.createElement('div');
        this.consoleElement.id = 'debug-console';
        this.consoleElement.innerHTML = `
            <div class="debug-header">
                <span class="debug-title">Debug Items</span>
                <button class="debug-close">×</button>
            </div>
            <div class="debug-content">
                <div class="debug-controls">
                    <button class="debug-btn" id="debug-select-all">All</button>
                    <button class="debug-btn" id="debug-select-none">None</button>
                    <button class="debug-btn" id="debug-apply">Apply</button>
                </div>
                <div class="debug-items-grid"></div>
            </div>
        `;
        
        // Add styles
        this.addStyles();
        
        // Add to body
        document.body.appendChild(this.consoleElement);
        
        // Populate items grid
        this.populateItems();
        
        // Position in top-right corner initially
        this.consoleElement.style.left = (window.innerWidth - 320) + 'px';
        this.consoleElement.style.top = '20px';
    }
    
    addStyles() {
        if (document.getElementById('debug-console-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'debug-console-styles';
        styles.textContent = `
            #debug-console {
                position: fixed;
                width: 300px;
                max-height: 600px;
                background: rgba(30, 30, 40, 0.95);
                border: 2px solid #4a5568;
                border-radius: 8px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
                z-index: 10000;
                color: #e2e8f0;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                user-select: none;
            }
            
            #debug-console.hidden {
                display: none;
            }
            
            .debug-header {
                background: rgba(74, 85, 104, 0.8);
                padding: 10px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                cursor: move;
                border-radius: 6px 6px 0 0;
            }
            
            .debug-title {
                font-weight: 600;
                font-size: 14px;
                color: #68d391;
            }
            
            .debug-close {
                background: transparent;
                border: none;
                color: #fc8181;
                font-size: 20px;
                cursor: pointer;
                padding: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .debug-close:hover {
                color: #f56565;
            }
            
            .debug-content {
                padding: 10px;
                max-height: 500px;
                overflow-y: auto;
            }
            
            .debug-controls {
                display: flex;
                gap: 5px;
                margin-bottom: 10px;
                padding-bottom: 10px;
                border-bottom: 1px solid #4a5568;
            }
            
            .debug-btn {
                flex: 1;
                padding: 5px 10px;
                background: #4a5568;
                border: 1px solid #718096;
                color: #e2e8f0;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
            }
            
            .debug-btn:hover {
                background: #718096;
            }
            
            #debug-apply {
                background: #48bb78;
                border-color: #68d391;
            }
            
            #debug-apply:hover {
                background: #68d391;
            }
            
            .debug-items-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 5px;
            }
            
            .debug-item {
                display: flex;
                align-items: center;
                padding: 5px;
                background: rgba(74, 85, 104, 0.3);
                border-radius: 4px;
                font-size: 12px;
            }
            
            .debug-item:hover {
                background: rgba(74, 85, 104, 0.5);
            }
            
            .debug-item input[type="checkbox"] {
                margin-right: 8px;
                cursor: pointer;
            }
            
            .debug-item label {
                cursor: pointer;
                flex: 1;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            
            /* Custom scrollbar for debug content */
            .debug-content::-webkit-scrollbar {
                width: 8px;
            }
            
            .debug-content::-webkit-scrollbar-track {
                background: rgba(74, 85, 104, 0.3);
                border-radius: 4px;
            }
            
            .debug-content::-webkit-scrollbar-thumb {
                background: #4a5568;
                border-radius: 4px;
            }
            
            .debug-content::-webkit-scrollbar-thumb:hover {
                background: #718096;
            }
        `;
        document.head.appendChild(styles);
    }
    
    populateItems() {
        const grid = this.consoleElement.querySelector('.debug-items-grid');
        grid.innerHTML = '';
        
        if (!window.testObjects) {
            grid.innerHTML = '<div style="color: #fc8181;">No test objects found!</div>';
            return;
        }
        
        window.testObjects.forEach(obj => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'debug-item';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `debug-item-${obj.id}`;
            checkbox.checked = this.enabledItems.has(obj.id);
            checkbox.dataset.itemId = obj.id;
            
            const label = document.createElement('label');
            label.htmlFor = `debug-item-${obj.id}`;
            label.textContent = obj.name;
            label.title = `${obj.name} (${obj.width}x${obj.height})`;
            
            itemDiv.appendChild(checkbox);
            itemDiv.appendChild(label);
            grid.appendChild(itemDiv);
            
            // Track checkbox changes
            checkbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.enabledItems.add(obj.id);
                } else {
                    this.enabledItems.delete(obj.id);
                }
            });
        });
    }
    
    setupEventListeners() {
        // Dragging
        const header = this.consoleElement.querySelector('.debug-header');
        header.addEventListener('mousedown', this.startDrag.bind(this));
        document.addEventListener('mousemove', this.drag.bind(this));
        document.addEventListener('mouseup', this.endDrag.bind(this));
        
        // Close button
        this.consoleElement.querySelector('.debug-close').addEventListener('click', () => {
            this.hide();
        });
        
        // Select All button
        document.getElementById('debug-select-all').addEventListener('click', () => {
            this.selectAll();
        });
        
        // Select None button
        document.getElementById('debug-select-none').addEventListener('click', () => {
            this.selectNone();
        });
        
        // Apply button
        document.getElementById('debug-apply').addEventListener('click', () => {
            this.applySelection();
        });
        
        // Keyboard shortcut (D key)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'd' || e.key === 'D') {
                // Don't trigger if user is typing in an input
                if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                    this.toggle();
                }
            }
        });
    }
    
    startDrag(e) {
        this.isDragging = true;
        const rect = this.consoleElement.getBoundingClientRect();
        this.dragOffset = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }
    
    drag(e) {
        if (!this.isDragging) return;
        
        const newX = e.clientX - this.dragOffset.x;
        const newY = e.clientY - this.dragOffset.y;
        
        // Keep console on screen
        const maxX = window.innerWidth - this.consoleElement.offsetWidth;
        const maxY = window.innerHeight - this.consoleElement.offsetHeight;
        
        this.consoleElement.style.left = Math.max(0, Math.min(newX, maxX)) + 'px';
        this.consoleElement.style.top = Math.max(0, Math.min(newY, maxY)) + 'px';
    }
    
    endDrag() {
        this.isDragging = false;
    }
    
    selectAll() {
        window.testObjects.forEach(obj => {
            this.enabledItems.add(obj.id);
            const checkbox = document.getElementById(`debug-item-${obj.id}`);
            if (checkbox) checkbox.checked = true;
        });
    }
    
    selectNone() {
        this.enabledItems.clear();
        this.consoleElement.querySelectorAll('.debug-item input[type="checkbox"]').forEach(cb => {
            cb.checked = false;
        });
    }
    
    applySelection() {
        if (!this.game) {
            console.error('Debug Console: No game instance connected');
            return;
        }
        
        // Get the filtered objects based on selection
        const selectedObjects = window.testObjects.filter(obj => 
            this.enabledItems.has(obj.id)
        );
        
        // Update the game with new objects
        this.game.updateObjects(selectedObjects);
        
        // Flash the apply button to show it worked
        const applyBtn = document.getElementById('debug-apply');
        applyBtn.style.background = '#9ae6b4';
        setTimeout(() => {
            applyBtn.style.background = '#48bb78';
        }, 200);
        
        console.log(`Debug Console: Applied ${selectedObjects.length} objects to game`);
    }
    
    show() {
        this.consoleElement.classList.remove('hidden');
        this.isVisible = true;
    }
    
    hide() {
        this.consoleElement.classList.add('hidden');
        this.isVisible = false;
    }
    
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }
    
    destroy() {
        document.removeEventListener('keydown', this.keydownHandler);
        document.removeEventListener('mousemove', this.drag);
        document.removeEventListener('mouseup', this.endDrag);
        this.consoleElement.remove();
    }
}