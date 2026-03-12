# Mise en œuvre — Description & Design

## Description

### Vue d'ensemble

La page **Mise en œuvre** est le centre de pilotage opérationnel des projets de communication. Elle permet de :

1. **Suivre l'avancement** des actions du plan de communication
2. **Gérer le planning** (création, modification, suppression d'actions)
3. **Visualiser la répartition** des acteurs sur les actions via un diagramme de Gantt
4. **Valider la réalisation** des actions terminées

### Public cible

- Responsables communication
- Chefs de projet
- Équipes en charge de l'exécution des plans de communication

### Parcours utilisateur

1. Sélectionner un projet dans la liste déroulante
2. Consulter ou ajouter des actions (intitulé, dates début/fin)
3. Cocher les actions terminées et enregistrer
4. Visualiser le planning Gantt : acteurs par action, périodes en orange
5. Consulter la liste des actions en bas de page (référence verte)

---

## Design

### Principes visuels

| Principe | Application |
|----------|-------------|
| **Hiérarchie claire** | Hero → Sélection projet → Liste actions → Gantt → Légende |
| **Feedback immédiat** | États visuels distincts (terminé = vert, en cours = neutre) |
| **Cohérence** | Palette violet/fuchsia pour les CTAs, emerald pour succès, amber pour timeline |
| **Lisibilité** | Cartes avec fond blanc semi-transparent, bordures légères |

### Palette de couleurs

| Usage | Couleur | Classe Tailwind |
|-------|---------|-----------------|
| Primaire (boutons, icônes) | Violet → Fuchsia | `from-violet-600 to-fuchsia-600` |
| Actions terminées | Vert émeraude | `bg-emerald-50`, `text-emerald-700` |
| Actions en cours | Ambre | `bg-amber-100`, `text-amber-700` |
| Barres Gantt (périodes) | Orange | `bg-amber-500/90` |
| Légende actions (bas de page) | Vert | `bg-emerald-100`, `border-emerald-300` |
| Texte principal | Slate | `text-slate-900`, `text-slate-600` |

### Structure de la page

```
┌─────────────────────────────────────────────────────────────┐
│  HERO (gradient violet/cyan/ambre)                          │
│  • Badge "Mise en œuvre"                                     │
│  • Titre "Suivi des Actions"                                 │
│  • Description + badges (projets, actions, terminées, en cours)│
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  CARTE PROJET                                               │
│  • Select projet (lg:max-w-xl)                               │
│  • Bouton "Nouvelle action" (si projet sélectionné)          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  CARTE ACTIONS                                              │
│  • Liste des actions (checkbox, titre, dates, Modifier/Suppr)│
│  • Formulaire inline pour édition/ajout                      │
│  • Bouton "Enregistrer" (actions cochées)                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  CARTE GANTT                                                │
│  • Tableau : Acteur | Action | Timeline (barres orange)      │
│  • En-têtes de dates (dd/MM)                                │
│  • Barres positionnées en % du timeline                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  LÉGENDE ACTIONS (fond vert)                                │
│  • Badges : titre + dates (dd MMM → dd MMM)                  │
└─────────────────────────────────────────────────────────────┘
```

### Composants clés

#### 1. Hero
- Fond : dégradés radiaux (violet, cyan, ambre) à 14–18 % d'opacité
- Bordure arrondie `rounded-2xl`, ombre légère
- Badges dynamiques : nombre de projets, actions, terminées, en cours

#### 2. Carte Actions
- Chaque action : carte avec bordure, état visuel (vert si terminée)
- Checkbox pour marquer terminé
- Dates formatées en français (dd MMM yyyy, HH:mm)
- Actions : Modifier (inline), Supprimer

#### 3. Tableau Gantt
- Colonnes : Acteur (sticky), Action, Timeline
- Barres orange : `left` et `width` en % du timeline
- Scroll horizontal si beaucoup de jours
- Tooltip au survol : titre + dates

#### 4. Légende verte
- Section en bas du Gantt
- Badges pour chaque action avec plage de dates

### États et interactions

| État | Comportement |
|------|--------------|
| Aucun projet | Message + lien vers Communication → Projets |
| Projet sans actions | CTA "Ajouter une action" |
| Chargement | Spinner + "Chargement des actions..." |
| Aucun acteur affecté | Message + lien vers Acteurs et Rôles |
| Action en édition | Formulaire inline (titre, début, fin) |
| Action en cours d'ajout | Formulaire en bas de liste |

### Responsive

- **Mobile** : colonnes empilées, select pleine largeur
- **Tablette** : layout adaptatif, Gantt scroll horizontal
- **Desktop** : max-width contenu, badges en ligne

### Accessibilité

- `aria-hidden` sur les ornements décoratifs
- Labels sur les champs de formulaire
- Contraste suffisant (texte slate sur fond clair)
- Focus visible sur les contrôles

---

## Données

### Entités

- **Projet** : id, name
- **Action** : id, title, startDate, endDate, completed, orderIndex
- **Acteur** : id, name, department, job
- **Affectation** : actionId → [actorIds]

### Flux de données

1. `page.tsx` : charge projets + actions du premier projet (SSR)
2. `MiseOeuvreClient` : charge acteurs + affectations au changement de projet
3. Mutations : create/update/delete actions, update completed

---

## Améliorations possibles

1. **Filtres** : par statut (terminé / en cours), par acteur
2. **Zoom Gantt** : vue jour / semaine / mois
3. **Export** : PDF ou image du Gantt
4. **Glisser-déposer** : réordonner les actions
5. **Notifications** : rappels pour actions à échéance
