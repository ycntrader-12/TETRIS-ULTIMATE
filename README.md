# ⚡ TETRIS ULTIMATE

> Une expérience Tetris Web moderne et ultra-complète avec un **moteur de rendu 2D Canvas**, **musique générative multi-pistes (Nu-Metal/Linkin Park, Synthwave, Chiptune, Heavy Metal)**, **voix en Darija Marocaine (Web Speech API)**, **cinématique d'intro anime de construction de bâtiment**, et **journal des scores (Leaderboard) d'arcade à 3 lettres**.

![Créé par ycntrader-12](https://img.shields.io/badge/Auteur-ycntrader--12-7c4fff?style=for-the-badge&logo=github)
![Tech Stack](https://img.shields.io/badge/Stack-HTML5%20%7C%20CSS3%20%7C%20JavaScript%20(ES6+)-00d4ff?style=for-the-badge)
![License](https://img.shields.io/badge/Licence-MIT-ffe600?style=for-the-badge)

---

## 🔥 Fonctionnalités Principales

- **🎮 Moteur de Rendu 2D Canvas Haute Performance** : Graphismes nets et ultra-réactifs avec lueurs néon, pièce fantôme, reflets, particules d'effacement de lignes et zéro dépendance externe.
- **🎬 Cinématique d'Intro Anime (Construction de Bâtiment)** : 
  - Construction d'un immeuble futuriste étage par étage en temps réel via des blocs Tetris qui tombent.
  - Éclairs et arcs électriques dynamiques avec effet néon *Electric Flicker*.
  - Effets sonores synthétisés de bris de verre (`playGlassBreak`) et d'impacts de structure lourde (`playHeavyBreak`).
  - Musique de construction dédiée à 142 BPM.
- **🎵 Musique Générative Multi-Pistes (Web Audio API)** :
  - **Piste 1** : *Rock Nu-Metal* (Style Linkin Park - Power chords & synth lead).
  - **Piste 2** : *Synthwave 80s* (Arpèges néon cyberpunk).
  - **Piste 3** : *8-Bit Chiptune Arcade* (Nostalgie rétro arcade originale).
  - **Piste 4** : *Heavy Metalcore* (Batterie 160 BPM double-kick & riffs lourds).
- **🎤 Commentaires Vocaux en Darija Marocaine (Web Speech API)** :
  - Recommandations et réactions vocales (*"Nadi!"*, *"Jooj Nadin!"*, *"Tlata Wa3rin!"*, *"Tetris a Sat!"*, *"Kat7raq!"*, *"Ma kaynsh li yoqfk!"*) avec fallback intelligent en anglais si la voix arabe n'est pas installée sur le système.
- **🏆 Journal des Scores (Leaderboard) & Surnom 3 Lettres** :
  - Enregistrement des meilleurs scores sous un surnom à 3 lettres (ex: `YCN`) sauvegardé dans le `localStorage`.
  - Navigation par sous-vues fluides et animées sans aucune barre de défilement.

---

## 🕹️ Contrôles du Jeu

| Touche | Action |
|---|---|
| `←` / `→` | Déplacer à Gauche / Droite |
| `↑` | Rotation de la pièce |
| `↓` | Descente rapide (Soft Drop) |
| `Espace` | Chute instantanée (Hard Drop) |
| `P` | Pause / Reprendre le jeu |
| `M` | Couper / Activer la Musique |

---

## 🛠️ Structure du Projet

```text
titris/
├── index.html   # Structure HTML5, conteneurs Canvas, sous-vues et HUD
├── style.css    # Thème Cyberpunk, glassmorphisme et animations CSS
├── game.js     # Logique Tetris, rendu 2D Canvas et moteur de la Cinématique d'Intro
├── audio.js    # Synthétiseur Web Audio API (4 Pistes & SFX) + Moteur Vocal Speech API
└── README.md   # Documentation du projet pour GitHub
```

---

## 🚀 Installation & Exécution

1. Cloner ou télécharger le dépôt :
   ```bash
   git clone https://github.com/ycntrader-12/tetris-ultimate.git
   cd tetris-ultimate
   ```
2. Ouvrir `index.html` directement dans votre navigateur web (Chrome, Edge, Firefox, Safari). Aucun serveur ou outil de build externe requis !

---

## ⚡ Auteur & Crédits

Créé avec passion par **ycntrader-12**.
