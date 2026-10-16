# VanTetris iOS

Tetris + IA 100 % côté navigateur (HTML/CSS/JS, sans backend, sans build).

## Structure
- `index.html` : page + balises meta iOS (plein écran, safe areas)
- `src/style.css` : styles (thème clair/sombre automatique)
- `src/game.js` : moteur de jeu, contrôles tactiles, IA (lignes, trous, hauteur, irrégularité)
- `vantetris-ios-single-file.html` : même chose en un seul fichier

## Lancer
- Desktop : `python -m http.server 8000` puis http://localhost:8000
- iPhone : héberger les fichiers (GitHub Pages, Netlify...) ou ouvrir le fichier single-file,
  puis Safari > Partager > « Sur l'écran d'accueil ».

## Contrôles
Tap = rotation, glisser = déplacer, swipe bas rapide = chute, boutons ◀ ▶ ▼ ⟳ ⤓,
🤖 Suggestion (fantôme), Autopilot. Clavier : flèches + espace (suggestion).
