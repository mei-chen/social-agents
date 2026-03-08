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
            const response = await fetch('/agents/personalities.json');
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
        
        // Determine initial emotional state based on personality
        const emotionalStates = {
            'Explorer': ['curious', 'energized', 'joyful'],
            'Builder': ['focused', 'contemplative', 'peaceful'],
            'Diplomat': ['joyful', 'peaceful', 'playful'],
            'Scientist': ['focused', 'contemplative', 'curious'],
            'Artist': ['playful', 'contemplative', 'joyful']
        };
        
        const possibleStates = emotionalStates[personality.name] || ['peaceful'];
        const emotionalState = possibleStates[Math.floor(Math.random() * possibleStates.length)];
        
        const agent = {
            id: Math.random().toString(36).substr(2, 9),
            personality: personality,
            emotionalState: emotionalState,
            emotionalTimer: Math.random() * 400 + 200,
            x: Math.random() * this.canvas.width,
            y: Math.random() * this.canvas.height,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            size: 20,
            direction: Math.random() * Math.PI * 2, // Direction they're facing
            walkCycle: 0, // Animation frame
            idleTimer: 0, // Time standing still
            bounceOffset: Math.random() * Math.PI * 2, // For bounce animation
            thought: this.getRandomThought(personality, 'alone'),
            thoughtTimer: 0,
            relationships: new Map(),
            lastMet: null,
            mood: 0.7
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
    
    getEmotionModifier(state) {
        const emotionEffects = {
            'curious': { explorationSpeed: 1.5, sociability: 0.7 },
            'joyful': { explorationSpeed: 1.0, sociability: 1.5 },
            'contemplative': { explorationSpeed: 0.5, sociability: 0.3 },
            'energized': { explorationSpeed: 2.0, sociability: 1.2 },
            'peaceful': { explorationSpeed: 0.7, sociability: 1.0 },
            'anxious': { explorationSpeed: 1.3, sociability: 0.5 },
            'focused': { explorationSpeed: 0.8, sociability: 0.4 },
            'playful': { explorationSpeed: 1.4, sociability: 1.3 }
        };
        return emotionEffects[state] || { explorationSpeed: 1.0, sociability: 1.0 };
    }
    
    transitionEmotion(agent) {
        // Emotion transitions based on mood and personality
        if (agent.mood > 0.7) {
            const positive = ['joyful', 'energized', 'playful', 'curious'];
            return positive[Math.floor(Math.random() * positive.length)];
        } else if (agent.mood < 0.4) {
            const negative = ['anxious', 'contemplative'];
            return negative[Math.floor(Math.random() * negative.length)];
        } else {
            const neutral = ['peaceful', 'focused', 'contemplative'];
            return neutral[Math.floor(Math.random() * neutral.length)];
        }
    }
    
    getAffinity(personality1, personality2) {
        const affinityMap = {
            'Explorer-Builder': 0.7, 'Explorer-Diplomat': 0.8, 'Explorer-Scientist': 0.9, 'Explorer-Artist': 0.85,
            'Builder-Diplomat': 0.75, 'Builder-Scientist': 0.85, 'Builder-Artist': 0.6,
            'Diplomat-Scientist': 0.5, 'Diplomat-Artist': 0.9,
            'Scientist-Artist': 0.7
        };
        
        const key1 = `${personality1}-${personality2}`;
        const key2 = `${personality2}-${personality1}`;
        return affinityMap[key1] || affinityMap[key2] || 0.5;
    }
    
    getInteractionOutcome(personality1, personality2) {
        const outcomes = {
            'Explorer-Builder': ['Explorer shares discoveries, Builder sees applications', 'Builder creates tools for Explorer\'s journeys'],
            'Explorer-Diplomat': ['Diplomat encourages Explorer\'s curiosity', 'Natural friendship through shared wonder'],
            'Explorer-Scientist': ['Perfect research partnership', 'Explorer finds, Scientist analyzes'],
            'Explorer-Artist': ['Both see beauty in discovery', 'Artist captures what Explorer finds'],
            'Builder-Diplomat': ['Diplomat smooths Builder\'s rough edges', 'Builder provides practical support'],
            'Builder-Scientist': ['Scientist theorizes, Builder implements', 'Shared love of optimization'],
            'Builder-Artist': ['Tension creates beautiful solutions', 'Learning from differences'],
            'Diplomat-Scientist': ['Diplomat brings warmth, Scientist brings logic', 'Diplomat helps Scientist connect'],
            'Diplomat-Artist': ['Both deeply emotional and expressive', 'Create beauty together'],
            'Scientist-Artist': ['Science and art merge', 'Artist shows Scientist beauty in data']
        };
        
        const key1 = `${personality1}-${personality2}`;
        const key2 = `${personality2}-${personality1}`;
        const options = outcomes[key1] || outcomes[key2] || ['They exchange perspectives'];
        return options[Math.floor(Math.random() * options.length)];
    }
    
    getEmotionEmoji(state) {
        const emojis = {
            'curious': '🤔', 'joyful': '😊', 'contemplative': '🧘',
            'energized': '⚡', 'peaceful': '🌸', 'anxious': '😰',
            'focused': '🎯', 'playful': '🎨'
        };
        return emojis[state] || '😐';
    }
    
    updateAgentList() {
        const list = document.getElementById('agentList');
        list.innerHTML = this.agents.map(agent => {
            const moodColor = agent.mood > 0.7 ? '#81c784' : agent.mood < 0.4 ? '#ff9800' : '#82b1ff';
            return `
                <div class="agent-card">
                    <div class="agent-name">${agent.personality.emoji} ${agent.personality.name} ${this.getEmotionEmoji(agent.emotionalState)}</div>
                    <div class="agent-status">Mood: <span style="color: ${moodColor}">${Math.round(agent.mood * 100)}%</span> | ${agent.emotionalState}</div>
                    ${agent.thought ? `<div class="agent-status" style="font-style: italic; color: ${agent.personality.color}; margin-top: 4px;">"${agent.thought}"</div>` : ''}
                </div>
            `;
        }).join('');
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
            const emotionModifier = this.getEmotionModifier(agent.emotionalState);
            const speed = emotionModifier.explorationSpeed;
            
            // More natural wandering behavior
            if (Math.random() < 0.02) {
                // Change direction occasionally
                const targetDir = Math.random() * Math.PI * 2;
                agent.vx = Math.cos(targetDir) * speed;
                agent.vy = Math.sin(targetDir) * speed;
            }
            
            // Smooth damping
            agent.vx *= 0.98;
            agent.vy *= 0.98;
            
            // Update direction based on velocity
            if (Math.abs(agent.vx) > 0.1 || Math.abs(agent.vy) > 0.1) {
                agent.direction = Math.atan2(agent.vy, agent.vx);
                agent.walkCycle += 0.15;
                agent.idleTimer = 0;
            } else {
                agent.idleTimer++;
            }
            
            // Update position
            agent.x += agent.vx;
            agent.y += agent.vy;
            
            // Bounce animation
            agent.bounceOffset += 0.05;
            
            // Bounce off edges
            if (agent.x < 0 || agent.x > this.canvas.width) agent.vx *= -1;
            if (agent.y < 0 || agent.y > this.canvas.height) agent.vy *= -1;
            
            agent.x = Math.max(0, Math.min(this.canvas.width, agent.x));
            agent.y = Math.max(0, Math.min(this.canvas.height, agent.y));
            
            // Update emotional state over time
            agent.emotionalTimer--;
            if (agent.emotionalTimer <= 0) {
                agent.emotionalState = this.transitionEmotion(agent);
                agent.emotionalTimer = 300 + Math.random() * 300;
            }
            
            // Mood gradually returns to baseline
            agent.mood = agent.mood * 0.99 + 0.7 * 0.01;
            
            // Update thoughts periodically
            agent.thoughtTimer--;
            if (agent.thoughtTimer <= 0) {
                const context = agent.mood < 0.4 ? 'lowEnergy' : 'alone';
                agent.thought = this.getRandomThought(agent.personality, context);
                agent.thoughtTimer = 200 + Math.random() * 200;
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
                    // Calculate relationship affinity
                    const affinity = this.getAffinity(a1.personality.name, a2.personality.name);
                    
                    // Update relationships
                    const currentAffinity1 = a1.relationships.get(a2.id) || affinity;
                    const currentAffinity2 = a2.relationships.get(a1.id) || affinity;
                    
                    if (a1.lastMet !== a2.id && Math.random() < 0.002) {
                        // Interaction occurs!
                        const interactionQuality = (a1.mood + a2.mood) / 2 * affinity;
                        
                        // Update relationship based on interaction
                        a1.relationships.set(a2.id, Math.min(1, currentAffinity1 + 0.05));
                        a2.relationships.set(a1.id, Math.min(1, currentAffinity2 + 0.05));
                        
                        // Emotional impact of meeting
                        a1.mood = Math.min(1, a1.mood + interactionQuality * 0.1);
                        a2.mood = Math.min(1, a2.mood + interactionQuality * 0.1);
                        
                        // Transition to positive emotional state
                        if (interactionQuality > 0.7) {
                            const positiveStates = ['joyful', 'energized', 'playful'];
                            a1.emotionalState = positiveStates[Math.floor(Math.random() * positiveStates.length)];
                            a2.emotionalState = positiveStates[Math.floor(Math.random() * positiveStates.length)];
                        }
                        
                        a1.thought = this.getRandomThought(a1.personality, 'meeting');
                        a1.thoughtTimer = 300;
                        a1.lastMet = a2.id;
                        
                        a2.thought = this.getRandomThought(a2.personality, 'meeting');
                        a2.thoughtTimer = 300;
                        a2.lastMet = a1.id;
                        
                        const outcome = this.getInteractionOutcome(a1.personality.name, a2.personality.name);
                        
                        this.logEvent(
                            `${a1.personality.emoji} ${a1.personality.name}: "${a1.thought}"`,
                            a1.personality.color
                        );
                        this.logEvent(
                            `${a2.personality.emoji} ${a2.personality.name}: "${a2.thought}"`,
                            a2.personality.color
                        );
                        this.logEvent(
                            `💫 ${outcome} (affinity: ${Math.round(affinity * 100)}%)`,
                            '#b388ff'
                        );
                        
                        // Create connection particles proportional to affinity
                        const particleCount = Math.floor(10 + affinity * 20);
                        for (let k = 0; k < particleCount; k++) {
                            this.particles.push({
                                x: (a1.x + a2.x) / 2,
                                y: (a1.y + a2.y) / 2,
                                vx: (Math.random() - 0.5) * 3,
                                vy: (Math.random() - 0.5) * 3,
                                life: 1,
                                color: interactionQuality > 0.7 ? '#ffeb3b' : a1.personality.color
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
            this.ctx.save();
            this.ctx.translate(agent.x, agent.y);
            
            // Bounce effect when walking
            const bounce = agent.idleTimer > 30 ? 0 : Math.sin(agent.walkCycle) * 2;
            this.ctx.translate(0, bounce);
            
            // Glow/aura effect
            const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, agent.size * 2.5);
            gradient.addColorStop(0, agent.personality.color + '30');
            gradient.addColorStop(1, agent.personality.color + '00');
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, agent.size * 2.5, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Draw character body
            this.drawCharacter(agent);
            
            // Mood indicator (subtle pulse around character)
            const moodColor = agent.mood > 0.7 ? '#81c784' : agent.mood < 0.4 ? '#ff9800' : agent.personality.color;
            this.ctx.strokeStyle = moodColor + '80';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            const pulseSize = agent.size * 1.5 + Math.sin(this.time * 0.05) * 3;
            this.ctx.arc(0, 0, pulseSize, 0, Math.PI * 2 * agent.mood);
            this.ctx.stroke();
            
            // Emotional state indicator (floating emoji)
            this.ctx.font = '14px Arial';
            const emotionBob = Math.sin(agent.bounceOffset) * 3;
            this.ctx.fillText(this.getEmotionEmoji(agent.emotionalState), agent.size + 5, -agent.size - 5 + emotionBob);
            
            this.ctx.restore();
            
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
    
    drawCharacter(agent) {
        const personality = agent.personality.name;
        const size = agent.size;
        const walking = agent.idleTimer < 30;
        const legSwing = Math.sin(agent.walkCycle) * 0.3;
        
        this.ctx.fillStyle = agent.personality.color;
        
        // Body shape varies by personality
        if (personality === 'Explorer') {
            // Rounded body with backpack
            this.ctx.beginPath();
            this.ctx.ellipse(0, 0, size * 0.7, size * 0.9, 0, 0, Math.PI * 2);
            this.ctx.fill();
            // Backpack
            this.ctx.fillStyle = agent.personality.color + '80';
            this.ctx.fillRect(-size * 0.8, -size * 0.3, size * 0.3, size * 0.6);
        } else if (personality === 'Builder') {
            // Sturdy rectangular body
            this.ctx.fillRect(-size * 0.6, -size * 0.8, size * 1.2, size * 1.3);
            // Tool belt
            this.ctx.fillStyle = '#ffab40';
            this.ctx.fillRect(-size * 0.7, size * 0.2, size * 1.4, size * 0.2);
        } else if (personality === 'Diplomat') {
            // Soft rounded form
            this.ctx.beginPath();
            this.ctx.arc(0, -size * 0.2, size * 0.8, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.beginPath();
            this.ctx.ellipse(0, size * 0.3, size * 0.6, size * 0.5, 0, 0, Math.PI * 2);
            this.ctx.fill();
        } else if (personality === 'Scientist') {
            // Angular, precise shape
            this.ctx.beginPath();
            this.ctx.moveTo(0, -size);
            this.ctx.lineTo(size * 0.6, -size * 0.3);
            this.ctx.lineTo(size * 0.6, size * 0.5);
            this.ctx.lineTo(-size * 0.6, size * 0.5);
            this.ctx.lineTo(-size * 0.6, -size * 0.3);
            this.ctx.closePath();
            this.ctx.fill();
            // Lab coat
            this.ctx.strokeStyle = '#ffffff80';
            this.ctx.lineWidth = 3;
            this.ctx.stroke();
        } else if (personality === 'Artist') {
            // Flowing, organic shape
            this.ctx.beginPath();
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const radius = size * (0.8 + Math.sin(angle * 3 + agent.bounceOffset) * 0.2);
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                if (i === 0) this.ctx.moveTo(x, y);
                else this.ctx.lineTo(x, y);
            }
            this.ctx.closePath();
            this.ctx.fill();
        }
        
        // Head (personality emoji)
        this.ctx.font = `${size * 1.2}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(agent.personality.emoji, 0, -size * 0.8);
        
        // Legs (simple walking animation)
        if (walking) {
            this.ctx.strokeStyle = agent.personality.color;
            this.ctx.lineWidth = 4;
            this.ctx.lineCap = 'round';
            
            // Left leg
            this.ctx.beginPath();
            this.ctx.moveTo(-size * 0.3, size * 0.5);
            this.ctx.lineTo(-size * 0.3 + legSwing * size, size * 1.2);
            this.ctx.stroke();
            
            // Right leg
            this.ctx.beginPath();
            this.ctx.moveTo(size * 0.3, size * 0.5);
            this.ctx.lineTo(size * 0.3 - legSwing * size, size * 1.2);
            this.ctx.stroke();
        } else {
            // Standing still
            this.ctx.strokeStyle = agent.personality.color;
            this.ctx.lineWidth = 4;
            this.ctx.lineCap = 'round';
            this.ctx.beginPath();
            this.ctx.moveTo(-size * 0.3, size * 0.5);
            this.ctx.lineTo(-size * 0.3, size * 1.2);
            this.ctx.stroke();
            this.ctx.beginPath();
            this.ctx.moveTo(size * 0.3, size * 0.5);
            this.ctx.lineTo(size * 0.3, size * 1.2);
            this.ctx.stroke();
        }
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
