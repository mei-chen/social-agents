class MultiAgentSimulation {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.agents = [];
        this.particles = [];
        this.time = 0;
        this.paused = false;
        
        // Load personality data
        this.loadPersonalities();
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }
    
    async loadPersonalities() {
        try {
            const response = await fetch('../agents/personalities.json');
            const data = await response.json();
            this.personalities = data.personalities;
        } catch (error) {
            // Fallback to basic personalities
            this.personalities = [
                { name: 'Explorer', color: '#64ffda', emoji: '🔭', voice: 'curious', thoughts: { alone: ['Exploring...'], meeting: ['Hello!'] } },
                { name: 'Builder', color: '#ffab40', emoji: '🏗️', voice: 'practical', thoughts: { alone: ['Building...'], meeting: ['Let\'s work!'] } },
                { name: 'Diplomat', color: '#b388ff', emoji: '🤝', voice: 'warm', thoughts: { alone: ['Connecting...'], meeting: ['Good to see you!'] } },
                { name: 'Scientist', color: '#82b1ff', emoji: '🔬', voice: 'analytical', thoughts: { alone: ['Analyzing...'], meeting: ['Interesting...'] } },
                { name: 'Artist', color: '#ff6090', emoji: '🎨', voice: 'poetic', thoughts: { alone: ['Creating...'], meeting: ['Beautiful!'] } }
            ];
        }
        
        // Start with 3 agents after personalities load
        for (let i = 0; i < 3; i++) {
            setTimeout(() => this.spawnAgent(), i * 1000);
        }
        
        this.animate();
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    getRandomThought(personality, context = 'alone') {
        const thoughts = personality.thoughts[context];
        if (!thoughts || thoughts.length === 0) return '';
        return thoughts[Math.floor(Math.random() * thoughts.length)];
    }
    
    spawnAgent() {
        const personality = this.personalities[Math.floor(Math.random() * this.personalities.length)];
        const agent = {
            id: Math.random().toString(36).substr(2, 9),
            personality: personality,
            x: Math.random() * this.canvas.width,
            y: Math.random() * this.canvas.height,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            energy: 100,
            size: 20,
            thought: this.getRandomThought(personality, 'alone'),
            thoughtTimer: 0,
            connections: [],
            lastMet: null
        };
        
        this.agents.push(agent);
        this.updateAgentList();
        this.logEvent(`${personality.emoji} ${personality.name} spawned`, personality.color);
        
        // Spawn particles
        for (let i = 0; i < 20; i++) {
            this.particles.push({
                x: agent.x,
                y: agent.y,
                vx: (Math.random() - 0.5) * 5,
                vy: (Math.random() - 0.5) * 5,
                life: 1,
                color: personality.color
            });
        }
    }
    
    updateAgentList() {
        const list = document.getElementById('agentList');
        list.innerHTML = this.agents.map(agent => `
            <div class="agent-card">
                <div class="agent-name">${agent.personality.emoji} ${agent.personality.name}</div>
                <div class="agent-status">Energy: ${Math.round(agent.energy)}%</div>
                ${agent.thought ? `<div class="agent-status" style="font-style: italic; color: ${agent.personality.color}; margin-top: 4px;">"${agent.thought}"</div>` : ''}
            </div>
        `).join('');
    }
    
    logEvent(message, color = '#6495ff') {
        const events = document.getElementById('events');
        const time = new Date().toLocaleTimeString();
        const event = document.createElement('div');
        event.className = 'event';
        event.style.borderLeftColor = color;
        event.innerHTML = `
            <div>${message}</div>
            <div class="event-time">${time}</div>
        `;
        events.insertBefore(event, events.firstChild);
        
        // Keep only last 20 events
        while (events.children.length > 20) {
            events.removeChild(events.lastChild);
        }
    }
    
    triggerEvent() {
        const events = [
            { text: '🌟 Resource discovered!', effect: 'energy' },
            { text: '⚡ Energy storm approaching', effect: 'chaos' },
            { text: '🌈 Aurora phenomenon', effect: 'beauty' },
            { text: '🔥 Challenge initiated', effect: 'competition' }
        ];
        
        const event = events[Math.floor(Math.random() * events.length)];
        this.logEvent(event.text, '#ffab40');
        
        // Update all agents' thoughts to event context
        this.agents.forEach(agent => {
            agent.thought = this.getRandomThought(agent.personality, 'event');
            agent.thoughtTimer = 300;
        });
        
        // Create visual effect
        for (let i = 0; i < 50; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 3,
                vy: (Math.random() - 0.5) * 3,
                life: 1,
                color: '#ffab40'
            });
        }
    }
    
    togglePause() {
        this.paused = !this.paused;
    }
    
    updateAgents() {
        // Agent behavior
        this.agents.forEach(agent => {
            // Random movement with personality influence
            const speed = agent.personality.trait === 'curious' ? 2 : 1;
            agent.vx += (Math.random() - 0.5) * 0.5 * speed;
            agent.vy += (Math.random() - 0.5) * 0.5 * speed;
            
            // Damping
            agent.vx *= 0.95;
            agent.vy *= 0.95;
            
            // Update position
            agent.x += agent.vx;
            agent.y += agent.vy;
            
            // Bounce off edges
            if (agent.x < 0 || agent.x > this.canvas.width) agent.vx *= -1;
            if (agent.y < 0 || agent.y > this.canvas.height) agent.vy *= -1;
            
            agent.x = Math.max(0, Math.min(this.canvas.width, agent.x));
            agent.y = Math.max(0, Math.min(this.canvas.height, agent.y));
            
            // Energy decay
            agent.energy = Math.max(0, agent.energy - 0.05);
            
            // Update thoughts periodically
            agent.thoughtTimer--;
            if (agent.thoughtTimer <= 0) {
                const context = agent.energy < 30 ? 'lowEnergy' : 'alone';
                agent.thought = this.getRandomThought(agent.personality, context);
                agent.thoughtTimer = 200 + Math.random() * 200; // 200-400 frames
            }
        });
        
        // Check for interactions
        for (let i = 0; i < this.agents.length; i++) {
            for (let j = i + 1; j < this.agents.length; j++) {
                const a1 = this.agents[i];
                const a2 = this.agents[j];
                const dx = a2.x - a1.x;
                const dy = a2.y - a1.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                // Interaction when close
                if (dist < 100) {
                    // Update thoughts to meeting context
                    if (a1.lastMet !== a2.id && Math.random() < 0.002) {
                        a1.thought = this.getRandomThought(a1.personality, 'meeting');
                        a1.thoughtTimer = 300;
                        a1.lastMet = a2.id;
                        
                        a2.thought = this.getRandomThought(a2.personality, 'meeting');
                        a2.thoughtTimer = 300;
                        a2.lastMet = a1.id;
                        
                        this.logEvent(
                            `${a1.personality.emoji} ${a1.personality.name}: "${a1.thought}"`,
                            a1.personality.color
                        );
                        this.logEvent(
                            `${a2.personality.emoji} ${a2.personality.name}: "${a2.thought}"`,
                            a2.personality.color
                        );
                        
                        // Create connection particles
                        for (let k = 0; k < 10; k++) {
                            this.particles.push({
                                x: (a1.x + a2.x) / 2,
                                y: (a1.y + a2.y) / 2,
                                vx: (Math.random() - 0.5) * 2,
                                vy: (Math.random() - 0.5) * 2,
                                life: 1,
                                color: a1.personality.color
                            });
                        }
                    }
                }
            }
        }
    }
    
    updateParticles() {
        this.particles = this.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.02;
            return p.life > 0;
        });
    }
    
    draw() {
        // Clear with trail effect
        this.ctx.fillStyle = 'rgba(10, 14, 39, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background grid
        this.ctx.strokeStyle = 'rgba(100, 150, 255, 0.05)';
        this.ctx.lineWidth = 1;
        for (let x = 0; x < this.canvas.width; x += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        for (let y = 0; y < this.canvas.height; y += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
        
        // Draw particles
        this.particles.forEach(p => {
            this.ctx.fillStyle = p.color + Math.floor(p.life * 255).toString(16).padStart(2, '0');
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        // Draw connections between nearby agents
        for (let i = 0; i < this.agents.length; i++) {
            for (let j = i + 1; j < this.agents.length; j++) {
                const a1 = this.agents[i];
                const a2 = this.agents[j];
                const dx = a2.x - a1.x;
                const dy = a2.y - a1.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < 200) {
                    const alpha = (1 - dist / 200) * 0.3;
                    this.ctx.strokeStyle = `rgba(100, 150, 255, ${alpha})`;
                    this.ctx.lineWidth = 1;
                    this.ctx.beginPath();
                    this.ctx.moveTo(a1.x, a1.y);
                    this.ctx.lineTo(a2.x, a2.y);
                    this.ctx.stroke();
                }
            }
        }
        
        // Draw agents
        this.agents.forEach(agent => {
            // Glow effect
            const gradient = this.ctx.createRadialGradient(
                agent.x, agent.y, 0,
                agent.x, agent.y, agent.size * 2
            );
            gradient.addColorStop(0, agent.personality.color + '40');
            gradient.addColorStop(1, agent.personality.color + '00');
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(agent.x, agent.y, agent.size * 2, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Agent body
            this.ctx.fillStyle = agent.personality.color;
            this.ctx.beginPath();
            this.ctx.arc(agent.x, agent.y, agent.size, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Energy ring
            this.ctx.strokeStyle = agent.personality.color;
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(agent.x, agent.y, agent.size + 5, 0, Math.PI * 2 * (agent.energy / 100));
            this.ctx.stroke();
            
            // Emoji
            this.ctx.font = '24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(agent.personality.emoji, agent.x, agent.y);
            
            // Thought bubble
            if (agent.thought && agent.thoughtTimer > 0) {
                const bubblePadding = 12;
                const bubbleMaxWidth = 200;
                
                // Measure text
                this.ctx.font = '13px "SF Mono", monospace';
                const lines = this.wrapText(agent.thought, bubbleMaxWidth - bubblePadding * 2);
                const lineHeight = 18;
                const bubbleHeight = lines.length * lineHeight + bubblePadding * 2;
                const bubbleWidth = Math.min(bubbleMaxWidth, Math.max(...lines.map(l => this.ctx.measureText(l).width)) + bubblePadding * 2);
                
                const bubbleX = agent.x - bubbleWidth / 2;
                const bubbleY = agent.y - agent.size - 15 - bubbleHeight;
                
                // Bubble background
                this.ctx.fillStyle = 'rgba(20, 25, 45, 0.95)';
                this.ctx.strokeStyle = agent.personality.color;
                this.ctx.lineWidth = 2;
                
                this.roundRect(bubbleX, bubbleY, bubbleWidth, bubbleHeight, 8);
                this.ctx.fill();
                this.ctx.stroke();
                
                // Bubble tail
                this.ctx.beginPath();
                this.ctx.moveTo(agent.x - 5, bubbleY + bubbleHeight);
                this.ctx.lineTo(agent.x, agent.y - agent.size - 5);
                this.ctx.lineTo(agent.x + 5, bubbleY + bubbleHeight);
                this.ctx.closePath();
                this.ctx.fill();
                
                // Text
                this.ctx.fillStyle = '#e0e0e0';
                this.ctx.font = '13px "SF Mono", monospace';
                this.ctx.textAlign = 'left';
                lines.forEach((line, i) => {
                    this.ctx.fillText(
                        line,
                        bubbleX + bubblePadding,
                        bubbleY + bubblePadding + (i + 0.7) * lineHeight
                    );
                });
            }
        });
    }
    
    wrapText(text, maxWidth) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';
        
        words.forEach(word => {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            const metrics = this.ctx.measureText(testLine);
            
            if (metrics.width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        });
        
        if (currentLine) lines.push(currentLine);
        return lines;
    }
    
    roundRect(x, y, width, height, radius) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
    }
    
    animate() {
        if (!this.paused) {
            this.time++;
            this.updateAgents();
            this.updateParticles();
            
            if (this.time % 100 === 0) {
                this.updateAgentList();
            }
        }
        
        this.draw();
        requestAnimationFrame(() => this.animate());
    }
}

// Initialize simulation
const simulation = new MultiAgentSimulation();
