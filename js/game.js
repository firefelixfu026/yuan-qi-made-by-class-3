class YuanQiGame {
    constructor() {
        this.player = { alive: true, mp: 0, selectedSkill: null };
        this.ai = { alive: true, mp: 0, selectedSkill: null };
        this.round = 1;
        this.gameOver = false;
        this.skills = {
            ramen: { name: '拉面', mpGain: 2, damage: 0, type: 'magic', defense: null },
            slash: { name: '一斩', mpCost: 0, damage: 0.5, type: 'slash', defense: null },
            Ldef: { name: 'L防', mpGain: 1, damage: 0, type: 'defense', defense: 'slash' },
            wave: { name: '波', mpCost: 2, damage: 2, type: 'wave', defense: null },
            Xdef: { name: 'X防', mpGain: 1, damage: 0, type: 'defense', defense: 'wave' }
        };
        this.logs = [];
        this.init();
    }

    init() {
        this.bindEvents();
        this.updateUI();
        this.addLog('游戏开始！玩家 vs AI', 'magic');
    }

    bindEvents() {
        document.querySelectorAll('#skills1 .skill').forEach(btn => {
            btn.addEventListener('click', (e) => this.selectSkill(e));
        });
        document.getElementById('restart').addEventListener('click', () => this.restart());
    }

    selectSkill(e) {
        if (this.gameOver || !this.player.alive) return;
        
        const skill = e.target.dataset.skill;
        
        if (!this.canUseSkill(this.player, skill)) {
            this.addLog(`魔力不足，无法使用 ${this.skills[skill].name}！需要 ${this.skills[skill].mpCost || 0} 点魔力`, 'damage');
            return;
        }
        
        this.player.selectedSkill = skill;
        this.highlightSelection(1, skill);
        this.addLog(`你选择了 ${this.skills[skill].name}`, 'magic');
        
        setTimeout(() => this.aiSelectSkill(), 800);
    }

    aiSelectSkill() {
        const availableSkills = Object.keys(this.skills).filter(skill => 
            this.canUseSkill(this.ai, skill)
        );
        
        if (availableSkills.length === 0) {
            this.ai.selectedSkill = 'ramen';
        } else {
            this.ai.selectedSkill = this.aiChooseSkill(availableSkills);
        }
        
        this.addLog(`AI选择了 ${this.skills[this.ai.selectedSkill].name}`, 'magic');
        this.highlightSelection(2, this.ai.selectedSkill);
        
        setTimeout(() => this.resolveRound(), 800);
    }

    aiChooseSkill(availableSkills) {
        const aiMp = this.ai.mp;
        const playerSelected = this.player.selectedSkill;
        
        if (playerSelected === 'slash') {
            if (availableSkills.includes('Ldef')) return 'Ldef';
            if (availableSkills.includes('Xdef')) return 'Xdef';
        }
        
        if (playerSelected === 'wave') {
            if (availableSkills.includes('Xdef')) return 'Xdef';
            if (availableSkills.includes('Ldef')) return 'Ldef';
        }
        
        if (aiMp >= 2 && availableSkills.includes('wave')) {
            return 'wave';
        }
        
        if (availableSkills.includes('slash')) {
            return 'slash';
        }
        
        if (availableSkills.includes('ramen')) {
            return 'ramen';
        }
        
        return availableSkills[Math.floor(Math.random() * availableSkills.length)];
    }

    canUseSkill(entity, skill) {
        const skillData = this.skills[skill];
        const cost = skillData.mpCost || 0;
        return entity.mp >= cost;
    }

    highlightSelection(player, skill) {
        const container = document.getElementById(`skills${player}`);
        container.querySelectorAll('.skill').forEach(btn => btn.classList.remove('selected'));
        container.querySelector(`[data-skill="${skill}"]`).classList.add('selected');
    }

    resolveRound() {
        const playerSkill = this.skills[this.player.selectedSkill];
        const aiSkill = this.skills[this.ai.selectedSkill];
        
        this.addLog(`=== 第 ${this.round} 回合 ===`, 'magic');
        this.addLog(`你使用 ${playerSkill.name}，AI使用 ${aiSkill.name}`, 'magic');
        
        const playerDamage = this.calculateDamage(playerSkill, aiSkill);
        const aiDamage = this.calculateDamage(aiSkill, playerSkill);
        
        this.addLog(`你的伤害: ${playerDamage}，AI的伤害: ${aiDamage}`, 'damage');
        
        if (playerDamage > aiDamage) {
            this.addLog(`你的伤害更高！AI受到伤害！`, 'damage');
            this.ai.alive = false;
        } else if (aiDamage > playerDamage) {
            this.addLog(`AI的伤害更高！你受到伤害！`, 'damage');
            this.player.alive = false;
        } else {
            this.addLog(`伤害相同，双方均未被命中！`, 'defense');
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
            this.addLog(`${defenseSkill.name}成功防御了${attackSkill.name}！`, 'defense');
            return 0;
        }
        
        return attackSkill.damage;
    }

    updateMana(skill, entity) {
        if (skill.mpGain) {
            entity.mp += skill.mpGain;
        }
        if (skill.mpCost) {
            entity.mp -= skill.mpCost;
        }
    }

    clearSelections() {
        document.querySelectorAll('.skill').forEach(btn => btn.classList.remove('selected'));
    }

    addLog(message, type) {
        this.logs.push({ message, type });
        const logContent = document.getElementById('log-content');
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        entry.textContent = message;
        logContent.appendChild(entry);
        logContent.parentElement.scrollTop = logContent.parentElement.scrollHeight;
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
            btn.disabled = !this.canUseSkill(this.player, skill) || this.gameOver;
        });
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

    restart() {
        this.player = { alive: true, mp: 0, selectedSkill: null };
        this.ai = { alive: true, mp: 0, selectedSkill: null };
        this.round = 1;
        this.gameOver = false;
        this.logs = [];
        document.getElementById('log-content').innerHTML = '';
        document.getElementById('result').style.display = 'none';
        document.querySelectorAll('.skill').forEach(btn => btn.disabled = false);
        this.clearSelections();
        this.updateUI();
        this.addLog('游戏重新开始！玩家 vs AI', 'magic');
    }
}

window.addEventListener('DOMContentLoaded', () => new YuanQiGame());
