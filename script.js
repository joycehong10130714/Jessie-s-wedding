// ==========================================
// 1. 遊戲狀態與初始化
// ==========================================
const gameState = {
    currentSlide: 0,
    puzzleAnswers: ['2163', '180', '超大優惠'], // 答案
    solvedPuzzles: [false, false, false], // 解謎狀態
    solutions: [
        '你點亮了第一段記憶......',
        '你點亮了第二段記憶......',
        '你點亮了第三段記憶......'
    ],
    finalUrlShown: false,
    currentSolveButton: null
};

// 初始化
window.addEventListener('DOMContentLoaded', function() {
    updateNavigation();
    setupEventListeners();
    loadGameState();
    // 注意：開場動畫改由 window.load 觸發，寫在檔案最下方
});

// ==========================================
// 2. 事件監聽設定
// ==========================================
function setupEventListeners() {
    // 左右箭頭
    const leftArrow = document.getElementById('leftArrow');
    const rightArrow = document.getElementById('rightArrow');
    if(leftArrow) leftArrow.addEventListener('click', () => navigate(-1));
    if(rightArrow) rightArrow.addEventListener('click', () => navigate(1));

    // 熱點點擊
    document.querySelectorAll('.hotspot').forEach(hotspot => {
        hotspot.addEventListener('click', function(e) {
            e.stopPropagation();
            const infoText = this.dataset.info;
            const imageUrl = this.dataset.clueImg;
            showInfo(infoText, imageUrl);
        });
    });

    // 解謎按鈕
    document.querySelectorAll('.solve-button').forEach(button => {
        button.addEventListener('click', function() {
            const slideIndex = parseInt(this.dataset.slide);
            gameState.currentSolveButton = this; 
            
            if (gameState.solvedPuzzles[slideIndex]) {
                showSolution(slideIndex);
            } else {
                showPuzzleInput(slideIndex);
            }
        });
    });

    // 點擊彈窗外部關閉
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal(this.id);
            }
        });
    });

    // 觸控滑動支援
    let touchStartX = 0;
    let touchEndX = 0;
    const wrapper = document.getElementById('slidesWrapper');

    if(wrapper) {
        wrapper.addEventListener('touchstart', function(e) {
            touchStartX = e.changedTouches[0].screenX;
        });

        wrapper.addEventListener('touchend', function(e) {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        });
    }

    function handleSwipe() {
        const swipeThreshold = 50;
        if (touchStartX - touchEndX > swipeThreshold) navigate(1);
        if (touchEndX - touchStartX > swipeThreshold) navigate(-1);
    }

    // Enter 鍵提交答案
    const answerInput = document.getElementById('answerInput');
    if(answerInput) {
        answerInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') checkAnswer();
        });
    }
}

// ==========================================
// 3. 導航與顯示邏輯
// ==========================================
function navigate(direction) {
    let newSlide = gameState.currentSlide + direction;
    
    // 無限循環邏輯
    if (newSlide < 0) {
        newSlide = 2; 
    } else if (newSlide > 2) {
        newSlide = 0; 
    }
    
    gameState.currentSlide = newSlide;
    updateSlidePosition();
    updateNavigation();
}

function updateSlidePosition() {
    const wrapper = document.getElementById('slidesWrapper');
    if(wrapper) {
        wrapper.style.transform = `translateX(-${gameState.currentSlide * 33.333}%)`;
    }
    
    document.querySelectorAll('.indicator-dot').forEach((dot, index) => {
        if (index === gameState.currentSlide) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });
}

function updateNavigation() {
    const leftArrow = document.getElementById('leftArrow');
    const rightArrow = document.getElementById('rightArrow');
    if(leftArrow) leftArrow.classList.remove('hidden');
    if(rightArrow) rightArrow.classList.remove('hidden');
}

// 顯示熱點資訊
function showInfo(text, imageUrl) {
    const infoModal = document.getElementById('infoModal');
    const clueImagePlaceholder = document.getElementById('clueImagePlaceholder');

    // 設定文字 (支援 HTML 顏色)
    const infoTextElement = document.getElementById('infoText');
    if(infoTextElement) infoTextElement.innerHTML = text;
    
    // 處理圖片 (如果沒有 imageUrl 則清空)
    if(clueImagePlaceholder) {
        clueImagePlaceholder.innerHTML = ''; 
        // 只有當 imageUrl 不為空字串時才建立圖片
        if (imageUrl && imageUrl !== '') {
            const img = document.createElement('img');
            img.src = imageUrl;
            img.alt = '線索圖片';
            clueImagePlaceholder.appendChild(img);
        }
    }

    if(infoModal) infoModal.classList.add('active');
}

// ==========================================
// 4. 解謎邏輯
// ==========================================
function showPuzzleInput(slideIndex) {
    gameState.currentPuzzleIndex = slideIndex;
    
    const questionText = gameState.currentSolveButton 
        ? gameState.currentSolveButton.dataset.question 
        : '請輸入你找到的答案';

    const questionElement = document.getElementById('puzzleQuestion');
    if(questionElement) questionElement.textContent = questionText; 
    
    const inputElement = document.getElementById('answerInput');
    if(inputElement) {
        inputElement.value = '';
        inputElement.focus();
    }

    const hintElement = document.getElementById('hintMessage');
    if(hintElement) hintElement.classList.remove('show');

    const modal = document.getElementById('puzzleModal');
    if(modal) modal.classList.add('active');
}

function checkAnswer() {
    const inputElement = document.getElementById('answerInput');
    if(!inputElement) return;

    const input = inputElement.value.trim().toUpperCase();
    const correctAnswer = gameState.puzzleAnswers[gameState.currentPuzzleIndex].toUpperCase();
    
    if (input === correctAnswer) {
        // 答案正確
        gameState.solvedPuzzles[gameState.currentPuzzleIndex] = true;
        saveGameState();
        updateSolveButton(gameState.currentPuzzleIndex);
        closeModal('puzzleModal');
        showSolution(gameState.currentPuzzleIndex);
        
        // 檢查是否所有謎題都已解開
        checkAllPuzzlesSolved();
    } else {
        // 答案錯誤
        const hintElement = document.getElementById('hintMessage');
        if(hintElement) hintElement.classList.add('show');
        inputElement.value = '';
        inputElement.focus();
    }
}

function checkAllPuzzlesSolved() {
    const allSolved = gameState.solvedPuzzles.every(solved => solved === true);
    
    if (allSolved && !gameState.finalUrlShown) {
        gameState.finalUrlShown = true;
        saveGameState();
        
        setTimeout(() => {
            showFinalAnswer();
        }, 1000);
    }
}

// 顯示最終謎底彈窗 (已修正：直接顯示 modal)
function showFinalAnswer() {
    const modal = document.getElementById('finalModal');
    if(modal) modal.classList.add('active');
}

function showSolution(slideIndex) {
    const textElement = document.getElementById('solutionText');
    if(textElement) textElement.textContent = gameState.solutions[slideIndex];
    
    const modal = document.getElementById('solutionModal');
    if(modal) modal.classList.add('active');
}

function updateSolveButton(slideIndex) {
    const button = document.querySelector(`.solve-button[data-slide="${slideIndex}"]`);
    if(button) {
        button.textContent = '解答';
        button.classList.add('solved');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if(modal) modal.classList.remove('active');
}

// ==========================================
// 5. 儲存與讀取狀態
// ==========================================
function saveGameState() {
    const state = {
        solvedPuzzles: gameState.solvedPuzzles,
        finalUrlShown: gameState.finalUrlShown
    };
    localStorage.setItem('puzzleGameState', JSON.stringify(state));
}

// 載入遊戲狀態
function loadGameState() {
    const saved = localStorage.getItem('puzzleGameState');
    if (saved) {
        const state = JSON.parse(saved);
        gameState.solvedPuzzles = state.solvedPuzzles;
        gameState.finalUrlShown = state.finalUrlShown || false;
        
        // 1. 恢復按鈕狀態
        gameState.solvedPuzzles.forEach((solved, index) => {
            if (solved) {
                updateSolveButton(index);
            }
        });

        // 2. [關鍵修正] 檢查是否全部解開
        // 如果重新整理後發現三個謎題都解開了，就自動再次顯示最終視窗，避免玩家卡關
        const allSolved = gameState.solvedPuzzles.every(s => s === true);
        if (allSolved) {
            // 稍微延遲 0.5 秒再跳出，體驗比較順暢
            setTimeout(() => {
                showFinalAnswer();
            }, 500);
        }
    }
}

// ==========================================
// 6. 開場打字動畫邏輯 (含 localStorage 檢查)
// ==========================================
const introLines = [
    "婚禮前一夜，",
    "由於既期待又緊張的關係，在床上翻來覆去難以入眠。",
    "突然，她聽到一個久違的聲音——彷彿是年幼的自己，在心裡輕輕呼喚。",
    "", 
    "「妳，還記得我嗎？」",
    "", 
    "她抬頭一看，沒見到任何人影，",
    "卻看到一條散發著微光的長廊。",
    "往前走去，這條長廊像是由記憶編織而成，",
    "左右閃爍的燈火是一段段鮮明的回憶。",
    "", 
    "她一步步走入光裡，並花了好些時候回顧，",
    "有時哭有時笑，不知不覺已經要天亮了，",
    "但這時她一回頭，發現長廊的入口已經闔起，",
    "所有其他的回憶消失了，一片漆黑，",
    "只剩三段快要熄滅的兒時回憶在眼前。",
    "", 
    "請各位將這三段回憶重新點亮吧！不然她要趕不上婚禮了。"
];

const typingSpeed = 60; 
const linePause = 500; 

async function startTypingAnimation() {
    const textElement = document.getElementById('typingText');
    const cursorElement = document.querySelector('.cursor');
    const btnElement = document.getElementById('enterGameBtn');
    const overlay = document.getElementById('introOverlay');

    // 0. 安全檢查
    if(!textElement || !overlay) return;

    // --- [關鍵新增] 檢查是否已經看過動畫 ---
    if (localStorage.getItem('hasPlayedIntro')) {
        overlay.style.display = 'none'; // 直接隱藏
        document.body.style.overflow = ''; // 恢復捲動
        return; // 結束函式，不執行打字
    }
    // ------------------------------------

    document.body.style.overflow = 'hidden';

    // 1. 開始打字
    for (let i = 0; i < introLines.length; i++) {
        const line = introLines[i];
        if (line === "") {
            textElement.innerHTML += '<br>';
            continue;
        }
        for (let char of line) {
            textElement.innerHTML += char;
            await new Promise(resolve => setTimeout(resolve, typingSpeed));
        }
        textElement.innerHTML += '<br>';
        await new Promise(resolve => setTimeout(resolve, linePause));
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    // 2. 文字與游標淡出
    textElement.style.opacity = '0';
    if(cursorElement) cursorElement.style.opacity = '0';

    await new Promise(resolve => setTimeout(resolve, 1000));

    // 3. 按鈕登場
    if(btnElement) {
        btnElement.style.display = 'block';
        requestAnimationFrame(() => {
            btnElement.style.opacity = '1';
        });

        btnElement.addEventListener('click', function() {
            // --- [關鍵新增] 記錄已看過 ---
            localStorage.setItem('hasPlayedIntro', 'true');
            // --------------------------

            overlay.classList.add('overlay-hidden');
            document.body.style.overflow = '';
            setTimeout(() => {
                overlay.style.display = 'none';
            }, 1500); 
        });
    }
}

// 在頁面完全載入後執行動畫檢查
window.addEventListener('load', startTypingAnimation);

// ==========================================
// 7. 結局相關功能
// ==========================================
function enterGrandFinale() {
    closeModal('finalModal');
    
    const finaleOverlay = document.getElementById('grandFinaleOverlay');
    if(finaleOverlay) {
        finaleOverlay.classList.add('active');
        setupFinaleHotspots();
    }
}

function setupFinaleHotspots() {
    const finaleHotspots = document.querySelectorAll('.finale-hotspot');
    
    finaleHotspots.forEach(hotspot => {
        // Clone node 移除舊監聽器，防止重複綁定
        const newHotspot = hotspot.cloneNode(true);
        hotspot.parentNode.replaceChild(newHotspot, hotspot);
        
        newHotspot.addEventListener('click', function(e) {
            e.stopPropagation();
            const infoText = this.dataset.info;
            // 傳入空字串作為圖片參數，這樣就不會顯示圖片
            showInfo(infoText, ''); 
        });
    });
}