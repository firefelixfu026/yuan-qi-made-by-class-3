class YuanQiGame {
    constructor() {
        this.player = { alive: true, mp: 0, selectedSkill: null };
        this.ai = { alive: true, mp: 0, selectedSkill: null };
        this.round = 1;
        this.gameOver = false;
        this.skills = {
            ramen: { name: '拉面', mp: 2, damage: 0, type: 'magic' },
            slash: { name: '一斩', mp: 0, damage: 0.5, type: 'slash' },
            Ldef: { name: 'L防', mp: 1, damage: 0, type: 'defense', defense: 'slash' },
            wave: { name: '波', mp: -2, damage: 2, type: 'wave' },
            Xdef: { name: 'X防', mp: 1, damage: 0, type: 'defense', defense: 'wave' }
        };
        this.init();
    }

    init() {
        this.bindEvents();
        this.updateUI();
        this.addBothLog('游戏开始！');
    }

    bindEvents() {
        document.querySelectorAll('#skills1 .skill').forEach(btn => {
            btn.addEventListener('click', (e) => this.selectSkill(e.currentTarget));
        });
        document.getElementById('restart').addEventListener('click', () => this.restart());
        document.getElementById('next-round').addEventListener('click', () => this.prepareNextRound());
    }

    selectSkill(btn) {
        if (this.gameOver || !this.player.alive || this.player.selectedSkill) return;
        
        const skill = btn.dataset.skill;
        
        if (!this.canUseSkill(this.player, skill)) {
            this.addPlayerLog('魔力不足！');
            return;
        }
        
        this.player.selectedSkill = skill;
        this.highlightSelection(1, skill);
        this.addPlayerLog(`使用 ${this.skills[skill].name}`);
        
        setTimeout(() => this.aiSelectSkill(), 800);
    }

    aiSelectSkill() {
        const availableSkills = Object.keys(this.skills).filter(skill => 
            this.canUseSkill(this.ai, skill)
        );
        
        let selectedSkill;
        if (availableSkills.length === 0) {
            selectedSkill = 'ramen';
        } else {
            selectedSkill = this.aiChooseSkill(availableSkills);
        }
        
        this.ai.selectedSkill = selectedSkill;
        this.addAILog(`使用 ${this.skills[selectedSkill].name}`);
        
        setTimeout(() => this.resolveRound(), 800);
    }

    aiChooseSkill(availableSkills) {
        const playerSelected = this.player.selectedSkill;
        
        if (playerSelected === 'slash' && availableSkills.includes('Ldef')) return 'Ldef';
        if (playerSelected === 'wave' && availableSkills.includes('Xdef')) return 'Xdef';
        if (availableSkills.includes('wave') && this.ai.mp >= 2) return 'wave';
        if (availableSkills.includes('slash')) return 'slash';
        if (availableSkills.includes('ramen')) return 'ramen';
        
        return availableSkills[Math.floor(Math.random() * availableSkills.length)];
    }

    canUseSkill(entity, skill) {
        const skillData = this.skills[skill];
        return entity.mp + skillData.mp >= 0;
    }

    highlightSelection(player, skill) {
        const container = document.getElementById(`skills${player}`);
        if (container) {
            container.querySelectorAll('.skill').forEach(btn => btn.classList.remove('selected'));
            container.querySelector(`[data-skill="${skill}"]`).classList.add('selected');
        }
    }

    resolveRound() {
        const playerSkill = this.skills[this.player.selectedSkill];
        const aiSkill = this.skills[this.ai.selectedSkill];
        
        this.addBothLog(`--- 第 ${this.round} 回合 ---`);
        
        const playerDamage = this.calculateDamage(playerSkill, aiSkill);
        const aiDamage = this.calculateDamage(aiSkill, playerSkill);
        
        if (playerDamage > aiDamage) {
            this.addBothLog('AI阵亡，游戏结束');
            this.ai.alive = false;
        } else if (aiDamage > playerDamage) {
            this.addBothLog('你阵亡，游戏结束');
            this.player.alive = false;
        } else {
            this.addBothLog('回合继续');
        }
        
        this.updateMana(playerSkill, this.player);
        this.updateMana(aiSkill, this.ai);
        
        this.player.selectedSkill = null;
        this.ai.selectedSkill = null;
        
        this.clearSelections();
        this.updateUI();
        this.round++;
        
        if (!this.player.alive || !this.ai.alive) {
            this.endGame();
        }
    }

    calculateDamage(attackSkill, defenseSkill) {
        if (attackSkill.damage === 0) return 0;
        
        if (defenseSkill.type === 'defense' && defenseSkill.defense === attackSkill.type) {
            return 0;
        }
        
        return attackSkill.damage;
    }

    updateMana(skill, entity) {
        entity.mp += skill.mp;
    }

    clearSelections() {
        document.querySelectorAll('.skill').forEach(btn => btn.classList.remove('selected'));
    }

    addPlayerLog(message) {
        const logContent = document.getElementById('player-log-content');
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        entry.textContent = message;
        logContent.appendChild(entry);
        logContent.parentElement.scrollTop = logContent.parentElement.scrollHeight;
    }

    addAILog(message) {
        const logContent = document.getElementById('ai-log-content');
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        entry.textContent = message;
        logContent.appendChild(entry);
        logContent.parentElement.scrollTop = logContent.parentElement.scrollHeight;
    }

    addBothLog(message) {
        this.addPlayerLog(message);
        this.addAILog(message);
    }

    updateUI() {
        document.getElementById('hp1').textContent = this.player.alive ? '存活' : '已阵亡';
        document.getElementById('hp2').textContent = this.ai.alive ? '存活' : '已阵亡';
        document.getElementById('mp1').textContent = this.player.mp;
        document.getElementById('mp2').textContent = this.ai.mp;
        document.getElementById('round').textContent = this.round;
        
        const status = !this.player.alive ? '你已阵亡！' : 
                      !this.ai.alive ? 'AI已阵亡！' : 
                      this.player.selectedSkill ? '等待AI选择...' : `第 ${this.round} 回合 - 请选择技能`;
        
        document.getElementById('round-status').textContent = status;
        
        const skillButtons = document.querySelectorAll('#skills1 .skill');
        skillButtons.forEach(btn => {
            const skill = btn.dataset.skill;
            const canUse = this.canUseSkill(this.player, skill);
            btn.disabled = !canUse || this.gameOver || !this.player.alive || this.player.selectedSkill;
            btn.style.opacity = canUse ? '1' : '0.5';
        });
        
        document.getElementById('next-round').style.display = 
            (this.gameOver || (!this.player.alive || !this.ai.alive)) ? 'inline-block' : 'none';
    }

    endGame() {
        this.gameOver = true;
        const result = document.getElementById('result');
        const winner = document.getElementById('winner');
        
        if (!this.player.alive && !this.ai.alive) {
            winner.textContent = '平局！双方同归于尽！';
        } else if (!this.player.alive) {
            winner.textContent = '💀 你败北了！AI获胜！';
        } else {
            winner.textContent = '🎉 你获胜了！AI已阵亡！';
        }
        
        result.style.display = 'block';
        document.querySelectorAll('.skill').forEach(btn => btn.disabled = true);
    }

    prepareNextRound() {
        if (this.gameOver) {
            this.restart();
        }
    }

    restart() {
        this.player = { alive: true, mp: 0, selectedSkill: null };
        this.ai = { alive: true, mp: 0, selectedSkill: null };
        this.round = 1;
        this.gameOver = false;
        document.getElementById('player-log-content').innerHTML = '';
        document.getElementById('ai-log-content').innerHTML = '';
        document.getElementById('result').style.display = 'none';
        document.querySelectorAll('.skill').forEach(btn => btn.disabled = false);
        this.clearSelections();
        this.updateUI();
        this.addBothLog('游戏重新开始！');
    }
}

window.addEventListener('DOMContentLoaded', () => new YuanQiGame());
