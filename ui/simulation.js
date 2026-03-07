class MultiAgentSimulation {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.agents = [];
        this.particles = [];
        this.time = 0;
        this.paused = false;
        
        this.personalities = [
            { name: 'Explorer', color: '#64ffda', emoji: '🔭', trait: 'curious' },
            { name: 'Builder', color: '#ffab40', emoji: '🏗️', trait: 'resourceful' },
            { name: 'Diplomat', color: '#b388ff', emoji: '🤝', trait: 'social' },
            { name: 'Scientist', color: '#82b1ff', emoji: '🔬', trait: 'analytical' },
            { name: 'Artist', color: '#ff6090', emoji: '🎨', trait: 'creative' }
        ];
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        // Start with 3 agents
        for (let i = 0; i < 3; i++) {
            setTimeout(() => this.spawnAgent(), i * 1000);
        }
        
        this.animate();
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
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
            thinking: '',
            connections: []
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
                <div class="agent-status">Energy: ${Math.round(agent.energy)}% | ${agent.thinking || 'Idle'}</div>
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
            
            // Energy decay and thinking state
            agent.energy = Math.max(0, agent.energy - 0.05);
            
            if (Math.random() < 0.01) {
                const thoughts = ['exploring', 'thinking', 'creating', 'analyzing', 'socializing'];
                agent.thinking = thoughts[Math.floor(Math.random() * thoughts.length)];
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
                
                if (dist < 100 && Math.random() < 0.001) {
                    this.logEvent(
                        `${a1.personality.emoji} ${a1.personality.name} met ${a2.personality.emoji} ${a2.personality.name}`,
                        a1.personality.color
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
        });
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
