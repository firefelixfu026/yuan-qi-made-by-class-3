class YuanQiGame {
    constructor() {
        this.players = {
            1: { hp: 10, mp: 0, selectedSkill: null },
            2: { hp: 10, mp: 0, selectedSkill: null }
        };
        this.round = 1;
        this.gameOver = false;
        this.skills = {
            ramen: { name: '拉面', mp: 2, damage: 0, type: 'magic', defense: null },
            slash: { name: '一斩', mp: 0, damage: 0.5, type: 'slash', defense: null },
            Ldef: { name: 'L防', mp: 1, damage: 0, type: 'defense', defense: 'slash' },
            wave: { name: '波', mp: 2, damage: 2, type: 'wave', defense: null },
            Xdef: { name: 'X防', mp: 1, damage: 0, type: 'defense', defense: 'wave' }
        };
        this.logs = [];
        this.init();
    }

    init() {
        this.bindEvents();
        this.updateUI();
    }

    bindEvents() {
        document.querySelectorAll('.skill').forEach(btn => {
            btn.addEventListener('click', (e) => this.selectSkill(e));
        });
        document.getElementById('restart').addEventListener('click', () => this.restart());
    }

    selectSkill(e) {
        if (this.gameOver) return;
        
        const player = parseInt(e.target.dataset.player);
        const skill = e.target.dataset.skill;
        
        if (!this.canUseSkill(player, skill)) {
            this.addLog(`玩家 ${player} 魔力不足，无法使用 ${this.skills[skill].name}！`, 'damage');
            return;
        }
        
        this.players[player].selectedSkill = skill;
        this.highlightSelection(player, skill);
        this.checkBothSelected();
    }

    canUseSkill(player, skill) {
        const skillData = this.skills[skill];
        return this.players[player].mp >= skillData.mp;
    }

    highlightSelection(player, skill) {
        const container = document.getElementById(`skills${player}`);
        container.querySelectorAll('.skill').forEach(btn => btn.classList.remove('selected'));
        container.querySelector(`[data-skill="${skill}"]`).classList.add('selected');
    }

    checkBothSelected() {
        if (this.players[1].selectedSkill && this.players[2].selectedSkill) {
            setTimeout(() => this.resolveRound(), 500);
        }
    }

    resolveRound() {
        const skill1 = this.skills[this.players[1].selectedSkill];
        const skill2 = this.skills[this.players[2].selectedSkill];
        
        this.addLog(`=== 第 ${this.round} 回合 ===`, 'magic');
        this.addLog(`玩家1使用 ${skill1.name}，玩家2使用 ${skill2.name}`, 'magic');
        
        this.applySkill(1, skill1, 2, skill2);
        this.applySkill(2, skill2, 1, skill1);
        
        this.players[1].selectedSkill = null;
        this.players[2].selectedSkill = null;
        
        this.clearSelections();
        this.updateUI();
        this.round++;
        
        if (this.players[1].hp <= 0 || this.players[2].hp <= 0) {
            this.endGame();
        }
    }

    applySkill(player, skill, opponent, opponentSkill) {
        const p = this.players[player];
        const opp = this.players[opponent];
        const oppSkill = opponentSkill;
        
        p.mp += skill.mp;
        
        if (skill.damage > 0) {
            let damage = skill.damage;
            let blocked = false;
            
            if (oppSkill.type === 'defense') {
                if (oppSkill.defense === skill.type) {
                    blocked = true;
                    this.addLog(`玩家${opponent}使用${oppSkill.name}完全防御了玩家${player}的${skill.name}！`, 'defense');
                } else if (skill.type === 'wave' && oppSkill.defense === 'slash') {
                    damage *= 2;
                    this.addLog(`玩家${opponent}的${oppSkill.name}无法防御波类伤害，${skill.name}伤害加倍！`, 'damage');
                } else if (skill.type === 'slash' && oppSkill.defense === 'wave') {
                    this.addLog(`玩家${opponent}的${oppSkill.name}无法防御斩类伤害！`, 'damage');
                }
            }
            
            if (!blocked) {
                opp.hp -= damage;
                this.addLog(`玩家${player}的${skill.name}对玩家${opponent}造成 ${damage} 点伤害！`, 'damage');
            }
        } else {
            this.addLog(`玩家${player}使用${skill.name}，获得 ${skill.mp} 点魔力`, 'magic');
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
        document.getElementById('hp1').textContent = Math.max(0, this.players[1].hp);
        document.getElementById('hp2').textContent = Math.max(0, this.players[2].hp);
        document.getElementById('mp1').textContent = this.players[1].mp;
        document.getElementById('mp2').textContent = this.players[2].mp;
        document.getElementById('round').textContent = this.round;
        
        document.getElementById('round-status').textContent = 
            this.players[1].selectedSkill && this.players[2].selectedSkill 
                ? '结算中...' 
                : `第 ${this.round} 回合 - 双方请出招`;
    }

    endGame() {
        this.gameOver = true;
        const result = document.getElementById('result');
        const winner = document.getElementById('winner');
        
        if (this.players[1].hp <= 0 && this.players[2].hp <= 0) {
            winner.textContent = '平局！双方同归于尽！';
        } else if (this.players[1].hp <= 0) {
            winner.textContent = '🎉 玩家 2 获胜！';
        } else {
            winner.textContent = '🎉 玩家 1 获胜！';
        }
        
        result.style.display = 'block';
        document.querySelectorAll('.skill').forEach(btn => btn.disabled = true);
    }

    restart() {
        this.players = {
            1: { hp: 10, mp: 0, selectedSkill: null },
            2: { hp: 10, mp: 0, selectedSkill: null }
        };
        this.round = 1;
        this.gameOver = false;
        this.logs = [];
        document.getElementById('log-content').innerHTML = '';
        document.getElementById('result').style.display = 'none';
        document.querySelectorAll('.skill').forEach(btn => btn.disabled = false);
        this.clearSelections();
        this.updateUI();
        this.addLog('游戏重新开始！', 'magic');
    }
}

window.addEventListener('DOMContentLoaded', () => new YuanQiGame());
