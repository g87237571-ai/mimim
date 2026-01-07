// Game State
const gameState = {
    balance: 1000,
    baseHashrate: 1.0,
    efficiency: 100,
    lastCollectTime: null,
    miningProgress: 0,
    upgrades: {
        mini: { count: 0, cost: 500, boost: 0.5 },
        medium: { count: 0, cost: 2000, boost: 2.0 },
        large: { count: 0, cost: 5000, boost: 5.0 },
        logistics: { count: 0, cost: 1000, boost: 0.1 }
    },
    dailyBonus: {
        lastClaimed: null,
        streak: 0,
        claimedDays: []
    },
    achievements: {
        firstCollect: { achieved: false, date: null },
        dailyStreak7: { achieved: false, streak: 0 },
        factoryOwner: { achieved: false, factories: 0 },
        marmaladeMaster: { achieved: false, total: 0 }
    }
};

// DOM Elements
const balanceEl = document.getElementById('balance');
const hashrateEl = document.getElementById('hashrate');
const marmaladeFillEl = document.getElementById('marmalade-fill');
const progressFillEl = document.getElementById('progress-fill');
const progressPercentEl = document.getElementById('progress-percent');
const countdownEl = document.getElementById('countdown');
const collectBtn = document.getElementById('collect-btn');

// Initialize Game
function initGame() {
    loadGameState();
    updateDisplay();
    startMiningTimer();
    setupEventListeners();
    updateUpgradesDisplay();
    updateDailyBonusDisplay();
}

// Load Game State
function loadGameState() {
    const saved = localStorage.getItem('marmaladeMining');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            Object.assign(gameState, parsed);
            
            // Ensure minimum balance
            if (gameState.balance < 1000) gameState.balance = 1000;
            
            // Calculate mining progress
            if (gameState.lastCollectTime) {
                const now = Date.now();
                const timePassed = now - gameState.lastCollectTime;
                const threeHours = 3 * 60 * 60 * 1000;
                gameState.miningProgress = Math.min((timePassed / threeHours) * 100, 100);
            }
        } catch (e) {
            console.error('Error loading game:', e);
        }
    }
}

// Save Game State
function saveGameState() {
    localStorage.setItem('marmaladeMining', JSON.stringify(gameState));
}

// Update Display
function updateDisplay() {
    // Update balance
    balanceEl.textContent = Math.floor(gameState.balance);
    
    // Calculate total hashrate
    let totalBoost = 0;
    totalBoost += gameState.upgrades.mini.count * gameState.upgrades.mini.boost;
    totalBoost += gameState.upgrades.medium.count * gameState.upgrades.medium.boost;
    totalBoost += gameState.upgrades.large.count * gameState.upgrades.large.boost;
    
    const efficiency = 1 + (gameState.upgrades.logistics.count * gameState.upgrades.logistics.boost);
    const totalHashrate = (gameState.baseHashrate + totalBoost) * efficiency;
    
    hashrateEl.textContent = totalHashrate.toFixed(1);
    
    // Update progress
    progressFillEl.style.width = `${gameState.miningProgress}%`;
    marmaladeFillEl.style.height = `${gameState.miningProgress}%`;
    progressPercentEl.textContent = `${Math.floor(gameState.miningProgress)}%`;
    
    // Update collect button
    collectBtn.disabled = gameState.miningProgress < 100;
}

// Start Mining Timer
function startMiningTimer() {
    updateMiningProgress();
    
    setInterval(() => {
        updateMiningProgress();
        updateDisplay();
    }, 1000);
}

// Update Mining Progress
function updateMiningProgress() {
    if (gameState.miningProgress >= 100) return;
    
    if (!gameState.lastCollectTime) {
        gameState.lastCollectTime = Date.now();
    }
    
    const now = Date.now();
    const threeHours = 3 * 60 * 60 * 1000;
    const timePassed = now - gameState.lastCollectTime;
    
    gameState.miningProgress = Math.min((timePassed / threeHours) * 100, 100);
    
    if (gameState.miningProgress < 100) {
        const timeLeft = threeHours - timePassed;
        const hours = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
        
        countdownEl.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
        countdownEl.textContent = 'Ready!';
        if (!gameState.achievements.firstCollect.achieved) {
            gameState.achievements.firstCollect.achieved = true;
            gameState.achievements.firstCollect.date = new Date().toISOString();
            saveGameState();
        }
    }
}

// Collect Marmalade
function collectMarmalade() {
    if (gameState.miningProgress < 100) return;
    
    // Calculate earnings
    let baseEarnings = 100;
    let totalBoost = 0;
    
    // Add factory boosts
    totalBoost += gameState.upgrades.mini.count * gameState.upgrades.mini.boost * 20;
    totalBoost += gameState.upgrades.medium.count * gameState.upgrades.medium.boost * 20;
    totalBoost += gameState.upgrades.large.count * gameState.upgrades.large.boost * 20;
    
    // Apply logistics efficiency
    const efficiency = 1 + (gameState.upgrades.logistics.count * gameState.upgrades.logistics.boost);
    const earnings = Math.floor((baseEarnings + totalBoost) * efficiency);
    
    // Update game state
    gameState.balance += earnings;
    gameState.lastCollectTime = Date.now();
    gameState.miningProgress = 0;
    
    // Update achievements
    gameState.achievements.marmaladeMaster.total += earnings;
    if (gameState.achievements.marmaladeMaster.total >= 10000) {
        gameState.achievements.marmaladeMaster.achieved = true;
    }
    
    // Show notification
    showNotification(`Collected ${earnings} MARM!`);
    
    // Save and update
    saveGameState();
    updateDisplay();
}

// Show Screen
function showScreen(screenId) {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Show selected screen
    document.getElementById(screenId).classList.add('active');
    
    // Update nav buttons
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Activate corresponding nav button
    const activeBtn = Array.from(document.querySelectorAll('.nav-item')).find(btn => 
        btn.getAttribute('onclick')?.includes(screenId)
    );
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
}

// Show Popup
function showPopup(popupId) {
    document.getElementById(popupId).style.display = 'flex';
}

// Close Popup
function closePopup(popupId) {
    document.getElementById(popupId).style.display = 'none';
}

// Update Daily Bonus Display
function updateDailyBonusDisplay() {
    const today = new Date().toDateString();
    const dayOfMonth = new Date().getDate();
    const dayIndex = (dayOfMonth - 1) % 7;
    
    // Update streak
    document.getElementById('streak-days').textContent = gameState.dailyBonus.streak;
    
    // Update calendar
    const bonusDays = document.querySelectorAll('.bonus-day');
    bonusDays.forEach((day, index) => {
        day.classList.remove('claimed', 'today');
        
        if (gameState.dailyBonus.claimedDays.includes(index + 1)) {
            day.classList.add('claimed');
        }
        
        if (index === dayIndex) {
            day.classList.add('today');
        }
    });
    
    // Update claim button
    const claimBtn = document.getElementById('claim-daily-btn');
    if (gameState.dailyBonus.lastClaimed === today) {
        claimBtn.disabled = true;
        claimBtn.textContent = 'Already Claimed';
    } else {
        claimBtn.disabled = false;
        claimBtn.innerHTML = '<i class="fas fa-gift"></i> CLAIM TODAY';
    }
}

// Claim Daily Bonus
function claimDailyBonus() {
    const today = new Date().toDateString();
    const dayOfMonth = new Date().getDate();
    const dayIndex = (dayOfMonth - 1) % 7 + 1;
    
    if (gameState.dailyBonus.lastClaimed === today) {
        showNotification('Already claimed today!');
        return;
    }
    
    // Calculate bonus
    const baseBonus = 100;
    const streakBonus = gameState.dailyBonus.streak * 20;
    const totalBonus = baseBonus + streakBonus;
    
    // Update game state
    gameState.balance += totalBonus;
    
    // Update streak
    if (gameState.dailyBonus.lastClaimed) {
        const lastClaimed = new Date(gameState.dailyBonus.lastClaimed);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (lastClaimed.toDateString() === yesterday.toDateString()) {
            gameState.dailyBonus.streak++;
        } else {
            gameState.dailyBonus.streak = 1;
        }
    } else {
        gameState.dailyBonus.streak = 1;
    }
    
    gameState.dailyBonus.lastClaimed = today;
    gameState.dailyBonus.claimedDays.push(dayIndex);
    
    // Update achievements
    gameState.achievements.dailyStreak7.streak = gameState.dailyBonus.streak;
    if (gameState.dailyBonus.streak >= 7) {
        gameState.achievements.dailyStreak7.achieved = true;
    }
    
    // Show notification
    showNotification(`Daily bonus: +${totalBonus} MARM! Streak: ${gameState.dailyBonus.streak} days`);
    
    // Update and save
    closePopup('daily-popup');
    saveGameState();
    updateDisplay();
    updateDailyBonusDisplay();
}

// Update Upgrades Display
function updateUpgradesDisplay() {
    // Update costs and counts
    Object.keys(gameState.upgrades).forEach(key => {
        const upgrade = gameState.upgrades[key];
        const costEl = document.getElementById(`${key}-cost`);
        const countEl = document.getElementById(`${key}-count`);
        
        if (costEl) {
            const cost = Math.floor(upgrade.cost * Math.pow(1.5, upgrade.count));
            costEl.textContent = cost;
        }
        
        if (countEl) {
            countEl.textContent = upgrade.count;
        }
    });
    
    // Calculate total boost
    let totalBoost = 0;
    totalBoost += gameState.upgrades.mini.count * gameState.upgrades.mini.boost;
    totalBoost += gameState.upgrades.medium.count * gameState.upgrades.medium.boost;
    totalBoost += gameState.upgrades.large.count * gameState.upgrades.large.boost;
    
    document.getElementById('total-boost').textContent = `+${totalBoost.toFixed(1)} H/s`;
    
    // Calculate efficiency
    const efficiency = 100 + (gameState.upgrades.logistics.count * 10);
    document.getElementById('efficiency').textContent = `${efficiency}%`;
    
    // Update achievements
    let factoryCount = 0;
    if (gameState.upgrades.mini.count > 0) factoryCount++;
    if (gameState.upgrades.medium.count > 0) factoryCount++;
    if (gameState.upgrades.large.count > 0) factoryCount++;
    
    gameState.achievements.factoryOwner.factories = factoryCount;
    if (factoryCount >= 3) {
        gameState.achievements.factoryOwner.achieved = true;
    }
}

// Buy Upgrade
function buyUpgrade(type) {
    const upgrade = gameState.upgrades[type];
    const cost = Math.floor(upgrade.cost * Math.pow(1.5, upgrade.count));
    
    if (gameState.balance >= cost) {
        gameState.balance -= cost;
        upgrade.count++;
        
        showNotification(`${type} upgrade purchased!`);
        
        saveGameState();
        updateDisplay();
        updateUpgradesDisplay();
    } else {
        showNotification('Not enough MARM!');
    }
}

// Show Notification
function showNotification(message) {
    const notification = document.getElementById('notification');
    const text = document.getElementById('notification-text');
    
    text.textContent = message;
    notification.style.display = 'flex';
    
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// Setup Event Listeners
function setupEventListeners() {
    // Collect button
    collectBtn.addEventListener('click', collectMarmalade);
    
    // Daily button
    document.getElementById('daily-btn').addEventListener('click', () => {
        showPopup('daily-popup');
    });
    
    // Upgrades button
    document.getElementById('upgrades-btn').addEventListener('click', () => {
        showPopup('upgrades-popup');
    });
    
    // Close popups when clicking outside
    document.querySelectorAll('.popup').forEach(popup => {
        popup.addEventListener('click', (e) => {
            if (e.target === popup) {
                popup.style.display = 'none';
            }
        });
    });
}

// Initialize on load
window.addEventListener('DOMContentLoaded', initGame);

// Prevent refresh on mobile
window.addEventListener('beforeunload', (e) => {
    saveGameState();
});