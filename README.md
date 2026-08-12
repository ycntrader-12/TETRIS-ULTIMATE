# ⚡ TETRIS ULTIMATE — Modern Edition

> Une expérience Tetris Web moderne, fluide et ultra-complète avec un **moteur 2D Canvas**, **8 pistes audio génératives synthétisées (Rock, Synthwave, Chiptune, Metal, Cyberpunk Drift, Phonk, Dubstep, Hyperpop)** avec **auto-rotation toutes les 30s**, **système SRS Wall Kicks**, **détection T-Spin**, **Power-Ups**, **succès**, **modes multiples (Classic, Time Attack, Endless, Survival, Challenge)**, **contrôles tactiles mobiles**, **voix en Darija Marocaine (Web Speech API)** et **cinématique d'intro 3D**.

![Créé par ycntrader-12](https://img.shields.io/badge/Auteur-ycntrader--12-7c4fff?style=for-the-badge&logo=github)
![Tech Stack](https://img.shields.io/badge/Stack-HTML5%20%7C%20CSS3%20%7C%20JavaScript%20(ES6+)-00d4ff?style=for-the-badge)
![License](https://img.shields.io/badge/Licence-MIT-ffe600?style=for-the-badge)

---

## 🔥 Fonctionnalités Principales

- **🎮 Moteur de Rendu 2D Canvas & Systèmes Avancés** : Graphismes nets et réactifs avec lueurs néon, ombre fantôme (*Ghost Piece*), reflets, secousse d'écran (*Screen Shake*), particules d'impact et rotation officielle **SRS (Super Rotation System)** avec Wall Kicks.
- **🎯 T-Spin & Bonus Back-to-Back** : Détection officielle 3-corner des T-Spins (T-Spin Single, Double, Triple) et multiplicateur de score Back-to-Back (+50% bonus).
- **🎵 8 Pistes Musique Synthetisées & Auto-Rotation (30s)** :
  - **Piste 1** : *Rock Nu-Metal* (Style Linkin Park - Power chords & synth lead).
  - **Piste 2** : *Synthwave 80s* (Arpèges néon cyberpunk).
  - **Piste 3** : *8-Bit Chiptune Arcade* (Nostalgie rétro arcade).
  - **Piste 4** : *Heavy Metalcore* (Batterie double-kick 160 BPM & riffs metal).
  - **Piste 5** : *Cyberpunk Drift* (Bassline industrielle & lead futuriste).
  - **Piste 6** : *Phonk Drift* (Cowbell synthé distordu & sub bass).
  - **Piste 7** : *Dubstep Electro* (Lowpass wobble bass & rythmique electro).
  - **Piste 8** : *Hyperpop Glitch* (Arpèges hyper-rapides & beats frénétiques).
  - *Changement Auto (30s)* : Rotation autonome de la musique toutes les 30 secondes en jeu.
- **🎬 Cinématique d'Intro 3D & Titre en Relief** :
  - Immeuble futuriste en construction bloc par bloc en temps réel.
  - Titre *TETRIS ULTIMATE* en relief 3D volumétrique animé avec lueurs néons.
  - Effets sonores d'impact, lasers, arcs électriques et bris de verre.
- **⚙️ Options Avancées & Thèmes Graphiques** :
  - Modal d'options complet (Changement musique 30s, Ghost piece, Grid lines, Screen shake, Particules FX).
  - **Thèmes Visuels** : *Cyberpunk Neon*, *Arcade 8-Bit*, *Matrix Green*, *Vaporwave Sunset*, *Retro Tetris*.
- **💣 Système de Power-Ups Équilibrés** :
  - **Bombe (💣 / Touche 1)** : Destruction 3x3 de la pile.
  - **Temps Ralenti (🧊 / Touche 2)** : Ralentit la vitesse de 50% pendant 10s.
  - **Supprimer Ligne (⚡ / Touche 3)** : Efface la ligne basse remplie.
  - **Bouclier (🛡️ / Touche 4)** : Protège contre le Game Over.
- **🕹️ Multiple Modes de Jeu** : *Classic*, *Time Attack (2 min)*, *Endless*, *Survival*, *Challenge*.
- **🎖️ Accomplissements (Achievements) & Statistiques** : Niveaux d'XP joueur, 10 succès déblocables et tableau de stats complet.
- **📱 Contrôles Mobiles Tactiles & Responsive** : D-Pad virtuel et boutons tactiles adaptés aux smartphones et tablettes.
- **🎤 Commentaires Vocaux en Darija Marocaine (Web Speech API)** : Recommandations vocalisées (*"Nadi!"*, *"Jooj Nadin!"*, *"Tlata Wa3rin!"*, *"Tetris a Sat!"*, *"Kat7raq!"*) avec fallback intelligent.

---

## 🕹️ Contrôles du Jeu

| Touche | Action |
|---|---|
| `←` / `→` | Déplacer à Gauche / Droite |
| `↑` | Rotation de la pièce (SRS Wall Kicks) |
| `↓` | Descente rapide (Soft Drop) |
| `Espace` | Chute instantanée (Hard Drop + Screen Shake) |
| `C` / `Shift` | Réserver la pièce (Hold) |
| `1` / `2` / `3` / `4` | Activer Power-Up (Bombe, Ralenti, Effacer Ligne, Bouclier) |
| `P` | Pause / Reprendre le jeu |
| `M` | Couper / Activer la Musique |

---

## 🛠️ Structure du Projet

```text
titris/
├── index.html   # Structure HTML5, modaux d'options, succès, stats & contrôles tactiles
├── style.css    # Style Cyberpunk, Glassmorphism, Titre 3D, thèmes visuels et responsive
├── game.js     # Moteur Tetris SRS, T-Spin, Power-ups, Modes, Achievements, Rendu 2D & Intro
├── audio.js    # Synthétiseur Web Audio API (8 Pistes & SFX) + Auto-switch 30s & Moteur Vocal
└── README.md   # Documentation du projet pour GitHub
```

---

## 🚀 Installation & Exécution

1. Cloner ou télécharger le dépôt :
   ```bash
   git clone https://github.com/ycntrader-12/TETRIS-ULTIMATE.git
   cd TETRIS-ULTIMATE
   ```
2. Ouvrir `index.html` directement dans votre navigateur web (Chrome, Edge, Firefox, Safari). Aucun serveur ou outil de build externe requis !

---

## ⚡ Auteur & Crédits

Créé avec passion par **ycntrader-12**.
