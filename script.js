// ==========================================
// 1. 遊戲狀態與初始化
// ==========================================
const gameState = {
    currentSlide: 0,
    puzzleAnswers: ['2163', '340', '超大優惠', 'JESSIE'], 
    solvedPuzzles: [false, false, false, false], 
    solutions: [
        '你點亮了第一段記憶......',
        '你點亮了第二段記憶......',
        '你點亮了第三段記憶......',
        '恭喜通關！' 
    ],
    finalUrlShown: false, // 是否已進入過禮堂
    currentSolveButton: null
};

// 初始化
window.addEventListener('DOMContentLoaded', function() {
    updateNavigation();
    setupEventListeners();
    loadGameState();
});

// ==========================================
// 2. 事件監聽設定
// ==========================================
function setupEventListeners() {
    const leftArrow = document.getElementById('leftArrow');
    const rightArrow = document.getElementById('rightArrow');
    if(leftArrow) leftArrow.addEventListener('click', () => navigate(-1));
    if(rightArrow) rightArrow.addEventListener('click', () => navigate(1));

    document.querySelectorAll('.hotspot').forEach(hotspot => {
        hotspot.addEventListener('click', function(e) {
            e.stopPropagation();
            const infoText = this.dataset.info;
            const imageUrl = this.dataset.clueImg;
            showInfo(infoText, imageUrl);
        });
    });

    document.querySelectorAll('.solve-button').forEach(button => {
        button.addEventListener('click', function() {
            const slideIndex = parseInt(this.dataset.slide);
            gameState.currentSolveButton = this; 
            
            if (gameState.solvedPuzzles[slideIndex]) {
                if (slideIndex === 3) {
                    showTrueEnding();
                } else {
                    showSolution(slideIndex);
                }
            } else {
                showPuzzleInput(slideIndex);
            }
        });
    });

    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal(this.id);
            }
        });
    });

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
    
    // 定義最大頁數：已解鎖為3 (第四關)，未解鎖為2 (第三關)
    const maxSlide = gameState.finalUrlShown ? 3 : 2;

    if (newSlide < 0) {
        newSlide = maxSlide; 
    } else if (newSlide > maxSlide) {
        newSlide = 0; 
    }
    
    gameState.currentSlide = newSlide;
    updateSlidePosition();
    updateNavigation();
}

function updateSlidePosition() {
    const wrapper = document.getElementById('slidesWrapper');
    if(wrapper) {
        // 因為有 4 張圖，寬度 400%，每次移動 25%
        wrapper.style.transform = `translateX(-${gameState.currentSlide * 25}%)`;
    }
    document.querySelectorAll('.indicator-dot').forEach((dot, index) => {
        if (index === gameState.currentSlide) dot.classList.add('active');
        else dot.classList.remove('active');
    });
}

function updateNavigation() {
    const leftArrow = document.getElementById('leftArrow');
    const rightArrow = document.getElementById('rightArrow');
    if(leftArrow) leftArrow.classList.remove('hidden');
    if(rightArrow) rightArrow.classList.remove('hidden');
}

function showInfo(text, imageUrl) {
    const infoModal = document.getElementById('infoModal');
    const clueImagePlaceholder = document.getElementById('clueImagePlaceholder');
    const infoTextElement = document.getElementById('infoText');

    if(infoTextElement) infoTextElement.innerHTML = text;
    
    if(clueImagePlaceholder) {
        clueImagePlaceholder.innerHTML = ''; 
        if (imageUrl && imageUrl.trim() !== '') {
            const img = document.createElement('img');
            img.src = imageUrl;
            img.alt = '線索圖片';
            clueImagePlaceholder.appendChild(img);
            clueImagePlaceholder.classList.remove('hidden');
            clueImagePlaceholder.style.display = 'block'; 
        } else {
            clueImagePlaceholder.classList.add('hidden');
            clueImagePlaceholder.style.display = 'none'; 
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

    const placeholderText = gameState.currentSolveButton 
        ? gameState.currentSolveButton.dataset.placeholder 
        : '請輸入答案';

    const questionElement = document.getElementById('puzzleQuestion');
    if(questionElement) questionElement.textContent = questionText; 
    
    const inputElement = document.getElementById('answerInput');
    if(inputElement) {
        inputElement.value = '';
        inputElement.placeholder = placeholderText; 
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
        gameState.solvedPuzzles[gameState.currentPuzzleIndex] = true;
        saveGameState();
        updateSolveButton(gameState.currentPuzzleIndex);
        closeModal('puzzleModal');
        
        if (gameState.currentPuzzleIndex === 3) {
            showTrueEnding(); 
        } else {
            showSolution(gameState.currentPuzzleIndex); 
            checkAllPuzzlesSolved(); 
        }
    } else {
        const hintElement = document.getElementById('hintMessage');
        if(hintElement) hintElement.classList.add('show');
        inputElement.value = '';
        inputElement.focus();
    }
}

function checkAllPuzzlesSolved() {
    const firstThreeSolved = gameState.solvedPuzzles.slice(0, 3).every(solved => solved === true);
    
    // 如果解完前三關，且還沒開啟過第四關
    if (firstThreeSolved && !gameState.finalUrlShown) {
        saveGameState();
        setTimeout(() => {
            showFinalAnswer(); 
        }, 1000);
    }
}

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

function showTrueEnding() {
    const modal = document.getElementById('trueEndingModal');
    if(modal) modal.classList.add('active');
}

// 點擊「走入禮堂」後的解鎖動作
function enterGrandFinale() {
    closeModal('finalModal');
    
    // 1. 設定為已解鎖
    gameState.finalUrlShown = true;
    saveGameState();

    // 2. 顯示第四個指示點
    const indicatorContainer = document.querySelector('.slide-indicator');
    if(indicatorContainer) indicatorContainer.classList.add('unlocked');

    // 3. 滑動到第 4 張投影片
    gameState.currentSlide = 3;
    updateSlidePosition();
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

function loadGameState() {
    const saved = localStorage.getItem('puzzleGameState');
    if (saved) {
        const state = JSON.parse(saved);
        if (state.solvedPuzzles.length < gameState.solvedPuzzles.length) {
            const diff = gameState.solvedPuzzles.length - state.solvedPuzzles.length;
            for(let i=0; i<diff; i++) state.solvedPuzzles.push(false);
        }
        
        gameState.solvedPuzzles = state.solvedPuzzles;
        gameState.finalUrlShown = state.finalUrlShown || false;
        
        gameState.solvedPuzzles.forEach((solved, index) => {
            if (solved) updateSolveButton(index);
        });

        // 檢查是否已解鎖第四關
        if (gameState.finalUrlShown) {
            const indicatorContainer = document.querySelector('.slide-indicator');
            if(indicatorContainer) indicatorContainer.classList.add('unlocked');
        } else {
            // 如果還沒解鎖，但三關已過，提示玩家進入
            const firstThreeSolved = gameState.solvedPuzzles.slice(0, 3).every(s => s === true);
            if (firstThreeSolved) {
                 setTimeout(() => showFinalAnswer(), 500);
            }
        }
    }
}

// ==========================================
// 6. 開場打字動畫邏輯
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

    if(!textElement || !overlay) return;

    if (localStorage.getItem('hasPlayedIntro')) {
        overlay.style.display = 'none';
        document.body.style.overflow = ''; 
        return; 
    }

    document.body.style.overflow = 'hidden';

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

    textElement.style.opacity = '0';
    if(cursorElement) cursorElement.style.opacity = '0';

    await new Promise(resolve => setTimeout(resolve, 1000));

    if(btnElement) {
        btnElement.style.display = 'block';
        requestAnimationFrame(() => {
            btnElement.style.opacity = '1';
        });

        btnElement.addEventListener('click', function() {
            localStorage.setItem('hasPlayedIntro', 'true');
            overlay.classList.add('overlay-hidden');
            document.body.style.overflow = '';
            setTimeout(() => {
                overlay.style.display = 'none';
            }, 1500); 
        });
    }
}

// 只要 HTML 讀完就開始動畫，不用等圖片
document.addEventListener('DOMContentLoaded', startTypingAnimation);
