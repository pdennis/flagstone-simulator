class FlagstoneSimulator {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.paletteCanvas = document.getElementById('paletteCanvas');
        this.paletteCtx = this.paletteCanvas.getContext('2d');
        
        this.stones = [];
        this.paletteStones = [];
        this.selectedStone = null;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        this.showGrid = false;
        this.snapToGrid = false;
        this.gridSize = 20;
        
        this.setupEventListeners();
        this.generatePaletteStones();
        this.generateRandomStones();
        this.draw();
    }
    
    setupEventListeners() {
        // Main canvas events
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Palette canvas events
        this.paletteCanvas.addEventListener('click', this.handlePaletteClick.bind(this));
        
        // Keyboard events
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
    }
    
    generateStoneShape() {
        const shapes = [
            // Irregular polygon shapes for natural stones
            this.generateIrregularPolygon(6, 40, 60),
            this.generateIrregularPolygon(5, 35, 55),
            this.generateIrregularPolygon(7, 45, 70),
            this.generateIrregularPolygon(4, 30, 50),
            this.generateIrregularPolygon(8, 50, 80)
        ];
        
        return shapes[Math.floor(Math.random() * shapes.length)];
    }
    
    generateIrregularPolygon(sides, minRadius, maxRadius) {
        const points = [];
        const angleStep = (Math.PI * 2) / sides;
        
        for (let i = 0; i < sides; i++) {
            const angle = i * angleStep + (Math.random() - 0.5) * 0.5;
            const radius = minRadius + Math.random() * (maxRadius - minRadius);
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            points.push({ x, y });
        }
        
        return points;
    }
    
    createStone(x, y, shape = null) {
        const stoneShape = shape || this.generateStoneShape();
        const colors = [
            '#8D7053', '#A67B5B', '#967117', '#B8860B',
            '#CD853F', '#DEB887', '#F4A460', '#D2B48C',
            '#BC9A6A', '#9F8A78'
        ];
        
        return {
            x: x,
            y: y,
            shape: stoneShape,
            color: colors[Math.floor(Math.random() * colors.length)],
            rotation: Math.random() * Math.PI * 2,
            flipped: false,
            id: Math.random().toString(36).substr(2, 9)
        };
    }
    
    generatePaletteStones() {
        this.paletteStones = [];
        const spacing = 100;
        for (let i = 0; i < 7; i++) {
            const stone = this.createStone(60 + i * spacing, 60);
            this.paletteStones.push(stone);
        }
        this.drawPalette();
    }
    
    generateRandomStones() {
        this.stones = [];
        for (let i = 0; i < 3; i++) {
            const stone = this.createStone(
                100 + Math.random() * 600,
                100 + Math.random() * 400
            );
            this.stones.push(stone);
        }
        this.draw();
    }
    
    drawStone(ctx, stone, highlight = false) {
        ctx.save();
        ctx.translate(stone.x, stone.y);
        ctx.rotate(stone.rotation);
        ctx.scale(stone.flipped ? -1 : 1, 1);
        
        // Draw stone shadow
        ctx.save();
        ctx.translate(3, 3);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.moveTo(stone.shape[0].x, stone.shape[0].y);
        for (let i = 1; i < stone.shape.length; i++) {
            ctx.lineTo(stone.shape[i].x, stone.shape[i].y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        
        // Draw stone
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 60);
        gradient.addColorStop(0, this.lightenColor(stone.color, 20));
        gradient.addColorStop(1, this.darkenColor(stone.color, 20));
        
        ctx.fillStyle = gradient;
        ctx.strokeStyle = this.darkenColor(stone.color, 40);
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.moveTo(stone.shape[0].x, stone.shape[0].y);
        for (let i = 1; i < stone.shape.length; i++) {
            ctx.lineTo(stone.shape[i].x, stone.shape[i].y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Add texture lines
        ctx.strokeStyle = this.darkenColor(stone.color, 10);
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
            const angle = Math.random() * Math.PI;
            const length = 20 + Math.random() * 30;
            const startX = (Math.random() - 0.5) * 40;
            const startY = (Math.random() - 0.5) * 40;
            
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(startX + Math.cos(angle) * length, startY + Math.sin(angle) * length);
            ctx.stroke();
        }
        
        // Highlight if selected
        if (highlight) {
            ctx.strokeStyle = '#FF4444';
            ctx.lineWidth = 3;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(stone.shape[0].x, stone.shape[0].y);
            for (let i = 1; i < stone.shape.length; i++) {
                ctx.lineTo(stone.shape[i].x, stone.shape[i].y);
            }
            ctx.closePath();
            ctx.stroke();
            ctx.setLineDash([]);
        }
        
        ctx.restore();
    }
    
    drawGrid() {
        if (!this.showGrid) return;
        
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.lineWidth = 1;
        
        for (let x = 0; x <= this.canvas.width; x += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        for (let y = 0; y <= this.canvas.height; y += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawGrid();
        
        this.stones.forEach(stone => {
            const isSelected = this.selectedStone && this.selectedStone.id === stone.id;
            this.drawStone(this.ctx, stone, isSelected);
        });
    }
    
    drawPalette() {
        this.paletteCtx.clearRect(0, 0, this.paletteCanvas.width, this.paletteCanvas.height);
        
        this.paletteStones.forEach(stone => {
            this.drawStone(this.paletteCtx, stone);
        });
    }
    
    getMousePos(canvas, e) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }
    
    isPointInStone(point, stone) {
        // Simple bounding circle check for performance
        const distance = Math.sqrt(
            Math.pow(point.x - stone.x, 2) + Math.pow(point.y - stone.y, 2)
        );
        return distance < 80; // Approximate stone radius
    }
    
    handleMouseDown(e) {
        const mousePos = this.getMousePos(this.canvas, e);
        
        // Find the topmost stone at this position
        for (let i = this.stones.length - 1; i >= 0; i--) {
            if (this.isPointInStone(mousePos, this.stones[i])) {
                this.selectedStone = this.stones[i];
                this.isDragging = true;
                this.dragOffset = {
                    x: mousePos.x - this.stones[i].x,
                    y: mousePos.y - this.stones[i].y
                };
                
                // Move selected stone to top
                this.stones.splice(i, 1);
                this.stones.push(this.selectedStone);
                break;
            }
        }
        
        this.draw();
    }
    
    handleMouseMove(e) {
        if (!this.isDragging || !this.selectedStone) return;
        
        const mousePos = this.getMousePos(this.canvas, e);
        let newX = mousePos.x - this.dragOffset.x;
        let newY = mousePos.y - this.dragOffset.y;
        
        if (this.snapToGrid) {
            newX = Math.round(newX / this.gridSize) * this.gridSize;
            newY = Math.round(newY / this.gridSize) * this.gridSize;
        }
        
        this.selectedStone.x = newX;
        this.selectedStone.y = newY;
        
        this.draw();
    }
    
    handleMouseUp(e) {
        this.isDragging = false;
    }
    
    handlePaletteClick(e) {
        const mousePos = this.getMousePos(this.paletteCanvas, e);
        
        for (let stone of this.paletteStones) {
            if (this.isPointInStone(mousePos, stone)) {
                // Create a new stone in the main canvas
                const newStone = this.createStone(
                    200 + Math.random() * 400,
                    200 + Math.random() * 200,
                    stone.shape
                );
                newStone.color = stone.color;
                this.stones.push(newStone);
                this.draw();
                break;
            }
        }
    }
    
    handleKeyDown(e) {
        if (!this.selectedStone) return;
        
        switch (e.key) {
            case 'r':
            case 'R':
                this.rotateSelected(15);
                break;
            case 'e':
            case 'E':
                this.rotateSelected(-15);
                break;
            case 'f':
            case 'F':
                this.flipSelected();
                break;
            case 'Delete':
            case 'Backspace':
                this.deleteSelected();
                break;
        }
    }
    
    rotateSelected(degrees) {
        if (this.selectedStone) {
            this.selectedStone.rotation += (degrees * Math.PI) / 180;
            this.draw();
        }
    }
    
    flipSelected() {
        if (this.selectedStone) {
            this.selectedStone.flipped = !this.selectedStone.flipped;
            this.draw();
        }
    }
    
    deleteSelected() {
        if (this.selectedStone) {
            const index = this.stones.findIndex(s => s.id === this.selectedStone.id);
            if (index > -1) {
                this.stones.splice(index, 1);
                this.selectedStone = null;
                this.draw();
            }
        }
    }
    
    toggleGrid() {
        this.showGrid = !this.showGrid;
        this.draw();
    }
    
    toggleSnap() {
        this.snapToGrid = !this.snapToGrid;
    }
    
    clearCanvas() {
        this.stones = [];
        this.selectedStone = null;
        this.draw();
    }
    
    addRandomStone() {
        const newStone = this.createStone(
            200 + Math.random() * 400,
            200 + Math.random() * 200
        );
        this.stones.push(newStone);
        this.draw();
    }
    
    lightenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }
    
    darkenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        return "#" + (0x1000000 + (R > 255 ? 255 : R < 0 ? 0 : R) * 0x10000 +
            (G > 255 ? 255 : G < 0 ? 0 : G) * 0x100 +
            (B > 255 ? 255 : B < 0 ? 0 : B)).toString(16).slice(1);
    }
}

// Global functions for button controls
let simulator;

function rotateSelected(degrees) {
    simulator.rotateSelected(degrees);
}

function flipSelected() {
    simulator.flipSelected();
}

function deleteSelected() {
    simulator.deleteSelected();
}

function clearCanvas() {
    simulator.clearCanvas();
}

function generateRandomStones() {
    simulator.generateRandomStones();
}

function addRandomStone() {
    simulator.addRandomStone();
}

function toggleGrid() {
    simulator.toggleGrid();
}

function toggleSnap() {
    simulator.toggleSnap();
}

// Initialize the simulator when the page loads
window.addEventListener('load', () => {
    simulator = new FlagstoneSimulator();
});