# Nature's Odyssey 🌍🐾

> **[Challenge 3] Carbon Footprint Awareness Platform**  
> *A state-of-the-art, gamified client-side platform designed to help individuals track, understand, and dramatically reduce their carbon emissions through interactive real-world habits, mini-games, and progressive UI transformations.*

---

## 📌 Project Overview

**Nature's Odyssey** is a highly polished, fully self-contained web experience that turns environmental consciousness into an immersive RPG journey. 

The application is structured as a **pure client-side single-page application (SPA)** with zero server dependencies. It uses browser-level `localStorage` for data persistence, rendering immediate feedback with zero network latency.

As you log real-world green actions, complete daily quests, or capture recyclables in the built-in mini-game, you earn XP and level up. The entire visual theme of the platform dynamically evolves as you level up, physically transforming from a dull, polluted gray layout to a glowing, neon-emerald sustainable future city!

---

## 🚀 Core Features

### 1. Dynamic Progressive Theme Journey 🎨
The entire dashboard visual design changes color schemes to match your restoration progress:
* **Levels 1–3: Polluted City** – Dim slate grays, dark zinc borders, and a polluted charcoal gradient.
* **Levels 4–6: Recovering Forest** – Soft, earthy lime and sage-green outlines creep in.
* **Levels 7–9: Clean River Valley** – Fresh teal and sky-blue accents.
* **Levels 10–12: Mountain Sanctuary** – Clean mint and deep alpine emerald gradients.
* **Levels 13+: Sustainable Future City** – Vibrant neon green highlights and glowing glassmorphic panels.

### 2. 2D Adventure Mini-Game 🎮
An interactive HTML5 Canvas game. Run and jump using your keyboard to catch recyclable plastic bottles, plant saplings, and turn off wasteful lights while dodging obstacles. Collectibles directly feed carbon savings and XP into your profile.

### 3. Gamified Habit Tracker & Daily Quests 📅
* Log real-world green choices (walking, recycling, energy conservation, eating vegetarian) to calculate instant CO₂ offsets.
* Complete rotating daily quests to earn bonus Eco Coins.

### 4. Eco Companion Shop 🦊
Redeem your Eco Coins in the Shop to unlock custom **Character Skins** (Solar Cape, Cyber Blue, Earth Guardian) and **Companion Pets** (Leafy the Fox, Sparky the Bird, Bubbles the Otter) that accompany you in the adventure game.

### 5. Smart EcoBot Assistant & Standings 🤖
* **EcoBot Assistant:** A client-side analyst that reviews your activity history and provides smart, personalized suggestions to maximize carbon offsets.
* **Real-time Leaderboard:** Standings that dynamically sort your profile relative to 5 rival guardians as your score increases.

---

## 🛠️ Tech Stack

* **Frontend Structure:** Semantic HTML5 & Tailwind CSS
* **Layout Design:** Custom HSL variables, Glassmorphism backdrop-filters, and CSS transitions
* **Interactions:** Vanilla ES6+ JavaScript modules
* **Game Engine:** 2D HTML5 Canvas API
* **Audio FX:** Web Audio API synth tones
* **Storage Engine:** Browser `localStorage`
* **Test Suite:** Pytest & HTML DOM Parser for structural accessibility verification

---

## 📦 Installation & Local Setup

Because the application is built entirely client-side, setup is instant and requires no database installations, environment setups, or package managers.

### 1. Clone the Repository

```bash
git clone https://github.com/lunar-arun/Nature-s-Odyssey.git
cd Nature-s-Odyssey
```

### 2. Run the Application

You can play the game immediately by double-clicking the `index.html` file at the root in any modern web browser.

Alternatively, spin up a simple local static server using Python:

```bash
python -m http.server 5000
```

Then visit:
```text
http://127.0.0.1:5000
```

---

## 🛡️ Sandbox Preview Credentials

To immediately experience the high-level stages, custom skins, companion pets, and rich historical logs without registering a fresh account, use the preconfigured test profile:

* **Username:** `test_guardian`
* **Password:** `password123`

---

## 🧪 Testing & Code Quality

The codebase includes an automated compliance testing suite verifying DOM integrity, relative assets configurations, responsive layout metrics, and WAI-ARIA accessibility compliance (tabindex focus, live regions, matching inputs).

To run the compliance test suite:

```bash
python -m pytest tests/ -v
```

---

### 🌱 Live Demo

Visit the deployed application:

👉 **https://nature-s-odyssey.onrender.com/**

---

*Developed with 🌱 for a more sustainable future.*
