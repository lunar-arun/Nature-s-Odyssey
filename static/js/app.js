// Nature's Odyssey Application controller (Static Frontend Edition)

let currentUser = null;
const activeTabClass = 'active';

// Action configs matching previous backend settings
const ACTION_CONFIGS = {
    "Walking instead of driving": { co2: 1.2, xp: 50, coins: 10 },
    "Using public transportation": { co2: 0.8, xp: 40, coins: 8 },
    "Recycling waste": { co2: 0.5, xp: 30, coins: 6 },
    "Using reusable bottles": { co2: 0.2, xp: 20, coins: 4 },
    "Planting trees": { co2: 5.0, xp: 100, coins: 20 },
    "Eating vegetarian meals": { co2: 1.5, xp: 60, coins: 12 },
    "Saving electricity": { co2: 0.6, xp: 45, coins: 9 },
    // Canvas items
    "Collected plastic bottle": { co2: 0.3, xp: 15, coins: 5 },
    "Planted canvas seed": { co2: 1.5, xp: 30, coins: 10 },
    "Turned off canvas lightbulb": { co2: 0.4, xp: 20, coins: 6 }
};

// Shop Items Catalogue (Matches backend)
const SKINS_CATALOG = {
    "solar": { name: "Solar Cape", cost: 50, color: "#f1c40f", desc: "Shine with solar energy! Draws a yellow glowing cape." },
    "cyber": { name: "Cyber Blue", cost: 100, color: "#3498db", desc: "High-tech carbon protection. Visor and booster thrusters." },
    "earth": { name: "Earth Guardian", cost: 200, color: "#1abc9c", desc: "Elite champion of nature. Includes a green leaf crown." }
};

const PETS_CATALOG = {
    "leafy": { name: "Leafy the Fox", cost: 80, emoji: "🦊", desc: "A smart forest companion that bobs happily by your side." },
    "sparky": { name: "Sparky the Bird", cost: 150, emoji: "⚡", desc: "An electric speedster that sparks clean energy trails." },
    "bubbles": { name: "Bubbles the Otter", cost: 250, emoji: "🦦", desc: "A water protector otter who keeps river valleys clean." }
};

// Achievements Badges Catalogue
const ACHIEVEMENTS_CATALOG = {
    "First Step": { name: "First Step", desc: "Logged your first sustainable action", icon: "fa-shoe-prints", color: "from-blue-500 to-indigo-500" },
    "Recycler": { name: "Recycler", desc: "Logged 10 recycling actions", icon: "fa-recycle", color: "from-emerald-500 to-green-500" },
    "Walker": { name: "Walker", desc: "Walked 50 km instead of driving", icon: "fa-person-walking", color: "from-amber-500 to-orange-500" },
    "Carbon Hero": { name: "Carbon Hero", desc: "Reduced 100 kg of CO₂ emissions", icon: "fa-shield-halved", color: "from-red-500 to-pink-500" },
    "Earth Guardian": { name: "Earth Guardian", desc: "Reached the Sustainable Future City stage (Level 13+)", icon: "fa-earth-americas", color: "from-teal-500 to-cyan-500" }
};

// Sound Synthesizers using Web Audio API
let soundCtx = null;

// Helper to announce dynamic messages to screen readers
function announceToScreenReader(message) {
    const announcer = document.getElementById('accessibility-announcer');
    if (announcer) {
        announcer.innerText = '';
        setTimeout(() => {
            announcer.innerText = message;
        }, 50);
    }
}

function initSound() {
    if (!soundCtx) {
        soundCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playSuccessChime() {
    initSound();
    if (!soundCtx) return;
    try {
        let osc = soundCtx.createOscillator();
        let gain = soundCtx.createGain();
        osc.connect(gain);
        gain.connect(soundCtx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, soundCtx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, soundCtx.currentTime + 0.1); // E5
        osc.frequency.setValueAtTime(783.99, soundCtx.currentTime + 0.2); // G5
        osc.frequency.setValueAtTime(1046.50, soundCtx.currentTime + 0.3); // C6
        gain.gain.setValueAtTime(0.12, soundCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, soundCtx.currentTime + 0.5);
        osc.start();
        osc.stop(soundCtx.currentTime + 0.55);
    } catch(e){}
}

function playLevelUpChime() {
    initSound();
    if (!soundCtx) return;
    try {
        let osc1 = soundCtx.createOscillator();
        let osc2 = soundCtx.createOscillator();
        let gain = soundCtx.createGain();
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(soundCtx.destination);
        
        osc1.type = 'sine';
        osc2.type = 'triangle';
        
        osc1.frequency.setValueAtTime(261.63, soundCtx.currentTime); // C4
        osc1.frequency.setValueAtTime(329.63, soundCtx.currentTime + 0.12); // E4
        osc1.frequency.setValueAtTime(392.00, soundCtx.currentTime + 0.24); // G4
        osc1.frequency.setValueAtTime(523.25, soundCtx.currentTime + 0.36); // C5
        
        osc2.frequency.setValueAtTime(523.25, soundCtx.currentTime); 
        osc2.frequency.setValueAtTime(659.25, soundCtx.currentTime + 0.12); 
        osc2.frequency.setValueAtTime(783.99, soundCtx.currentTime + 0.24); 
        osc2.frequency.setValueAtTime(1046.50, soundCtx.currentTime + 0.36); 
        
        gain.gain.setValueAtTime(0.15, soundCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, soundCtx.currentTime + 0.8);
        
        osc1.start();
        osc2.start();
        osc1.stop(soundCtx.currentTime + 0.85);
        osc2.stop(soundCtx.currentTime + 0.85);
    } catch(e){}
}

// Toast System
function showToast(title, message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast-slide-in p-4 rounded-xl shadow-xl flex items-start gap-3 w-80 border glass-panel transition-all duration-300`;
    
    let icon = 'fa-circle-check text-emerald-400';
    if (type === 'coins') icon = 'fa-coins text-amber-400';
    else if (type === 'levelup') icon = 'fa-star text-yellow-400 animate-spin';
    else if (type === 'error') icon = 'fa-triangle-exclamation text-red-500';
    
    toast.innerHTML = `
        <div class="text-xl flex-shrink-0"><i class="fa-solid ${icon}" aria-hidden="true"></i></div>
        <div class="min-w-0">
            <h5 class="text-xs font-bold text-white uppercase tracking-wider">${title}</h5>
            <p class="text-xs text-slate-300 mt-1 leading-relaxed">${message}</p>
        </div>
    `;
    
    container.appendChild(toast);
    
    // Auto remove toast
    setTimeout(() => {
        toast.classList.replace('toast-slide-in', 'toast-fade-out');
        setTimeout(() => toast.remove(), 400);
    }, 4500);
}

// Progressive Theme Engine
function updateAppTheme(level) {
    const body = document.body;
    body.classList.remove("theme-polluted", "theme-recovering", "theme-river", "theme-mountain", "theme-future");
    
    if (level <= 3) {
        body.classList.add("theme-polluted");
    } else if (level <= 6) {
        body.classList.add("theme-recovering");
    } else if (level <= 9) {
        body.classList.add("theme-river");
    } else if (level <= 12) {
        body.classList.add("theme-mountain");
    } else {
        body.classList.add("theme-future");
    }
}

// View Routing
function switchTab(tabId) {
    document.querySelectorAll('.view-panel').forEach(p => {
        p.classList.add('hidden');
        p.removeAttribute('tabindex');
    });
    document.querySelectorAll('.nav-btn').forEach(b => {
        b.classList.remove(activeTabClass);
        b.setAttribute('aria-selected', 'false');
    });
    
    const targetPanel = document.getElementById(`view-${tabId}`);
    const targetBtn = document.getElementById(`nav-${tabId}`);
    
    if (targetPanel) {
        targetPanel.classList.remove('hidden');
        targetPanel.setAttribute('tabindex', '-1');
        targetPanel.focus();
    }
    if (targetBtn) {
        targetBtn.classList.add(activeTabClass);
        targetBtn.setAttribute('aria-selected', 'true');
    }
    
    // Update header title
    document.getElementById('current-view-title').innerText = tabId.replace('-', ' ');
    announceToScreenReader("Switched to " + tabId.replace('-', ' ') + " panel.");
    
    // Refresh content for specific tabs
    if (tabId === 'leaderboard') loadLeaderboard();
    if (tabId === 'quests') loadQuests();
    if (tabId === 'assistant') loadAssistant();
    if (tabId === 'shop') renderShop();
    if (tabId === 'adventure') syncGameSettings();
}

// Initialize navigation listeners with arrow key support
const navButtons = Array.from(document.querySelectorAll('.nav-btn'));
navButtons.forEach((btn, index) => {
    btn.addEventListener('click', () => {
        const id = btn.id.replace('nav-', '');
        switchTab(id);
    });
    
    btn.addEventListener('keydown', (e) => {
        let nextIndex;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
            e.preventDefault();
            nextIndex = (index + 1) % navButtons.length;
            navButtons[nextIndex].focus();
            navButtons[nextIndex].click();
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
            e.preventDefault();
            nextIndex = (index - 1 + navButtons.length) % navButtons.length;
            navButtons[nextIndex].focus();
            navButtons[nextIndex].click();
        }
    });
});

// Setup Auth Forms switching
document.getElementById('switch-to-register').addEventListener('click', () => {
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('register-form').classList.remove('hidden');
});

document.getElementById('switch-to-login').addEventListener('click', () => {
    document.getElementById('register-form').classList.add('hidden');
    document.getElementById('login-form').classList.remove('hidden');
});

// Local DB Controllers using localStorage
function saveUserToStorage(user) {
    if (!user) return;
    localStorage.setItem(`ecoquest_user_${user.username}`, JSON.stringify(user));
}

function loadUserFromStorage(username) {
    const data = localStorage.getItem(`ecoquest_user_${username}`);
    return data ? JSON.parse(data) : null;
}

function setSessionUser(username) {
    localStorage.setItem('ecoquest_session', username);
}

function getSessionUser() {
    return localStorage.getItem('ecoquest_session');
}

function clearSessionUser() {
    localStorage.removeItem('ecoquest_session');
}

// Generate random daily quests
function generateRandomQuests() {
    const questPool = [
        { quest_name: "Use public transport today", reward_xp: 40, reward_coins: 10 },
        { quest_name: "Carry a reusable bottle", reward_xp: 20, reward_coins: 5 },
        { quest_name: "Reduce electricity consumption", reward_xp: 45, reward_coins: 8 },
        { quest_name: "Walk 2 km instead of driving", reward_xp: 50, reward_coins: 12 },
        { quest_name: "Plant a tree", reward_xp: 100, reward_coins: 25 },
        { quest_name: "Eat a vegetarian lunch", reward_xp: 60, reward_coins: 15 }
    ];
    // Pick 3 random quests
    const shuffled = questPool.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3).map((q, idx) => ({
        _id: `q-${Date.now()}-${idx}`,
        quest_name: q.quest_name,
        reward_xp: q.reward_xp,
        reward_coins: q.reward_coins,
        completed: false,
        timestamp: new Date().toISOString()
    }));
}

// Pre-configured High-Level Mock User
const mockGuardian = {
    username: "test_guardian",
    password: "password123",
    email: "guardian@test.com",
    level: 8,
    xp: 615,
    eco_coins: 347,
    stage: "Clean River Valley",
    total_co2_saved: 104.2,
    achievements: ["First Step", "Recycler", "Carbon Hero"],
    unlocked_skins: ["default", "solar", "earth", "cyber"],
    unlocked_pets: ["leafy", "bubbles", "sparky"],
    active_skin: "solar",
    active_pet: "sparky",
    actions_history: [
        { action_name: "Walking instead of driving", xp_earned: 50, co2_saved: 1.2, timestamp: new Date(Date.now() - 100000).toISOString() },
        { action_name: "Turned off canvas lightbulb", xp_earned: 20, co2_saved: 0.4, timestamp: new Date(Date.now() - 500000).toISOString() }
    ],
    quests: [
        { _id: "q1", quest_name: "Use public transport today", reward_xp: 40, reward_coins: 10, completed: true },
        { _id: "q2", quest_name: "Carry a reusable bottle", reward_xp: 20, reward_coins: 5, completed: false },
        { _id: "q3", quest_name: "Eat a vegetarian lunch", reward_xp: 60, reward_coins: 15, completed: false }
    ]
};

// Initialize Mock Account
if (!loadUserFromStorage("test_guardian")) {
    saveUserToStorage(mockGuardian);
}

// Submit Login
document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    
    if (!username || !password) {
        showToast("Error", "All fields are required", "error");
        return;
    }
    
    let user = loadUserFromStorage(username);
    
    // Fail-proof check for the test guardian
    if (username === "test_guardian" && password === "password123") {
        if (!user) {
            saveUserToStorage(mockGuardian);
            user = mockGuardian;
        }
        currentUser = user;
        setSessionUser(username);
        onLoginSuccess();
        showToast("Login Successful", `Welcome back, Eco Guardian ${username}!`);
    } else if (user && user.password === password) {
        currentUser = user;
        setSessionUser(username);
        onLoginSuccess();
        showToast("Login Successful", `Welcome back, Eco Guardian ${username}!`);
    } else {
        showToast("Login Failed", "Invalid username or password", "error");
    }
});

// Submit Register
document.getElementById('register-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('reg-username').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    
    if (!username || !email || !password) {
        showToast("Error", "All fields are required", "error");
        return;
    }
    
    if (username.length < 3 || username.length > 30) {
        showToast("Registration Failed", "Username must be between 3 and 30 characters", "error");
        return;
    }
    if (password.length < 8 || password.length > 128) {
        showToast("Registration Failed", "Password must be at least 8 characters", "error");
        return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showToast("Registration Failed", "Invalid email address", "error");
        return;
    }
    
    if (loadUserFromStorage(username)) {
        showToast("Registration Failed", "Username already exists", "error");
        return;
    }
    
    const newUser = {
        username: username,
        password: password,
        email: email,
        level: 1,
        xp: 0,
        eco_coins: 100,
        stage: "Polluted City",
        total_co2_saved: 0.0,
        achievements: [],
        unlocked_skins: ["default"],
        unlocked_pets: [],
        active_skin: "default",
        active_pet: "",
        actions_history: [],
        quests: generateRandomQuests()
    };
    
    saveUserToStorage(newUser);
    currentUser = newUser;
    setSessionUser(username);
    onLoginSuccess();
    showToast("Guardian Created!", `Welcome to Nature's Odyssey, ${username}!`);
});

// Logout
document.getElementById('btn-logout').addEventListener('click', () => {
    currentUser = null;
    clearSessionUser();
    document.getElementById('auth-container').classList.remove('hidden');
    document.getElementById('app-container').classList.add('hidden');
    showToast("Logged Out", "Goodbye, Eco Guardian.");
});

function onLoginSuccess() {
    document.getElementById('auth-container').classList.add('hidden');
    document.getElementById('app-container').classList.remove('hidden');
    
    // Clear forms
    document.getElementById('login-username').value = '';
    document.getElementById('login-password').value = '';
    document.getElementById('reg-username').value = '';
    document.getElementById('reg-email').value = '';
    document.getElementById('reg-password').value = '';
    
    updateUserProfileData(currentUser);
    switchTab('dashboard');
}

// Sync Game settings (Canvas variables)
function syncGameSettings() {
    if (!currentUser) return;
    setGameStage(currentUser.stage);
    setGameSkin(currentUser.active_skin);
    setGamePet(currentUser.active_pet);
    renderQuickChanger();
}

function calculateStage(level) {
    if (1 <= level <= 3) return "Polluted City";
    if (4 <= level <= 6) return "Recovering Forest";
    if (7 <= level <= 9) return "Clean River Valley";
    if (10 <= level <= 12) return "Mountain Sanctuary";
    return "Sustainable Future City";
}

function checkAndAwardAchievements(user) {
    const achievements = listBadgesUnlocked(user);
    const earned = [];
    
    const count = user.actions_history.length;
    if (count >= 1 && !achievements.includes("First Step")) {
        earned.push("First Step");
    }
    
    const recyclingCount = user.actions_history.filter(a => 
        a.action_name.includes("Recycling") || a.action_name.includes("bottle")
    ).length;
    if (recyclingCount >= 10 && !achievements.includes("Recycler")) {
        earned.push("Recycler");
    }
    
    const walkingCount = user.actions_history.filter(a => a.action_name.includes("Walking")).length;
    if (walkingCount * 2 >= 50 && !achievements.includes("Walker")) {
        earned.push("Walker");
    }
    
    if (user.total_co2_saved >= 100.0 && !achievements.includes("Carbon Hero")) {
        earned.push("Carbon Hero");
    }
    
    if (user.level >= 13 && !achievements.includes("Earth Guardian")) {
        earned.push("Earth Guardian");
    }
    
    return earned;
}

function listBadgesUnlocked(user) {
    return user.achievements || [];
}

// Update profile indicators across the dashboard
function updateUserProfileData(user) {
    currentUser = user;
    if (!user) return;
    
    // Apply dynamic level-up theme styling
    updateAppTheme(user.level);
    
    // Header Stats
    document.getElementById('header-coins').innerText = user.eco_coins;
    document.getElementById('header-co2').innerText = `${user.total_co2_saved.toFixed(1)} kg`;
    
    // Nav Status
    document.getElementById('nav-username').innerText = user.username;
    document.getElementById('nav-level-badge').innerText = `Level ${user.level}`;
    document.getElementById('nav-avatar-char').innerText = user.username[0].toUpperCase();
    
    // Pet badge in avatar
    const petBadge = document.getElementById('equipped-pet-badge');
    if (user.active_pet) {
        let emoji = "🦊";
        if (user.active_pet === "sparky") emoji = "⚡";
        else if (user.active_pet === "bubbles") emoji = "🦦";
        petBadge.innerText = emoji;
        petBadge.classList.remove('hidden');
    } else {
        petBadge.classList.add('hidden');
    }
    
    // Dashboard Stats
    document.getElementById('dash-stage-badge').innerText = user.stage;
    document.getElementById('dash-level-text').innerText = `Level ${user.level}`;
    document.getElementById('dash-eco-coins').innerText = user.eco_coins;
    document.getElementById('dash-co2-saved').innerText = `${user.total_co2_saved.toFixed(1)} kg`;
    
    let lightbulbHours = Math.round(user.total_co2_saved / 0.05);
    document.getElementById('dash-co2-equivalency').innerText = `Equivalent to saving ${lightbulbHours} lightbulb hours!`;
    
    // XP Bar
    const xpRequired = user.level * 100;
    const xpPercent = Math.min((user.xp / xpRequired) * 100, 100);
    document.getElementById('dash-xp-fraction').innerText = `${user.xp} / ${xpRequired} XP`;
    document.getElementById('dash-xp-bar').style.width = `${xpPercent}%`;
    
    renderAchievements(user.achievements || []);
    loadRecentActions();
    syncGameSettings();
}

// Render Achievements badge grid
function renderAchievements(unlockedBadges) {
    const grid = document.getElementById('dash-achievements-grid');
    grid.innerHTML = '';
    
    Object.keys(ACHIEVEMENTS_CATALOG).forEach(badgeId => {
        const badge = ACHIEVEMENTS_CATALOG[badgeId];
        const isUnlocked = unlockedBadges.includes(badgeId);
        
        const card = document.createElement('div');
        card.className = `achievement-badge border p-4 rounded-xl flex flex-col items-center justify-center text-center ${isUnlocked ? 'unlocked bg-slate-900/40 border-eco-500/25' : 'locked bg-slate-950/20 border-slate-800'}`;
        card.setAttribute('title', badge.desc);
        
        card.innerHTML = `
            <div class="w-12 h-12 rounded-full bg-gradient-to-br ${isUnlocked ? badge.color : 'from-slate-700 to-slate-800'} text-white flex items-center justify-center text-xl mb-2 shadow-lg">
                <i class="fa-solid ${badge.icon}" aria-hidden="true"></i>
            </div>
            <h4 class="text-xs font-bold text-white">${badge.name}</h4>
            <p class="text-[10px] text-slate-400 mt-1">${badge.desc}</p>
        `;
        
        grid.appendChild(card);
    });
}

// Log activities
function logActivity(actionName) {
    if (!currentUser) return;
    
    let config = ACTION_CONFIGS[actionName];
    if (!config) {
        config = { co2: 0.5, xp: 20, coins: 5 };
    }
    
    const xpEarned = config.xp;
    const co2Saved = config.co2;
    const coinsEarned = config.coins;
    
    const actionLog = {
        action_name: actionName,
        xp_earned: xpEarned,
        co2_saved: co2Saved,
        timestamp: new Date().toISOString()
    };
    
    currentUser.actions_history.unshift(actionLog);
    if (currentUser.actions_history.length > 15) {
        currentUser.actions_history.pop();
    }
    
    let newXp = currentUser.xp + xpEarned;
    let newCoins = currentUser.eco_coins + coinsEarned;
    let newCo2 = parseFloat((currentUser.total_co2_saved + co2Saved).toFixed(2));
    let currentLevel = currentUser.level;
    
    let leveledUp = false;
    while (newXp >= (currentLevel * 100)) {
        newXp -= (currentLevel * 100);
        currentLevel++;
        leveledUp = true;
    }
    
    currentUser.xp = newXp;
    currentUser.eco_coins = newCoins;
    currentUser.total_co2_saved = newCo2;
    
    const oldLevel = currentUser.level;
    currentUser.level = currentLevel;
    currentUser.stage = calculateStage(currentLevel);
    
    const newBadges = checkAndAwardAchievements(currentUser);
    if (newBadges.length > 0) {
        currentUser.achievements.push(...newBadges);
    }
    
    saveUserToStorage(currentUser);
    playSuccessChime();
    
    let msg = `+${xpEarned} XP | +${coinsEarned} Eco Coins | Saves ${co2Saved} kg CO₂`;
    showToast("Action Logged!", msg);
    announceToScreenReader(`Action completed: ${actionName}. Earned ${xpEarned} XP, ${coinsEarned} Eco Coins, saved ${co2Saved} kilograms of CO2.`);
    
    if (leveledUp) {
        playLevelUpChime();
        showToast("LEVEL UP!", `Congratulations! You reached Level ${currentUser.level}!`, "levelup");
        announceToScreenReader(`Level Up! You reached Level ${currentUser.level}!`);
    }
    
    if (newBadges.length > 0) {
        newBadges.forEach(b => {
            showToast("Achievement Unlocked!", `Badge earned: ${b}`);
            announceToScreenReader(`Achievement unlocked: ${b} badge earned.`);
        });
    }
    
    updateUserProfileData(currentUser);
}

// Custom Action submit handler
document.getElementById('custom-action-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const actionName = document.getElementById('custom-action-name').value.trim();
    if (!actionName) return;
    
    logActivity(actionName);
    document.getElementById('custom-action-name').value = '';
    switchTab('dashboard');
});

// Load recent actions list
function loadRecentActions() {
    const list = document.getElementById('dash-activities-list');
    list.innerHTML = '';
    
    const actions = currentUser ? currentUser.actions_history : [];
    
    if (actions.length === 0) {
        list.innerHTML = `<p class="text-slate-400 text-sm py-4 italic text-center">No actions logged yet. Go to 'Log Actions' or play the 'Adventure Map' to get started!</p>`;
        return;
    }
    
    actions.forEach(a => {
        const row = document.createElement('div');
        row.className = 'py-3 flex justify-between items-center text-xs';
        
        let dateStr = "Recent";
        try {
            let d = new Date(a.timestamp);
            dateStr = d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch(e){}
        
        row.innerHTML = `
            <div>
                <p class="font-semibold text-slate-200">${a.action_name}</p>
                <p class="text-[10px] text-slate-400 mt-0.5">${dateStr}</p>
            </div>
            <div class="text-right">
                <p class="text-emerald-400 font-extrabold">-${a.co2_saved} kg CO₂</p>
                <p class="text-eco-400 text-[10px] font-bold">+${a.xp_earned} XP</p>
            </div>
        `;
        list.appendChild(row);
    });
}

// Load daily quests
function loadQuests() {
    if (!currentUser) return;
    
    const quests = currentUser.quests || [];
    
    const dashList = document.getElementById('dash-quests-list');
    dashList.innerHTML = '';
    
    const container = document.getElementById('quests-container');
    container.innerHTML = '';
    
    const incompleteQuests = quests.filter(q => !q.completed);
    document.getElementById('quests-badge').innerText = incompleteQuests.length;
    
    if (quests.length === 0) {
        dashList.innerHTML = `<p class="text-slate-400 text-xs italic">No quests available.</p>`;
        container.innerHTML = `<p class="text-slate-400 text-sm italic col-span-3 text-center">No quests available.</p>`;
        return;
    }
    
    quests.forEach(q => {
        // Dashboard row
        const dRow = document.createElement('div');
        dRow.className = 'flex items-center justify-between bg-slate-950/50 border border-eco-500/5 px-4 py-2.5 rounded-xl text-xs';
        dRow.innerHTML = `
            <div class="flex items-center gap-2">
                <i class="fa-solid ${q.completed ? 'fa-circle-check text-emerald-400' : 'fa-circle text-eco-800/40'}"></i>
                <span class="${q.completed ? 'line-through text-slate-400' : 'text-slate-200'}">${q.quest_name}</span>
            </div>
            <span class="text-[10px] text-amber-500 font-bold">${q.reward_coins} Coins</span>
        `;
        dashList.appendChild(dRow);
        
        // Quests Tab Card
        const card = document.createElement('div');
        card.className = `bg-slate-900/60 border p-5 rounded-2xl flex flex-col justify-between ${q.completed ? 'border-emerald-500/20 bg-emerald-950/5' : 'border-eco-500/10'}`;
        
        card.innerHTML = `
            <div>
                <div class="flex justify-between items-start mb-3">
                    <span class="text-xs bg-eco-500/10 text-eco-400 border border-eco-500/20 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">Daily Quest</span>
                    ${q.completed ? '<span class="text-xs text-emerald-400 font-bold flex items-center gap-1"><i class="fa-solid fa-circle-check" aria-hidden="true"></i> Done</span>' : ''}
                </div>
                <h4 class="text-sm font-bold text-white leading-relaxed mb-4">${q.quest_name}</h4>
            </div>
            <div class="space-y-4">
                <div class="flex gap-4 border-t border-eco-500/5 pt-3 text-xs">
                    <div>
                        <p class="text-[10px] text-slate-400 uppercase font-semibold">XP Reward</p>
                        <p class="text-eco-400 font-bold">+${q.reward_xp} XP</p>
                    </div>
                    <div>
                        <p class="text-[10px] text-slate-400 uppercase font-semibold">Coins Reward</p>
                        <p class="text-amber-400 font-bold">+${q.reward_coins} Coins</p>
                    </div>
                </div>
                
                ${q.completed ? 
                    `<button disabled class="w-full py-2 bg-slate-800 text-slate-500 font-bold rounded-lg text-xs cursor-not-allowed">Claimed</button>` :
                    `<button onclick="claimQuest('${q._id}')" class="w-full py-2 bg-eco-600 hover:bg-eco-500 active:bg-eco-700 text-white font-bold rounded-lg text-xs transition-all shadow-md">Complete Challenge</button>`
                }
            </div>
        `;
        container.appendChild(card);
    });
}

// Complete Quest Challenge
function claimQuest(questId) {
    if (!currentUser) return;
    
    const quests = currentUser.quests || [];
    const quest = quests.find(q => q._id === questId);
    
    if (!quest) {
        showToast("Error", "Quest not found", "error");
        return;
    }
    if (quest.completed) {
        showToast("Error", "Quest already completed", "error");
        return;
    }
    
    quest.completed = true;
    const rewardXp = quest.reward_xp;
    const rewardCoins = quest.reward_coins;
    
    let newXp = currentUser.xp + rewardXp;
    let newCoins = currentUser.eco_coins + rewardCoins;
    let currentLevel = currentUser.level;
    
    let leveledUp = false;
    while (newXp >= (currentLevel * 100)) {
        newXp -= (currentLevel * 100);
        currentLevel++;
        leveledUp = true;
    }
    
    currentUser.xp = newXp;
    currentUser.eco_coins = newCoins;
    
    const oldLevel = currentUser.level;
    currentUser.level = currentLevel;
    currentUser.stage = calculateStage(currentLevel);
    
    const newBadges = checkAndAwardAchievements(currentUser);
    if (newBadges.length > 0) {
        currentUser.achievements.push(...newBadges);
    }
    
    saveUserToStorage(currentUser);
    playSuccessChime();
    
    showToast("Quest Completed!", `Earned +${rewardXp} XP & +${rewardCoins} Eco Coins!`);
    announceToScreenReader(`Daily quest completed successfully! Earned ${rewardXp} XP and ${rewardCoins} Eco Coins.`);
    
    if (leveledUp) {
        playLevelUpChime();
        showToast("LEVEL UP!", `Congratulations! You reached Level ${currentUser.level}!`, "levelup");
        announceToScreenReader(`Level Up! You reached Level ${currentUser.level}!`);
    }
    
    updateUserProfileData(currentUser);
    loadQuests();
}

// Render Shop Catalog
function renderShop() {
    if (!currentUser) return;
    
    // Render Skins
    const skinsContainer = document.getElementById('shop-skins-container');
    skinsContainer.innerHTML = '';
    
    Object.keys(SKINS_CATALOG).forEach(skinId => {
        const skin = SKINS_CATALOG[skinId];
        const isUnlocked = currentUser.unlocked_skins.includes(skinId);
        const isActive = currentUser.active_skin === skinId;
        
        const card = document.createElement('div');
        card.className = `bg-slate-950 border p-5 rounded-2xl flex flex-col justify-between ${isActive ? 'border-eco-500' : 'border-eco-500/10'}`;
        
        card.innerHTML = `
            <div>
                <div class="flex justify-between items-start mb-3">
                    <span class="w-6 h-6 rounded-full border border-eco-500/30 flex items-center justify-center" style="background-color: ${skin.color}"></span>
                    ${isActive ? '<span class="text-xs text-eco-400 font-bold">Equipped</span>' : ''}
                </div>
                <h4 class="text-sm font-bold text-white mb-1">${skin.name}</h4>
                <p class="text-xs text-slate-400 leading-relaxed mb-4">${skin.desc}</p>
            </div>
            
            <div class="mt-4 border-t border-eco-500/5 pt-3">
                ${isUnlocked ? 
                    (isActive ? 
                        `<button disabled class="w-full py-2 bg-slate-800 text-slate-500 font-bold rounded-lg text-xs cursor-not-allowed">Active</button>` :
                        `<button onclick="equipItem('skin', '${skinId}')" class="w-full py-2 border border-eco-500 text-eco-400 hover:bg-eco-500 hover:text-white font-bold rounded-lg text-xs transition-all">Equip Skin</button>`
                    ) : 
                    `<button onclick="buyItem('skins', '${skinId}')" class="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-amber-900/10">
                        <i class="fa-solid fa-coins text-[10px]" aria-hidden="true"></i>
                        <span>Unlock for ${skin.cost} Coins</span>
                    </button>`
                }
            </div>
        `;
        skinsContainer.appendChild(card);
    });

    // Render Pets
    const petsContainer = document.getElementById('shop-pets-container');
    petsContainer.innerHTML = '';
    
    Object.keys(PETS_CATALOG).forEach(petId => {
        const pet = PETS_CATALOG[petId];
        const isUnlocked = currentUser.unlocked_pets.includes(petId);
        const isActive = currentUser.active_pet === petId;
        
        const card = document.createElement('div');
        card.className = `bg-slate-950 border p-5 rounded-2xl flex flex-col justify-between ${isActive ? 'border-eco-500' : 'border-eco-500/10'}`;
        
        card.innerHTML = `
            <div>
                <div class="flex justify-between items-start mb-3">
                    <span class="text-3xl">${pet.emoji}</span>
                    ${isActive ? '<span class="text-xs text-eco-400 font-bold">Equipped</span>' : ''}
                </div>
                <h4 class="text-sm font-bold text-white mb-1">${pet.name}</h4>
                <p class="text-xs text-slate-400 leading-relaxed mb-4">${pet.desc}</p>
            </div>
            
            <div class="mt-4 border-t border-eco-500/5 pt-3">
                ${isUnlocked ? 
                    (isActive ? 
                        `<button onclick="equipItem('pet', '')" class="w-full py-2 border border-red-500/40 text-red-400 hover:bg-red-500/10 font-bold rounded-lg text-xs transition-all">Unequip</button>` :
                        `<button onclick="equipItem('pet', '${petId}')" class="w-full py-2 border border-eco-500 text-eco-400 hover:bg-eco-500 hover:text-white font-bold rounded-lg text-xs transition-all">Equip Pet</button>`
                    ) : 
                    `<button onclick="buyItem('pets', '${petId}')" class="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-amber-900/10">
                        <i class="fa-solid fa-coins text-[10px]" aria-hidden="true"></i>
                        <span>Unlock for ${pet.cost} Coins</span>
                    </button>`
                }
            </div>
        `;
        petsContainer.appendChild(card);
    });
}

// Purchase Item
function buyItem(itemType, itemId) {
    if (!currentUser) return;
    
    const catalog = itemType === 'skins' ? SKINS_CATALOG : PETS_CATALOG;
    const item = catalog[itemId];
    
    if (!item) {
        showToast("Error", "Item not found in catalog", "error");
        return;
    }
    
    const cost = item.cost;
    if (currentUser.eco_coins < cost) {
        showToast("Transaction Failed", "Not enough Eco Coins", "error");
        return;
    }
    
    currentUser.eco_coins -= cost;
    const listName = itemType === 'skins' ? 'unlocked_skins' : 'unlocked_pets';
    currentUser[listName].push(itemId);
    
    saveUserToStorage(currentUser);
    playSuccessChime();
    
    showToast("Unlock Successful!", `Unlocked ${item.name}!`, "coins");
    announceToScreenReader(`Purchase successful: Unlocked ${item.name} for ${cost} Eco Coins.`);
    
    updateUserProfileData(currentUser);
    renderShop();
}

// Equip Item
function equipItem(itemType, itemId) {
    if (!currentUser) return;
    
    if (itemId !== "") {
        const listName = itemType === 'skin' ? 'unlocked_skins' : 'unlocked_pets';
        if (!currentUser[listName].includes(itemId)) {
            showToast("Error", "Item is not unlocked yet", "error");
            return;
        }
    }
    
    const field = itemType === 'skin' ? 'active_skin' : 'active_pet';
    currentUser[field] = itemId;
    
    saveUserToStorage(currentUser);
    playSuccessChime();
    
    const itemName = itemId === "" ? "None" : itemId;
    showToast("Equipped!", `Successfully equipped ${itemName}`);
    announceToScreenReader(`Successfully equipped: ${itemName}`);
    
    updateUserProfileData(currentUser);
    renderShop();
    syncGameSettings();
}

// Render Quick Changer (Skins/Pets panels below Canvas)
function renderQuickChanger() {
    if (!currentUser) return;
    
    const skinsGrid = document.getElementById('canvas-skins-grid');
    skinsGrid.innerHTML = '';
    
    const defActive = currentUser.active_skin === 'default';
    const defBtn = document.createElement('button');
    defBtn.className = `w-10 h-10 rounded-xl border flex items-center justify-center text-xs font-bold transition-all ${defActive ? 'bg-eco-500 text-eco-950 border-eco-400' : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-eco-500'}`;
    defBtn.innerText = 'Def';
    defBtn.onclick = () => equipItem('skin', 'default');
    skinsGrid.appendChild(defBtn);
    
    currentUser.unlocked_skins.forEach(skinId => {
        if (skinId === 'default') return;
        const skin = SKINS_CATALOG[skinId];
        if (!skin) return;
        const isActive = currentUser.active_skin === skinId;
        const btn = document.createElement('button');
        btn.className = `w-10 h-10 rounded-xl border flex items-center justify-center text-lg transition-all ${isActive ? 'border-white scale-105' : 'border-transparent hover:scale-105'}`;
        btn.style.backgroundColor = skin.color;
        btn.setAttribute('title', skin.name);
        btn.innerHTML = `<span class="sr-only">${skin.name}</span>`;
        btn.onclick = () => equipItem('skin', skinId);
        skinsGrid.appendChild(btn);
    });

    const petsGrid = document.getElementById('canvas-pets-grid');
    petsGrid.innerHTML = '';
    
    const clearActive = currentUser.active_pet === '';
    const clearBtn = document.createElement('button');
    clearBtn.className = `w-10 h-10 rounded-xl border flex items-center justify-center text-xs transition-all ${clearActive ? 'bg-eco-500 text-eco-950 border-eco-400 font-bold' : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-eco-500'}`;
    clearBtn.innerText = 'None';
    clearBtn.onclick = () => equipItem('pet', '');
    petsGrid.appendChild(clearBtn);

    currentUser.unlocked_pets.forEach(petId => {
        const pet = PETS_CATALOG[petId];
        if (!pet) return;
        const isActive = currentUser.active_pet === petId;
        const btn = document.createElement('button');
        btn.className = `w-10 h-10 rounded-xl border flex items-center justify-center text-xl transition-all ${isActive ? 'bg-eco-500/20 border-eco-400' : 'bg-slate-900 border-slate-700 hover:border-eco-500'}`;
        btn.innerText = pet.emoji;
        btn.setAttribute('title', pet.name);
        btn.onclick = () => equipItem('pet', petId);
        petsGrid.appendChild(btn);
    });
}

// Load Leaderboard Standings
function loadLeaderboard() {
    const rivalUsers = [
        { username: "EcoWarrior_Green", level: 14, xp: 950, total_co2_saved: 240.5 },
        { username: "PlanetSaver99", level: 11, xp: 420, total_co2_saved: 154.2 },
        { username: "ForestAngel", level: 7, xp: 215, total_co2_saved: 78.4 },
        { username: "RecycleKing", level: 5, xp: 85, total_co2_saved: 41.2 },
        { username: "WindPower_User", level: 3, xp: 190, total_co2_saved: 18.5 }
    ];
    
    if (currentUser) {
        // Exclude test_guardian if logging in as normal to avoid duplicates, but check matches
        const filteredRivals = rivalUsers.filter(r => r.username !== currentUser.username);
        filteredRivals.push({
            username: currentUser.username,
            level: currentUser.level,
            xp: currentUser.xp,
            total_co2_saved: currentUser.total_co2_saved
        });
        
        // Sort rivals
        filteredRivals.sort((a, b) => b.total_co2_saved - a.total_co2_saved || b.xp - a.xp);
        
        const body = document.getElementById('leaderboard-body');
        body.innerHTML = '';
        
        filteredRivals.forEach((item, index) => {
            const isMe = item.username === currentUser.username;
            const rank = index + 1;
            
            const row = document.createElement('tr');
            row.className = isMe ? 'bg-eco-500/10 font-bold text-eco-300 border-y border-eco-500/20' : 'hover:bg-slate-950/20';
            
            let rankDisplay = rank;
            if (rank === 1) rankDisplay = '🏆 <span class="text-amber-400">1</span>';
            else if (rank === 2) rankDisplay = '🥈 <span class="text-slate-300">2</span>';
            else if (rank === 3) rankDisplay = '🥉 <span class="text-orange-400">3</span>';
            
            row.innerHTML = `
                <td class="py-4 px-6 text-center font-bold">${rankDisplay}</td>
                <td class="py-4 px-6 flex items-center gap-2">
                    <span class="w-6 h-6 rounded-full bg-eco-500/10 text-eco-400 flex items-center justify-center text-xs border border-eco-500/30">${item.username[0].toUpperCase()}</span>
                    <span>${item.username}</span>
                    ${isMe ? '<span class="text-[9px] bg-eco-500 text-eco-950 px-1 py-0.5 rounded font-extrabold ml-1 uppercase">You</span>' : ''}
                </td>
                <td class="py-4 px-6 text-center">${item.level}</td>
                <td class="py-4 px-6 text-right text-emerald-400 font-extrabold">${item.total_co2_saved.toFixed(1)}</td>
                <td class="py-4 px-6 text-right text-slate-400">${item.xp}</td>
            `;
            body.appendChild(row);
        });
    }
}

// Load Smart Assistant Tips
function loadAssistant() {
    if (!currentUser) return;
    
    const recentActions = currentUser.actions_history || [];
    const actionNames = recentActions.map(a => a.action_name);
    const tips = [];
    
    if (!actionNames.includes("Eating vegetarian meals")) {
        tips.push({
            text: "Eating vegetarian just once a week can reduce your greenhouse gas emissions significantly.",
            impact: "Replacing a meat meal with a vegetarian option saves approximately 1.5 kg of CO₂ and earns 60 XP!"
        });
    }
    if (!actionNames.includes("Saving electricity")) {
        tips.push({
            text: "Turn off unused room lights, TVs, and monitors when not in use.",
            impact: "Conserving electricity for a few hours saves 0.6 kg of CO₂ and earns 45 XP!"
        });
    }
    if (!actionNames.includes("Using public transportation") && !actionNames.includes("Walking instead of driving")) {
        tips.push({
            text: "Leaving your car at home and walking or riding public transit is the fastest way to shrink your footprint.",
            impact: "Replacing a personal car drive saves 0.8 kg to 1.2 kg of CO₂ and earns up to 50 XP!"
        });
    }
    
    if (tips.length < 2) {
        tips.push({
            text: "Try carrying a reusable water bottle or travel coffee mug everywhere you go.",
            impact: "Avoiding single-use plastics saves 0.2 kg of CO₂ and earns 20 XP."
        });
        tips.push({
            text: "Consider planting local trees or wild flowering plants in your garden to clean the air.",
            impact: "A single tree absorbs carbon over its lifetime, giving you 5.0 kg of CO₂ savings and 100 XP!"
        });
    }
    
    let rec = `Eco Guardian, you are currently level ${currentUser.level} in the ${currentUser.stage}. `;
    if (currentUser.level < 4) {
        rec += "To restore the city and unlock the Recovering Forest stage, log 3 green actions today!";
    } else if (currentUser.level < 7) {
        rec += "The forest is recovering, but needs water. Play the game canvas and plant some seeds to unlock the River Valley!";
    } else {
        rec += "Keep up the excellent work! You are well on your way to creating a Sustainable Future City.";
    }
    
    // Speech bubble message
    document.getElementById('assistant-bubble').innerText = rec;
    
    // Render tips
    const container = document.getElementById('assistant-tips-container');
    container.innerHTML = '';
    
    tips.slice(0, 2).forEach(t => {
        const card = document.createElement('div');
        card.className = 'p-4 bg-slate-950 border border-eco-500/5 hover:border-eco-500/25 rounded-xl transition-all';
        card.innerHTML = `
            <p class="text-xs font-bold text-white mb-1">${t.text}</p>
            <p class="text-[11px] text-eco-400 font-semibold flex items-center gap-1.5"><i class="fa-solid fa-leaf text-xs" aria-hidden="true"></i> <span>Opportunity: ${t.impact}</span></p>
        `;
        container.appendChild(card);
    });
    
    // Render on Dashboard preview
    if (tips.length > 0) {
        document.getElementById('dash-assistant-tip').innerText = tips[0].text;
    }
    
    document.getElementById('assistant-opportunity').innerText = "Replacing 2 weekly car trips with public transit saves ~12 kg CO₂/week.";
}

// Connect Canvas Game Callback
registerOnCollect((actionName) => {
    logActivity(actionName);
});

// Check Session on Start
function checkSession() {
    const username = getSessionUser();
    if (username) {
        const user = loadUserFromStorage(username);
        if (user) {
            currentUser = user;
            onLoginSuccess();
            return;
        }
    }
    // Show auth page
    document.getElementById('auth-container').classList.remove('hidden');
    document.getElementById('app-container').classList.add('hidden');
}

// Start checking
checkSession();
