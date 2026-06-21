// EcoQuest Application controller

let currentUser = null;
const activeTabClass = 'active';

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
        
        // C major triad arpeggio rising
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
        <div class="text-xl flex-shrink-0"><i class="fa-solid ${icon}"></i></div>
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
        // Programmatic focus shift to the active panel for keyboard/screen reader users
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

// Setup Auth Forms
document.getElementById('switch-to-register').addEventListener('click', () => {
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('register-form').classList.remove('hidden');
});

document.getElementById('switch-to-login').addEventListener('click', () => {
    document.getElementById('register-form').classList.add('hidden');
    document.getElementById('login-form').classList.remove('hidden');
});

// Submit Login
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    
    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        
        if (res.ok) {
            currentUser = data.user;
            onLoginSuccess();
            showToast("Login Successful", `Welcome back, Eco Guardian ${username}!`);
        } else {
            showToast("Login Failed", data.error || "Invalid username or password", "error");
        }
    } catch (err) {
        showToast("Error", "Could not connect to backend", "error");
    }
});

// Submit Register
document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('reg-username').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    
    try {
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        const data = await res.json();
        
        if (res.ok) {
            currentUser = data.user;
            onLoginSuccess();
            showToast("Guardian Created!", `Welcome to EcoQuest, ${username}!`);
        } else {
            showToast("Registration Failed", data.error || "Please check credentials", "error");
        }
    } catch (err) {
        showToast("Error", "Could not connect to backend", "error");
    }
});

// Logout
document.getElementById('btn-logout').addEventListener('click', async () => {
    try {
        await fetch('/api/auth/logout', { method: 'POST' });
        currentUser = null;
        document.getElementById('auth-container').classList.remove('hidden');
        document.getElementById('app-container').classList.add('hidden');
        showToast("Logged Out", "Goodbye, Eco Guardian.");
    } catch (e) {}
});

// Login success handler
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
    loadQuests();
    loadAssistant();
}

// Sync Game settings (Canvas variables)
function syncGameSettings() {
    if (!currentUser) return;
    setGameStage(currentUser.stage);
    setGameSkin(currentUser.active_skin);
    setGamePet(currentUser.active_pet);
    
    // Render Quick Skins / Pets changer panels below canvas
    renderQuickChanger();
}

// Update profile indicators across the dashboard
function updateUserProfileData(user) {
    currentUser = user;
    if (!user) return;
    
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
    
    // CO2 Equivalency calculation
    // 1 hour of standard LED bulb is 0.01kg CO2 saved. Let's make it intuitive:
    // e.g. "Equivalent to planting 1.5 tree seedlings" or "Saving 1500 lightbulb hours"
    let lightbulbHours = Math.round(user.total_co2_saved / 0.05);
    document.getElementById('dash-co2-equivalency').innerText = `Equivalent to saving ${lightbulbHours} lightbulb hours!`;
    
    // XP Bar
    const xpRequired = user.level * 100;
    const xpPercent = Math.min((user.xp / xpRequired) * 100, 100);
    document.getElementById('dash-xp-fraction').innerText = `${user.xp} / ${xpRequired} XP`;
    document.getElementById('dash-xp-bar').style.width = `${xpPercent}%`;
    
    // Achievements rendering
    renderAchievements(user.achievements || []);
    
    // Recent activity and logs
    loadRecentActions();
    
    // Sync Canvas Engine
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
        card.className = `achievement-badge border p-4 rounded-xl flex flex-col items-center justify-center text-center ${isUnlocked ? 'unlocked bg-slate-900/40 border-eco-500/20' : 'locked bg-slate-950/20 border-slate-800'}`;
        card.setAttribute('title', badge.desc);
        
        card.innerHTML = `
            <div class="w-12 h-12 rounded-full bg-gradient-to-br ${isUnlocked ? badge.color : 'from-slate-700 to-slate-800'} text-white flex items-center justify-center text-xl mb-2 shadow-lg">
                <i class="fa-solid ${badge.icon}"></i>
            </div>
            <h4 class="text-xs font-bold text-white">${badge.name}</h4>
            <p class="text-[10px] text-slate-400 mt-1">${badge.desc}</p>
        `;
        
        grid.appendChild(card);
    });
}

// Log activities from standard form
async function logActivity(actionName) {
    try {
        const res = await fetch('/api/user/log_action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action_name: actionName })
        });
        const data = await res.json();
        
        if (res.ok) {
            playSuccessChime();
            
            // Format output messages
            let msg = `+${data.xp_earned} XP | +${data.coins_earned} Eco Coins | Saves ${data.co2_saved} kg CO₂`;
            showToast("Action Logged!", msg);
            announceToScreenReader(`Action completed: ${actionName}. Earned ${data.xp_earned} XP, ${data.coins_earned} Eco Coins, saved ${data.co2_saved} kilograms of CO2.`);
            
            if (data.leveled_up) {
                playLevelUpChime();
                showToast("LEVEL UP!", `Congratulations! You reached Level ${data.user.level}!`, "levelup");
                announceToScreenReader(`Level Up! You reached Level ${data.user.level}!`);
            }
            
            if (data.unlocked_badges && data.unlocked_badges.length > 0) {
                data.unlocked_badges.forEach(b => {
                    showToast("Achievement Unlocked!", `Badge earned: ${b}`);
                    announceToScreenReader(`Achievement unlocked: ${b} badge earned.`);
                });
            }
            
            updateUserProfileData(data.user);
            
            // Refresh other states if active
            loadRecentActions();
        } else {
            showToast("Failed to log", data.error || "Action could not be logged", "error");
        }
    } catch(err) {
        showToast("Error", "Network error occurred", "error");
    }
}

// Custom Action submit handler
document.getElementById('custom-action-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const actionName = document.getElementById('custom-action-name').value.trim();
    if (!actionName) return;
    
    await logActivity(actionName);
    document.getElementById('custom-action-name').value = '';
    switchTab('dashboard');
});

// Load recent actions lists
async function loadRecentActions() {
    // We can extract recent actions using a mock endpoint, or let the user fetch profile logs.
    // Let's draw recent activities from the backend or render them from the logs.
    // In our app.py backend, we store activities in the "actions" collection.
    // Let's make a call to fetch the actions from the DB. Wait! We did not define a separate actions endpoint.
    // Let's create an API endpoint in app.py if needed, or we can just query it in app.py and return, or we can add it to app.py!
    // Ah, wait! In app.py we do not have a dedicated `/api/user/actions` route yet.
    // Let's check: Can we fetch recent actions? In app.py, we have:
    // `db.actions.find({"user_id": user_id})`
    // Let's see if we should add a route to retrieve recent actions, or if we can query it directly.
    // Yes! Let's check: we can add a route `/api/user/actions` to retrieve recent actions. It's a quick addition.
    // Wait, let's look at how we can implement recent activities.
    // In the meantime, let's write a route to get actions in app.py if we need to, or we can write a simple python route in app.py!
    // Wait, we can add it to app.py. But wait! Let's look at the database.py and app.py we already wrote.
    // If we want to retrieve actions, let's see if we can fetch them. Let's look at the route or add a simple `/api/user/actions` route!
    // Wait, in `app.py`, let's see if we already have it. No, we only query actions in `get_assistant_tips` and `check_and_award_achievements`.
    // Let's add `/api/user/actions` to `app.py` so that we can show them on the dashboard.
    // Wait, let's check: does it matter? Yes, showing recent actions is item 9 in the dashboard list!
    // Let's add `/api/user/actions` to `app.py` after we finish app.js.
    // For now, let's query it. Let's call `/api/user/actions` in `app.js` and we'll implement it in `app.py` next.
    
    try {
        const res = await fetch('/api/user/actions');
        if (res.ok) {
            const actions = await res.json();
            const list = document.getElementById('dash-activities-list');
            list.innerHTML = '';
            
            if (actions.length === 0) {
                list.innerHTML = `<p class="text-slate-400 text-sm py-4 italic text-center">No actions logged yet. Go to 'Log Actions' or play the 'Adventure Map' to get started!</p>`;
                return;
            }
            
            actions.forEach(a => {
                const row = document.createElement('div');
                row.className = 'py-3 flex justify-between items-center text-xs';
                
                // Format timestamp
                let dateStr = "Recent";
                try {
                    let d = new Date(a.timestamp);
                    dateStr = d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
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
    } catch(e){}
}

// Load daily quests
async function loadQuests() {
    try {
        const res = await fetch('/api/user/quests');
        if (res.ok) {
            const quests = await res.json();
            
            // Render on Dashboard preview
            const dashList = document.getElementById('dash-quests-list');
            dashList.innerHTML = '';
            
            // Render on Quests Tab
            const container = document.getElementById('quests-container');
            container.innerHTML = '';
            
            // Update badge count
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
                            ${q.completed ? '<span class="text-xs text-emerald-400 font-bold flex items-center gap-1"><i class="fa-solid fa-circle-check"></i> Done</span>' : ''}
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
    } catch(e){}
}

// Complete Quest Challenge
async function claimQuest(questId) {
    try {
        const res = await fetch('/api/user/quests/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quest_id: questId })
        });
        const data = await res.json();
        
        if (res.ok) {
            playSuccessChime();
            showToast("Quest Completed!", `Earned +${data.xp_earned} XP & +${data.coins_earned} Eco Coins!`);
            announceToScreenReader(`Daily quest completed successfully! Earned ${data.xp_earned} XP and ${data.coins_earned} Eco Coins.`);
            
            if (data.leveled_up) {
                playLevelUpChime();
                showToast("LEVEL UP!", `Congratulations! You reached Level ${data.user.level}!`, "levelup");
                announceToScreenReader(`Level Up! You reached Level ${data.user.level}!`);
            }
            
            updateUserProfileData(data.user);
            loadQuests();
        } else {
            showToast("Failed to Complete", data.error || "Quest could not be completed", "error");
        }
    } catch(e){
        showToast("Error", "Could not complete quest", "error");
    }
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
                        <i class="fa-solid fa-coins text-[10px]"></i>
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
                        <i class="fa-solid fa-coins text-[10px]"></i>
                        <span>Unlock for ${pet.cost} Coins</span>
                    </button>`
                }
            </div>
        `;
        petsContainer.appendChild(card);
    });
}

// Purchase Item
async function buyItem(itemType, itemId) {
    try {
        const res = await fetch('/api/user/shop/buy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ item_type: itemType, item_id: itemId })
        });
        const data = await res.json();
        
        if (res.ok) {
            playSuccessChime();
            showToast("Unlock Successful!", data.success, "coins");
            updateUserProfileData(data.user);
            renderShop();
        } else {
            showToast("Transaction Failed", data.error || "Could not complete purchase", "error");
        }
    } catch(e){
        showToast("Error", "Shop connection error", "error");
    }
}

// Equip Item
async function equipItem(itemType, itemId) {
    try {
        const res = await fetch('/api/user/shop/equip', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ item_type: itemType, item_id: itemId })
        });
        const data = await res.json();
        
        if (res.ok) {
            playSuccessChime();
            showToast("Equipped!", data.success);
            announceToScreenReader(`Successfully equipped: ${data.success}`);
            updateUserProfileData(data.user);
            renderShop();
            syncGameSettings();
        } else {
            showToast("Equipment Failed", data.error || "Could not equip item", "error");
        }
    } catch(e){
        showToast("Error", "Equipment connection error", "error");
    }
}

// Render Quick Changer (Skins/Pets panels below Canvas)
function renderQuickChanger() {
    if (!currentUser) return;
    
    // Skins quick grid
    const skinsGrid = document.getElementById('canvas-skins-grid');
    skinsGrid.innerHTML = '';
    
    // Default skin
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

    // Pets quick grid
    const petsGrid = document.getElementById('canvas-pets-grid');
    petsGrid.innerHTML = '';
    
    // Clear pet option
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

// Load Leaderboard
async function loadLeaderboard() {
    try {
        const res = await fetch('/api/leaderboard');
        if (res.ok) {
            const data = await res.json();
            const body = document.getElementById('leaderboard-body');
            body.innerHTML = '';
            
            data.forEach(item => {
                const isMe = currentUser && item.username === currentUser.username;
                const row = document.createElement('tr');
                row.className = isMe ? 'bg-eco-500/10 font-bold text-eco-300 border-y border-eco-500/20' : 'hover:bg-slate-950/20';
                
                let rankDisplay = item.rank;
                if (item.rank === 1) rankDisplay = '🏆 <span class="text-amber-400">1</span>';
                else if (item.rank === 2) rankDisplay = '🥈 <span class="text-slate-300">2</span>';
                else if (item.rank === 3) rankDisplay = '🥉 <span class="text-orange-400">3</span>';
                
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
    } catch(e){}
}

// Load Smart Assistant Suggestions
async function loadAssistant() {
    try {
        const res = await fetch('/api/assistant/tips');
        if (res.ok) {
            const data = await res.json();
            
            // Speech bubble message
            document.getElementById('assistant-bubble').innerText = data.recommendation;
            
            // Render tips list
            const container = document.getElementById('assistant-tips-container');
            container.innerHTML = '';
            
            data.tips.forEach(t => {
                const card = document.createElement('div');
                card.className = 'p-4 bg-slate-950 border border-eco-500/5 hover:border-eco-500/25 rounded-xl transition-all';
                card.innerHTML = `
                    <p class="text-xs font-bold text-white mb-1">${t.text}</p>
                    <p class="text-[11px] text-eco-400 font-semibold flex items-center gap-1.5"><i class="fa-solid fa-leaf text-xs"></i> <span>Opportunity: ${t.impact}</span></p>
                `;
                container.appendChild(card);
            });
            
            // Render on Dashboard preview
            if (data.tips && data.tips.length > 0) {
                document.getElementById('dash-assistant-tip').innerText = data.tips[0].text;
            }
            
            // High Impact opportunity
            document.getElementById('assistant-opportunity').innerText = data.savings_opportunity;
        }
    } catch(e){}
}

// Connect Canvas Game Collections Callback
registerOnCollect((actionName) => {
    // Canvas items award logs directly
    logActivity(actionName);
});

// Check Session on Start
async function checkSession() {
    try {
        const res = await fetch('/api/user/profile');
        if (res.ok) {
            const data = await res.json();
            currentUser = data;
            onLoginSuccess();
        } else {
            // Show auth page
            document.getElementById('auth-container').classList.remove('hidden');
            document.getElementById('app-container').classList.add('hidden');
        }
    } catch(e) {
        document.getElementById('auth-container').classList.remove('hidden');
        document.getElementById('app-container').classList.add('hidden');
    }
}

// Start checking
checkSession();
