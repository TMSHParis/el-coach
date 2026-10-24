# Palette de thème (partie 5, mission 4C)

`src/app/theme-palette.css` définit TOUTES les couleurs de l'app (variables `--c-xxxxxx` / `--ct-xxxxxx`) :
valeurs d'origine pour le thème sombre, variantes calculées pour le thème clair.

- Ajouter une couleur : utiliser `var(--c-<hex6>)` dans le CSS, ajouter la ligne sombre dans le bloc `:root` du fichier,
  puis `python3 scripts/theme/regen_palette.py` (depuis la racine) recalcule toutes les variantes claires.
- Changer une règle du thème clair (courbe de luminosité, plafonds d'accent) : `scripts/theme/themelib.py`.
- Contrôle de contraste : `python3 scripts/theme/contrast_check.py`.
- Les écrans plein écran des chronos portent `data-theme="dark"` et restent sombres dans les deux thèmes.
