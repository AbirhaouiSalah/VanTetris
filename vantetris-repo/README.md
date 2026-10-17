# VanTetris

Tetris + IA en 3D, jouable sur iPhone et desktop. 100 % navigateur : HTML / CSS / JavaScript, sans backend ni build.

## Fonctionnalités (version principale)
- Scène 3D (three.js r128 via cdnjs) : cubes éclairés, débris physiques, anneaux de choc, caméra dynamique
- **Mutation** : la pièce en chute se transforme en une autre forme avant son placement (avertissement par clignotement, jauge MUTATION)
- **Difficulté progressive** : gravité croissante, lignes de déchets qui montent du bas, événements aléatoires (MIRROR : contrôles inversés, ECLIPSE : visibilité réduite)
- IA heuristique (lignes, trous, hauteur, irrégularité) : bouton Suggestion + Autopilot
- Combos, score, niveaux, sons synthétisés (WebAudio)

## Structure
```
index.html          page + meta iOS (plein écran, safe areas)
src/style.css       interface (HUD, boutons, pop-ups)
src/game.js         logique, IA, rendu three.js, contrôles
versions/           itérations précédentes, autonomes (un seul fichier chacune)
  01-ios-touch.html     version tactile iOS
  02-anime-fx.html      effets anime (explosions, screen shake)
  03-boss-mode.html     boss avec barre de vie + attaque ultime
```

## Lancer
```bash
python -m http.server 8000   # puis http://localhost:8000
```
Sur iPhone : héberger (GitHub Pages / Netlify), ouvrir dans Safari, Partager > « Sur l'écran d'accueil ».

## Contrôles
| Action | Tactile | Clavier |
|---|---|---|
| Déplacer | glisser / ◀ ▶ | ← → |
| Tourner | tap / ⟳ | ↑ |
| Descendre | ▼ | ↓ |
| Chute instantanée | swipe bas rapide / ⤓ | Entrée |
| Suggestion IA | 🤖 | Espace |

## Déploiement GitHub Pages
Settings > Pages > Deploy from branch > `main` / root.
