/**
 * 《午後來訪》— 輕量互動視覺小說遊戲核心腳本
 * Vanilla JavaScript (ES6+), 無外部相依
 */

(function () {
  'use strict';

  /* ==========================================================================
     1. 音效合成器 (Web Audio API - 純原生生成，零外部音訊檔案)
     ========================================================================== */
  class SoundManager {
    constructor() {
      this.ctx = null;
      this.enabled = true;
    }

    init() {
      if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
      }
    }

    playTone(freq, type = 'sine', duration = 0.08, gainVal = 0.05) {
      if (!this.enabled) return;
      try {
        this.init();
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume();
        }
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
      } catch (e) {
        // Audio playback fallback
      }
    }

    playTypewriter() {
      // 輕微的打字敲擊聲
      this.playTone(520 + Math.random() * 80, 'triangle', 0.03, 0.015);
    }

    playChoiceChime() {
      // 選擇按鈕和弦音
      this.playTone(587.33, 'sine', 0.12, 0.06);
      setTimeout(() => this.playTone(880, 'sine', 0.18, 0.06), 70);
    }

    playHeartChime() {
      // 好感度增加歡快音
      this.playTone(523.25, 'triangle', 0.1, 0.06);
      setTimeout(() => this.playTone(659.25, 'triangle', 0.1, 0.06), 80);
      setTimeout(() => this.playTone(783.99, 'triangle', 0.15, 0.06), 160);
    }

    playClick() {
      this.playTone(400, 'sine', 0.05, 0.04);
    }
  }

  const sound = new SoundManager();

  /* ==========================================================================
     2. 遊戲劇本與分支資料 (Dialogue Script Tree)
     ========================================================================== */
  const DIALOGUE_NODES = {
    start: {
      speaker: '晴夏',
      role: '訪客',
      expression: 'happy',
      text: '你來啦！請進請進，快找個位子坐吧。',
      next: 'intro_2'
    },
    intro_2: {
      speaker: '晴夏',
      role: '訪客',
      expression: 'normal',
      text: '今天外面的陽光真好呢，微風吹起來特別舒服。',
      next: 'ask_day'
    },
    ask_day: {
      speaker: '晴夏',
      role: '訪客',
      expression: 'normal',
      text: '對了，你今天過得如何呢？',
      choices: [
        {
          text: '很充實，見到妳更開心了！',
          favorDelta: 10,
          next: 'answer_positive'
        },
        {
          text: '普普通通，就是平凡的一天。',
          favorDelta: 5,
          next: 'answer_neutral'
        },
        {
          text: '有點累，心情不太好……',
          favorDelta: -5,
          next: 'answer_negative'
        }
      ]
    },

    // 分支 1 反應
    answer_positive: {
      speaker: '晴夏',
      role: '訪客',
      expression: 'happy',
      text: '真的嗎？聽你這麼說，我心裡也暖洋洋的呢！',
      next: 'tea_scene'
    },
    answer_neutral: {
      speaker: '晴夏',
      role: '訪客',
      expression: 'normal',
      text: '平凡也是一種幸福呀，能平淡安穩地度過就很棒了。',
      next: 'tea_scene'
    },
    answer_negative: {
      speaker: '晴夏',
      role: '訪客',
      expression: 'confused',
      text: '辛苦你了……那待會好好喝杯熱茶，好好放鬆一下吧。',
      next: 'tea_scene'
    },

    // 泡茶場景
    tea_scene: {
      speaker: '晴夏',
      role: '訪客',
      expression: 'happy',
      text: '這是我剛剛泡好的洋甘菊茶，還加了一點點蜂蜜喔。',
      next: 'ask_activity'
    },
    ask_activity: {
      speaker: '晴夏',
      role: '訪客',
      expression: 'normal',
      text: '難得這麼悠閒，你想聊點什麼，還是一起做點什麼呢？',
      choices: [
        {
          text: '想聽妳聊聊最近讀的書。',
          favorDelta: 10,
          next: 'book_talk'
        },
        {
          text: '靜靜享受茶香和微風就好。',
          favorDelta: 5,
          next: 'quiet_enjoy'
        },
        {
          text: '其實我待會還有事情要忙……',
          favorDelta: -5,
          next: 'hurry_leave'
        }
      ]
    },

    // 分支 2 反應
    book_talk: {
      speaker: '晴夏',
      role: '訪客',
      expression: 'happy',
      text: '最近那本小說的主角在落櫻下重逢，真的很讓人感動呢！',
      next: 'book_talk_2'
    },
    book_talk_2: {
      speaker: '晴夏',
      role: '訪客',
      expression: 'shy',
      text: '如果你有興趣的話，等一下我借你帶回去看吧？',
      next: 'free_interaction'
    },

    quiet_enjoy: {
      speaker: '晴夏',
      role: '訪客',
      expression: 'normal',
      text: '也是呢，有時候什麼都不說，就是最舒適的陪伴了。',
      next: 'free_interaction'
    },

    hurry_leave: {
      speaker: '晴夏',
      role: '訪客',
      expression: 'confused',
      text: '啊……這樣啊，那……我們把這杯溫茶慢慢喝完吧。',
      next: 'free_interaction'
    },

    // 自由互動階段
    free_interaction: {
      speaker: '晴夏',
      role: '訪客',
      expression: 'normal',
      text: '茶還溫著呢。你可以四處看看，或者多跟我說說話？',
      choices: [
        {
          text: '「晴夏今天泡的茶真的很好喝。」',
          favorDelta: 10,
          next: 'tea_compliment'
        },
        {
          text: '「窗邊擺的那盆植物長得真漂亮。」',
          favorDelta: 5,
          next: 'plant_talk'
        },
        {
          text: '「（輕輕伸手戳戳晴夏）」',
          favorDelta: 0,
          next: 'prompt_touch'
        }
      ]
    },
    tea_compliment: {
      speaker: '晴夏',
      role: '訪客',
      expression: 'happy',
      text: '嘻嘻，這是我試過好幾種比例才泡出來的喔，你喜歡就好！',
      next: 'sunset_intro'
    },
    plant_talk: {
      speaker: '晴夏',
      role: '訪客',
      expression: 'normal',
      text: '每天看著綠葉在陽光下舒展，心情也會跟著平靜下來呢。',
      next: 'sunset_intro'
    },
    prompt_touch: {
      speaker: '晴夏',
      role: '訪客',
      expression: 'shy',
      text: '哇……突然戳我一下！真拿你沒辦法，不過我不討厭就是了。',
      next: 'sunset_intro'
    },

    // 黃昏轉折
    sunset_intro: {
      speaker: '晴夏',
      role: '訪客',
      expression: 'normal',
      text: '窗外的陽光漸漸染上一層橙黃色了呢……',
      next: 'sunset_2'
    },
    sunset_2: {
      speaker: '晴夏',
      role: '訪客',
      expression: 'shy',
      text: '不知不覺時間過得好快，今天能跟你在一起……真的很特別。',
      next: 'evaluate_ending'
    }
  };

  /* ==========================================================================
     3. 角色點擊互動台詞 (Interaction Responses)
     ========================================================================== */
  const CHARACTER_INTERACTIONS = {
    head: {
      normal: [
        '摸頭嗎？感覺有點癢癢的呢。',
        '哇，頭髮會被你弄亂啦……',
        '再摸的話……我也要伸手摸你的頭囉！'
      ],
      highFavor: '其實……如果是你摸的話，我一點都不討厭喔……',
      expressions: ['normal', 'shy', 'happy']
    },
    body: {
      normal: [
        '嗯？我的衣服上有沾到什麼東西嗎？',
        '等等，怎麼一直戳我啦……',
        '真是拿你沒辦法呢……不要鬧了啦。'
      ],
      highFavor: '和你在一起的時候，心跳總是跳得好快呢。',
      expressions: ['confused', 'shy', 'happy']
    },
    other: {
      normal: [
        '這張桌子和茶杯都是我特別挑選的喔。',
        '午後的陽光灑進來，感覺整個人都暖和起來了。',
        '有你在這裡陪我聊天，今天下午真的一點也不無聊。'
      ],
      highFavor: '看著窗外的微風，希望這個午後永遠不要結束。',
      expressions: ['normal', 'happy', 'shy']
    }
  };

  const IDLE_LINES = [
    { text: '你一直在看著我發呆呢……是在想什麼心事嗎？', expression: 'confused' },
    { text: '窗外的微風好舒服喔，讓人好想打個盹~', expression: 'happy' },
    { text: '桌上的洋甘菊茶要趁溫熱喝喔，涼了就可惜了。', expression: 'normal' },
    { text: '安靜的午後，只要身邊有你，就覺得很心安。', expression: 'shy' }
  ];

  /* ==========================================================================
     4. 遊戲狀態管理器 (State Manager)
     ========================================================================== */
  class GameState {
    constructor() {
      this.favorability = 50;
      this.currentNodeId = 'start';
      this.dialogueLogs = [];
      this.isTyping = false;
      this.currentTypingTimer = null;
      this.typeSpeed = 28; // ms per char
      this.autoPlay = false;
      this.autoPlayTimer = null;
      this.idleTimer = null;
      this.idleInterval = 15000; // 15s

      // 點擊次數與冷卻紀錄 (用於角色連續情緒反饋)
      this.clickCount = { head: 0, body: 0, other: 0 };
      this.lastClickTime = { head: 0, body: 0, other: 0 };
      this.isInteractingCooldown = false;
      this.currentDisplayedExpression = 'normal';

      this.loadFromStorage();
    }

    loadFromStorage() {
      try {
        const savedFavor = localStorage.getItem('afternoon_vn_favor');
        if (savedFavor !== null) {
          const val = parseInt(savedFavor, 10);
          if (!isNaN(val)) this.favorability = Math.max(0, Math.min(100, val));
        }

        const savedSpeed = localStorage.getItem('afternoon_vn_typespeed');
        if (savedSpeed !== null) {
          this.typeSpeed = parseInt(savedSpeed, 10);
        }

        const savedSound = localStorage.getItem('afternoon_vn_sound');
        if (savedSound !== null) {
          sound.enabled = savedSound === 'true';
        }
      } catch (e) {
        console.warn('LocalStorage error:', e);
      }
    }

    saveToStorage() {
      try {
        localStorage.setItem('afternoon_vn_favor', this.favorability.toString());
        localStorage.setItem('afternoon_vn_typespeed', this.typeSpeed.toString());
        localStorage.setItem('afternoon_vn_sound', sound.enabled.toString());
      } catch (e) {
        console.warn('LocalStorage save error:', e);
      }
    }

    clearStorage() {
      try {
        localStorage.removeItem('afternoon_vn_favor');
        localStorage.removeItem('afternoon_vn_typespeed');
        localStorage.removeItem('afternoon_vn_sound');
      } catch (e) {
        console.warn(e);
      }
    }

    addFavorability(delta) {
      const oldVal = this.favorability;
      this.favorability = Math.max(0, Math.min(100, this.favorability + delta));
      this.saveToStorage();
      return this.favorability - oldVal;
    }
  }

  /* ==========================================================================
     5. 遊戲主控制器 (Main Game Controller)
     ========================================================================== */
  class VisualNovelGame {
    constructor() {
      this.state = new GameState();

      // DOM 元素快取
      this.elements = {
        characterImg: document.getElementById('character-img'),
        characterContainer: document.getElementById('character-container'),
        feedbackBubble: document.getElementById('feedback-bubble'),
        speakerName: document.getElementById('speaker-name'),
        speakerRole: document.getElementById('speaker-role'),
        dialogueText: document.getElementById('dialogue-text'),
        continueIndicator: document.getElementById('continue-indicator'),
        dialogueBox: document.getElementById('dialogue-box'),
        choicesContainer: document.getElementById('choices-container'),
        favorValue: document.getElementById('favor-value'),
        favorBarFill: document.getElementById('favor-bar-fill'),
        heartIcon: document.getElementById('heart-icon'),
        
        // Modals
        endingModal: document.getElementById('ending-modal'),
        endingRibbon: document.getElementById('ending-ribbon'),
        endingTitle: document.getElementById('ending-title'),
        endingDesc: document.getElementById('ending-desc'),
        finalFavorScore: document.getElementById('final-favor-score'),
        endingCharacterImg: document.getElementById('ending-character-img'),
        btnEndingRestart: document.getElementById('btn-ending-restart'),

        logModal: document.getElementById('log-modal'),
        logList: document.getElementById('log-list'),
        btnLog: document.getElementById('btn-log'),
        btnCloseLog: document.getElementById('btn-close-log'),

        settingsModal: document.getElementById('settings-modal'),
        btnSettings: document.getElementById('btn-settings'),
        btnCloseSettings: document.getElementById('btn-close-settings'),
        settingTextSpeed: document.getElementById('setting-text-speed'),
        settingSound: document.getElementById('setting-sound'),
        settingAuto: document.getElementById('setting-auto'),
        btnClearStorage: document.getElementById('btn-clear-storage'),
        btnRestart: document.getElementById('btn-restart')
      };

      this.currentLineFullText = '';
      this.typewriterIndex = 0;
      this.bindEvents();
      this.updateFavorabilityUI(false);
      this.applySavedSettingsUI();
    }

    init() {
      this.goToNode('start');
      this.resetIdleTimer();
    }

    /* ------------------------------------------------------------------------
       事件綁定
       ------------------------------------------------------------------------ */
    bindEvents() {
      // 點擊對話框推進劇情或略過打字
      this.elements.dialogueBox.addEventListener('click', () => {
        this.resetIdleTimer();
        this.handleDialogueBoxClick();
      });

      // 鍵盤空白鍵 / Enter 推進
      window.addEventListener('keydown', (e) => {
        if (e.code === 'Space' || e.code === 'Enter') {
          // 如果沒有開啟任何 modal，推進對話
          if (this.elements.logModal.classList.contains('hidden') &&
              this.elements.settingsModal.classList.contains('hidden') &&
              this.elements.endingModal.classList.contains('hidden')) {
            e.preventDefault();
            this.resetIdleTimer();
            this.handleDialogueBoxClick();
          }
        }
      });

      // 角色熱點點擊互動 (Hotzones)
      document.querySelectorAll('.hotzone').forEach((zoneEl) => {
        zoneEl.addEventListener('click', (e) => {
          e.stopPropagation(); // 避免觸發底層對話框
          const zoneType = zoneEl.getAttribute('data-zone');
          this.handleCharacterClick(zoneType);
        });
      });

      // 工具列按鈕
      this.elements.btnLog.addEventListener('click', () => {
        sound.playClick();
        this.openLogModal();
      });

      this.elements.btnCloseLog.addEventListener('click', () => {
        sound.playClick();
        this.closeLogModal();
      });

      this.elements.btnSettings.addEventListener('click', () => {
        sound.playClick();
        this.openSettingsModal();
      });

      this.elements.btnCloseSettings.addEventListener('click', () => {
        sound.playClick();
        this.closeSettingsModal();
      });

      this.elements.btnRestart.addEventListener('click', () => {
        sound.playClick();
        if (confirm('確定要重新開始故事嗎？好感度將重置為 50。')) {
          this.restartGame();
        }
      });

      this.elements.btnEndingRestart.addEventListener('click', () => {
        sound.playClick();
        this.elements.endingModal.classList.add('hidden');
        this.restartGame();
      });

      // 設定選單事件
      this.elements.settingTextSpeed.addEventListener('change', (e) => {
        this.state.typeSpeed = parseInt(e.target.value, 10);
        this.state.saveToStorage();
      });

      this.elements.settingSound.addEventListener('change', (e) => {
        sound.enabled = e.target.checked;
        this.state.saveToStorage();
      });

      this.elements.settingAuto.addEventListener('change', (e) => {
        this.state.autoPlay = e.target.checked;
        if (this.state.autoPlay && !this.state.isTyping) {
          this.scheduleAutoNext();
        }
      });

      this.elements.btnClearStorage.addEventListener('click', () => {
        if (confirm('確定要清除所有存檔資料嗎？')) {
          this.state.clearStorage();
          this.state.favorability = 50;
          this.updateFavorabilityUI(false);
          alert('儲存資料已清除！');
        }
      });

      // 點擊 Modal 背景關閉
      [this.elements.logModal, this.elements.settingsModal].forEach((m) => {
        m.addEventListener('click', (e) => {
          if (e.target === m) {
            m.classList.add('hidden');
          }
        });
      });
    }

    applySavedSettingsUI() {
      this.elements.settingTextSpeed.value = this.state.typeSpeed.toString();
      this.elements.settingSound.checked = sound.enabled;
      this.elements.settingAuto.checked = this.state.autoPlay;
    }

    /* ------------------------------------------------------------------------
       劇情推進與打字機核心
       ------------------------------------------------------------------------ */
    goToNode(nodeId) {
      if (nodeId === 'evaluate_ending') {
        this.showEnding();
        return;
      }

      const node = DIALOGUE_NODES[nodeId];
      if (!node) {
        console.error('Node not found:', nodeId);
        return;
      }

      this.state.currentNodeId = nodeId;

      // 隱藏選項按鈕
      this.elements.choicesContainer.innerHTML = '';
      this.elements.choicesContainer.classList.add('hidden');

      // 更新發言者與表情
      this.elements.speakerName.textContent = node.speaker || '晴夏';
      this.elements.speakerRole.textContent = node.role || '訪客';

      if (node.expression) {
        this.setExpression(node.expression);
      }

      // 記錄到對話歷史
      this.addLog(node.speaker || '晴夏', node.text);

      // 開始打字效果
      this.typeText(node.text, () => {
        // 打字完成後處理選項或自動播放
        if (node.choices && node.choices.length > 0) {
          this.renderChoices(node.choices);
        } else if (this.state.autoPlay) {
          this.scheduleAutoNext();
        }
      });
    }

    typeText(text, onComplete) {
      this.clearTyping();
      this.state.isTyping = true;
      this.currentLineFullText = text;
      this.typewriterIndex = 0;
      this.elements.dialogueText.textContent = '';
      this.elements.continueIndicator.classList.remove('visible');

      // 若設定為瞬間顯示 (speed = 0)
      if (this.state.typeSpeed === 0) {
        this.elements.dialogueText.textContent = text;
        this.state.isTyping = false;
        this.elements.continueIndicator.classList.add('visible');
        if (onComplete) onComplete();
        return;
      }

      const step = () => {
        if (!this.state.isTyping) return;

        if (this.typewriterIndex < text.length) {
          this.elements.dialogueText.textContent += text.charAt(this.typewriterIndex);
          this.typewriterIndex++;

          // 播放打字聲音（每隔兩字或標點發聲避免雜音）
          if (this.typewriterIndex % 2 === 0) {
            sound.playTypewriter();
          }

          this.state.currentTypingTimer = setTimeout(step, this.state.typeSpeed);
        } else {
          this.state.isTyping = false;
          this.elements.continueIndicator.classList.add('visible');
          if (onComplete) onComplete();
        }
      };

      step();
    }

    clearTyping() {
      if (this.state.currentTypingTimer) {
        clearTimeout(this.state.currentTypingTimer);
        this.state.currentTypingTimer = null;
      }
      if (this.state.autoPlayTimer) {
        clearTimeout(this.state.autoPlayTimer);
        this.state.autoPlayTimer = null;
      }
    }

    completeTypingInstantly() {
      this.clearTyping();
      this.elements.dialogueText.textContent = this.currentLineFullText;
      this.state.isTyping = false;
      this.elements.continueIndicator.classList.add('visible');

      const node = DIALOGUE_NODES[this.state.currentNodeId];
      if (node && node.choices && node.choices.length > 0) {
        this.renderChoices(node.choices);
      } else if (this.state.autoPlay) {
        this.scheduleAutoNext();
      }
    }

    handleDialogueBoxClick() {
      // 若正在打字，立即顯示整行
      if (this.state.isTyping) {
        this.completeTypingInstantly();
        return;
      }

      const node = DIALOGUE_NODES[this.state.currentNodeId];
      if (!node) return;

      // 若目前有選項等待選擇，點擊對話框不推進
      if (node.choices && node.choices.length > 0) {
        return;
      }

      // 前往下一個節點
      if (node.next) {
        sound.playClick();
        this.goToNode(node.next);
      }
    }

    scheduleAutoNext() {
      if (!this.state.autoPlay) return;
      this.clearTyping();
      this.state.autoPlayTimer = setTimeout(() => {
        const node = DIALOGUE_NODES[this.state.currentNodeId];
        if (node && node.next && (!node.choices || node.choices.length === 0)) {
          this.goToNode(node.next);
        }
      }, 2200);
    }

    /* ------------------------------------------------------------------------
       選項渲染與選擇處理
       ------------------------------------------------------------------------ */
    renderChoices(choices) {
      this.elements.choicesContainer.innerHTML = '';
      this.elements.choicesContainer.classList.remove('hidden');

      choices.forEach((choice) => {
        const btn = document.createElement('button');
        btn.className = 'choice-btn';
        btn.innerHTML = `
          <span>${choice.text}</span>
          <span class="choice-arrow">➜</span>
        `;

        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.handleChoiceSelect(choice);
        });

        this.elements.choicesContainer.appendChild(btn);
      });
    }

    handleChoiceSelect(choice) {
      sound.playChoiceChime();

      // 記錄玩家選擇至 LOG
      this.addLog('玩家', `「${choice.text}」`);

      // 增減好感度
      if (choice.favorDelta !== undefined) {
        this.state.addFavorability(choice.favorDelta);
        this.updateFavorabilityUI(true);

        if (choice.favorDelta > 0) {
          sound.playHeartChime();
        }
      }

      // 跳轉下一節點
      if (choice.next) {
        this.goToNode(choice.next);
      }
    }

    /* ------------------------------------------------------------------------
       角色表情切換 (Expression System)
       ------------------------------------------------------------------------ */
    setExpression(expressionName) {
      const validExpressions = ['normal', 'happy', 'confused', 'shy'];
      const targetExp = validExpressions.includes(expressionName) ? expressionName : 'normal';

      if (this.state.currentDisplayedExpression === targetExp) return;

      this.state.currentDisplayedExpression = targetExp;
      this.elements.characterImg.classList.add('character-fade');

      setTimeout(() => {
        this.elements.characterImg.src = `assets/character/${targetExp}.png`;
        this.elements.characterImg.onload = () => {
          this.elements.characterImg.classList.remove('character-fade');
        };
      }, 150);
    }

    /* ------------------------------------------------------------------------
       角色點擊互動 (Emotional Escalation & Easter Eggs)
       ------------------------------------------------------------------------ */
    handleCharacterClick(zone) {
      if (this.state.isInteractingCooldown) return;
      this.state.isInteractingCooldown = true;

      this.resetIdleTimer();
      const now = Date.now();

      // 超過 6 秒未點擊重置連擊情緒
      if (now - this.state.lastClickTime[zone] > 6000) {
        this.state.clickCount[zone] = 0;
      }

      this.state.clickCount[zone]++;
      this.state.lastClickTime[zone] = now;

      const clickLevel = Math.min(this.state.clickCount[zone] - 1, 2);
      const zoneData = CHARACTER_INTERACTIONS[zone] || CHARACTER_INTERACTIONS.other;

      let lineText = '';
      let expression = zoneData.expressions[clickLevel] || 'normal';

      // 隱藏對話彩蛋 (好感度 >= 70)
      if (this.state.favorability >= 70 && Math.random() > 0.45) {
        lineText = zoneData.highFavor;
        expression = 'shy';
        sound.playHeartChime();
        this.showFloatingBubble('♥ 心動加溫 ♥');
      } else {
        lineText = zoneData.normal[clickLevel];
        sound.playTone(600 + clickLevel * 60, 'sine', 0.08, 0.04);
      }

      // 切換表情並覆寫對話框發言
      this.setExpression(expression);
      this.elements.speakerName.textContent = '晴夏';
      this.elements.speakerRole.textContent = '互動';
      this.addLog('晴夏 (互動)', lineText);
      this.typeText(lineText);

      // 冷卻時間解除 (1.5s)
      setTimeout(() => {
        this.state.isInteractingCooldown = false;
      }, 1500);
    }

    showFloatingBubble(text) {
      this.elements.feedbackBubble.textContent = text;
      this.elements.feedbackBubble.classList.remove('hidden');
      setTimeout(() => {
        this.elements.feedbackBubble.classList.add('hidden');
      }, 2000);
    }

    /* ------------------------------------------------------------------------
       主動互動 / 閒置對話 (Idle System: 15s)
       ------------------------------------------------------------------------ */
    resetIdleTimer() {
      if (this.state.idleTimer) {
        clearTimeout(this.state.idleTimer);
      }

      this.state.idleTimer = setTimeout(() => {
        this.triggerIdleDialogue();
      }, this.state.idleInterval);
    }

    triggerIdleDialogue() {
      // 若正在打字或有彈出視窗則不打擾
      if (this.state.isTyping ||
          !this.elements.endingModal.classList.contains('hidden') ||
          !this.elements.logModal.classList.contains('hidden') ||
          !this.elements.settingsModal.classList.contains('hidden')) {
        this.resetIdleTimer();
        return;
      }

      const randomEntry = IDLE_LINES[Math.floor(Math.random() * IDLE_LINES.length)];
      this.setExpression(randomEntry.expression);
      this.elements.speakerName.textContent = '晴夏';
      this.elements.speakerRole.textContent = '發呆中';

      this.addLog('晴夏 (主動)', randomEntry.text);
      this.typeText(randomEntry.text);

      this.resetIdleTimer();
    }

    /* ------------------------------------------------------------------------
       好感度 UI 更新
       ------------------------------------------------------------------------ */
    updateFavorabilityUI(animateHeart = true) {
      const favor = this.state.favorability;
      this.elements.favorValue.textContent = favor;
      this.elements.favorBarFill.style.width = `${favor}%`;

      if (animateHeart) {
        this.elements.heartIcon.classList.remove('heart-pulse');
        // trigger reflow
        void this.elements.heartIcon.offsetWidth;
        this.elements.heartIcon.classList.add('heart-pulse');
      }
    }

    /* ------------------------------------------------------------------------
       結局系統 (Endings Evaluation)
       ------------------------------------------------------------------------ */
    showEnding() {
      this.clearTyping();
      const favor = this.state.favorability;

      let endingTitle = '';
      let endingDesc = '';
      let endingExp = 'normal';
      let ribbonText = '結局達成';

      if (favor >= 80) {
        ribbonText = '★ 完美牽絆 ★';
        endingTitle = '【特別結局：約定明日的午後】';
        endingExp = 'shy';
        endingDesc = '晴夏臉頰微紅，輕輕拉住你的衣角：「那個……明天這個時候，你還會再來找我嗎？……我會一直等你的，我們約定好了喔！」午後的陽光柔和地落在兩人之間，溫暖而深刻。';
      } else if (favor >= 40) {
        ribbonText = '◆ 溫馨告別 ◆';
        endingTitle = '【普通結局：溫暖的午後茶聚】';
        endingExp = 'happy';
        endingDesc = '晴夏微笑著向你揮揮手：「今天能和你一起喝茶聊天，真的很愉快喔。回去的路上要小心，期待下次再見！」平凡而充實的午後，在舒心的茶香中畫下句點。';
      } else {
        ribbonText = '● 淡然離去 ●';
        endingTitle = '【冷淡結局：短暫的沈默告別】';
        endingExp = 'confused';
        endingDesc = '晴夏稍微整理了一下桌面，語氣帶著些許客氣：「時間差不多了呢……今天謝謝你特地過來。回去好好休息吧。」彼此之間似乎還留著些許距離感。';
      }

      this.elements.endingRibbon.textContent = ribbonText;
      this.elements.endingTitle.textContent = endingTitle;
      this.elements.endingDesc.textContent = endingDesc;
      this.elements.finalFavorScore.textContent = favor;
      this.elements.endingCharacterImg.src = `assets/character/${endingExp}.png`;

      this.addLog('系統', `達成結局：${endingTitle}（最終好感度：${favor}）`);

      // 顯示結局 Modal
      this.elements.endingModal.classList.remove('hidden');
      sound.playHeartChime();
    }

    /* ------------------------------------------------------------------------
       對話記錄 (LOG) 管理
       ------------------------------------------------------------------------ */
    addLog(speaker, text) {
      this.state.dialogueLogs.push({ speaker, text, time: new Date() });
    }

    openLogModal() {
      this.elements.logList.innerHTML = '';
      if (this.state.dialogueLogs.length === 0) {
        this.elements.logList.innerHTML = '<div style="color:#8E7A6B; text-align:center; padding:20px;">尚無對話記錄。</div>';
      } else {
        this.state.dialogueLogs.forEach((item) => {
          const entry = document.createElement('div');
          entry.className = 'log-entry';

          const isPlayer = item.speaker === '玩家';
          entry.innerHTML = `
            <div class="log-speaker ${isPlayer ? 'player' : ''}">${item.speaker}</div>
            <div class="log-text">${item.text}</div>
          `;
          this.elements.logList.appendChild(entry);
        });
      }

      this.elements.logModal.classList.remove('hidden');
      // 自動捲動到底部
      this.elements.logList.scrollTop = this.elements.logList.scrollHeight;
    }

    closeLogModal() {
      this.elements.logModal.classList.add('hidden');
    }

    /* ------------------------------------------------------------------------
       設定與重新開始
       ------------------------------------------------------------------------ */
    openSettingsModal() {
      this.elements.settingsModal.classList.remove('hidden');
    }

    closeSettingsModal() {
      this.elements.settingsModal.classList.add('hidden');
    }

    restartGame() {
      this.clearTyping();
      this.state.favorability = 50;
      this.state.dialogueLogs = [];
      this.state.clickCount = { head: 0, body: 0, other: 0 };
      this.state.saveToStorage();
      this.updateFavorabilityUI(false);
      this.init();
    }
  }

  // DOM 載入後啟動遊戲
  document.addEventListener('DOMContentLoaded', () => {
    const game = new VisualNovelGame();
    game.init();
  });

})();

