# EL COACH METHOD — Coaching Adaptatif

> Source : `el-coach-IA.docx` (renommage interne : « Coaching Adaptatif par EL COACH METHOD ») · Mai 2026 · Version 1.0
> Section à intégrer au cahier des charges principal — entre § 10 et la Roadmap.
> Branding : on n'utilise plus jamais « IA » côté produit/marketing. Le moteur s'appelle **Coaching Adaptatif**.

## Vision produit — de l'app de programmes à l'app de Coaching Adaptatif

Les 5 programmes sont la base de données des séances. Le Coaching Adaptatif les adapte chaque jour selon l'état réel de l'athlète. Chaque matin, un check-in. Chaque jour, un plan sur mesure.

EL COACH METHOD n'est pas une app de programmes génériques. C'est un Coaching Adaptatif qui connaît l'athlète, lit son état du jour et prend les bonnes décisions à sa place.

> Les 5 programmes ne disparaissent pas — ils deviennent le moteur du Coaching Adaptatif. CrossFit Pure, Hybrid Engine, Hyrox Pure, Volume Block Hypertrophy, At Home sont les bases de données dans lesquelles le Coaching Adaptatif pioche chaque jour.

## Architecture — les 3 couches

### Couche 1 — Profil de base (une seule fois, à l'inscription)

Mémoire permanente de l'athlète.

| Donnée | Utilisation par le Coaching Adaptatif |
| --- | --- |
| Données personnelles | Âge, poids, taille, sexe → calculs caloriques et récupération |
| Programme choisi | Détermine la base de données des séances à utiliser |
| Niveau | Débutant / Intermédiaire / Expert → intensité des séances générées |
| Records personnels (RM) | Base de référence pour les charges prescrites |
| Jeûne intermittent | Timing des compléments et en-cas adapté à la fenêtre alimentaire |
| Compléments actuels | Stack personnalisé — pas de doublons, pas de conflits |
| Blessures chroniques | Séances adaptées — mouvements remplacés automatiquement |
| Qualité de sommeil habituelle | Calibrage de la baseline de récupération |
| Sports pratiqués | Charge totale semaine — évite le surentraînement |

### Couche 2 — Check-in quotidien (chaque matin, < 2 min)

| Signal | Action du Coaching Adaptatif |
| --- | --- |
| Niveau d'énergie /10 | Ajuste l'intensité de la séance du jour |
| Photo sommeil Apple Watch | Analyse phases profond / REM / éveil → adapte récupération |
| État des jambes (Légères / Légèrement lourdes / Lourdes) | Modifie le volume bas du corps |
| Douleur physique + localisation | Remplace les mouvements concernés ou prescrit récupération |
| État mental (Clair / Moyen / Brouillard) | Ajuste la complexité technique |
| Libido (Bonne / Moyenne / Basse) | Indicateur hormonal → stack testostérone / récupération |
| Séance prévue | Valide ou réoriente selon l'état global |
| Journée de travail (Oui / Non) | Stress et fatigue mentale pris en compte |
| Soir performance (Oui / Non) | Prépare l'en-cas et le stack pré-performance |
| Notes libres (optionnel) | Observations, événements, stress, ressenti |

### Couche 3 — Génération du plan du jour (output du matin)

Le Coaching Adaptatif croise profil + check-in et génère en temps réel :

- **État du jour** — Score ECM (A / B+ / C…) · Code couleur 🟢🟡🔴 · Résumé en une phrase
- **Séance adaptée** — Puisée dans les 5 programmes · Intensité ajustée · Mouvements remplacés si blessure
- **Stack compléments** — Timing matin/midi/soir · À prendre / à passer selon l'état
- **En-cas du jour** — Adapté au jeûne, à l'entraînement prévu et à l'objectif
- **Protocole récupération** — Ciblé sur les alertes du jour
- **Alertes personnalisées** — Blessure persistante, sommeil dégradé, surcharge de volume…
- **Aperçu demain** — Séance prévue + en-cas pré-séance + heure de coucher recommandée

## Flow utilisateur — le matin

```
Réveil  →  Check-in (2 min)  →  Coaching Adaptatif analyse (< 5 s)  →  Plan du jour
```

Le plan du jour contient dans l'ordre :

1. État du jour — score + code couleur + résumé
2. Analyse sommeil — phases Apple Watch + tendance 7 jours
3. Alertes — blessures, récupération, hormonal
4. Stack du jour — compléments par moment de la journée
5. En-cas — adapté au jeûne et à l'entraînement
6. Séance du jour — issue des 5 programmes, adaptée à l'état
7. Protocole récupération — si alerte détectée
8. Aperçu demain — anticipation et préparation

## Logique de décision

### Matrice d'état

| État | Énergie | Mental | Jambes | Action du Coaching Adaptatif |
| --- | --- | --- | --- | --- |
| 🟢 VERT | 8-10/10 | Clair | Légères | Séance complète · Intensité 100% · Charges prescrites |
| 🟡 JAUNE | 5-7/10 | Moyen | Légèrement lourdes | Séance allégée · Intensité 80% · Volume réduit |
| 🔴 ROUGE | 1-4/10 | Brouillard | Lourdes | Récupération active · Pas de WOD · Mobilité + marche |

### Gestion des blessures

| Blessure | Adaptation |
| --- | --- |
| Ischio / Jambe | Retire les mouvements lourds jambes · Upper body + récupération ischio |
| Épaule / Coiffe | Retire l'overhead · Lower body + mobilité épaule |
| Lombaires | Retire deadlifts et good mornings · Core léger + étirements lombaires |
| Genou | Retire squats profonds et sauts · Swimming / vélo / upper |
| Blessure persistante > 5 jours | Alerte rouge + recommandation consultation kiné |

### Adaptation au jeûne intermittent

| Moment | Logique du Coaching Adaptatif |
| --- | --- |
| Séance avant la fenêtre alimentaire | Stack à jeun · En-cas repoussé à l'ouverture |
| Séance pendant la fenêtre | En-cas pré-séance 45 min avant · Stack post-séance immédiat |
| Séance après la fenêtre | Récupération nocturne · Stack soir optimisé |

## Analyse photo sommeil Apple Watch

Le Coaching Adaptatif lit la photo Apple Watch et extrait :

- Durée totale de sommeil
- Durée sommeil profond — **alerte si < 40 min**
- Durée REM — **alerte si < 1h30**
- Durée d'éveil — **alerte si > 2h**
- Tendance sur 7 jours — détection de dégradation progressive

> Vision via `claude-sonnet-4-20250514` directement depuis la capture d'écran (détail technique, ne fuite pas en UI publique).

## Stack compléments — règles du Coaching Adaptatif

Le Coaching Adaptatif ne prescrit **que** les compléments déjà renseignés dans le profil. Il réorganise et priorise — jamais d'ajout.

| Situation | Action |
| --- | --- |
| Jour de séance intense | Créatine + Citrulline actives · Protéines post-séance |
| Jour de repos | Créatine pausée · Focus récupération |
| Sommeil profond < 40 min | Magnésium augmenté · Ashwagandha activé · Écrans off 21h |
| Libido basse | Tongkat Ali + Zinc + Maca + Horny Goat Weed le soir |
| Blessure active | Oméga 3 prioritaire · Vitamine C anti-inflammatoire · Collagène |
| Énergie < 5/10 | Ginseng matin · Vitamines B · Pas de stimulants forts |
| État mental brouillard | Rhodiola si dispo · Magnésium · Réduction caféine |
| Séance à jeun | Maca + Ginseng avant séance · Pas de créatine à jeun |

## Modèle économique — offres officielles

| Offre | Contenu | Tarif |
| --- | --- | --- |
| Programme + Coaching Adaptatif | Check-in + plan adaptatif + stack + récup ciblée | **14,99 € / mois** |
| Multi-programme + Coaching Adaptatif | Accès aux 5 programmes + Coaching Adaptatif complet + historique + alertes avancées | **19,99 € / mois** |

> Estimation interne du coût d'inférence : ~0,02 € par check-in · 30/mois = ~0,60 € / utilisateur actif. À ne pas exposer en UI publique.

## Intégration dans la roadmap

Le moteur Coaching Adaptatif s'insère **après l'Étape 2 (Supabase)** — il a besoin de la BDD pour stocker check-ins et historiques d'outputs. **Aucune logique back-end avant l'Étape 2.** Côté front, les textes marketing (« Coaching Adaptatif ») sont déjà déployés depuis mai 2026.

| Étape | Titre | Lien Coaching Adaptatif |
| --- | --- | --- |
| 1 | Restructuration des séances | Base de données des séances — input du Coaching Adaptatif |
| 2 | Supabase | Stockage des check-ins et historique des outputs |
| **2.5** | **Moteur Coaching Adaptatif — CHECK-IN + OUTPUTS** | **Nouveau · À développer après Supabase** |
| 3 | Stripe | Facturation 14,99 / 19,99 |
| 4 | Calendrier & navigation | Affichage de la séance générée par le Coaching Adaptatif |
| 5 | Panneau Admin | Supervision des outputs + alertes admin |

> Stack technique recommandé : API Anthropic Claude `claude-sonnet-4-20250514` + Next.js API routes + Supabase.
