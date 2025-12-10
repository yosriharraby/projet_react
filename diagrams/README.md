# 📊 Diagrammes UML - MedFlow

Ce dossier contient tous les diagrammes UML du projet MedFlow au format PlantUML.

## 📁 Fichiers

1. **01_cas_utilisation.puml** - Diagramme de cas d'utilisation
   - Montre tous les cas d'utilisation par rôle (Admin, Médecin, Réceptionniste, Patient)
   - Relations entre les acteurs et les fonctionnalités

2. **02_diagramme_classes.puml** - Diagramme de classes
   - Structure complète des classes du système
   - Relations entre les entités
   - Méthodes principales

3. **03_sequence_paiement.puml** - Diagramme de séquence : Paiement en ligne
   - Flux complet du paiement d'une facture via Stripe
   - Interactions entre Patient, Frontend, API, Stripe, Database

4. **04_sequence_ordonnance.puml** - Diagramme de séquence : Création et export ordonnance
   - Création d'une ordonnance par le médecin
   - Export PDF avec jsPDF
   - Téléchargement par le patient

5. **05_ERD.puml** - Diagramme Entité-Relation (ERD)
   - Schéma complet de la base de données
   - Toutes les relations entre les tables
   - Clés primaires et étrangères

## 🛠️ Comment visualiser les diagrammes

### Option 1 : PlantUML Online
1. Aller sur [plantuml.com/plantuml](http://www.plantuml.com/plantuml)
2. Copier le contenu d'un fichier `.puml`
3. Coller dans l'éditeur
4. Le diagramme s'affiche automatiquement
5. Exporter en PNG ou SVG

### Option 2 : Extension VS Code
1. Installer l'extension "PlantUML" dans VS Code
2. Ouvrir un fichier `.puml`
3. Appuyer sur `Alt+D` pour prévisualiser
4. Exporter avec `Ctrl+Shift+P` > "PlantUML: Export Current Diagram"

### Option 3 : Java (local)
```bash
# Installer Java et PlantUML
# Puis :
java -jar plantuml.jar diagrams/*.puml
```

## 📝 Notes

- Les diagrammes utilisent des noms de variables et méthodes réels du projet
- Les relations reflètent exactement le schéma Prisma
- Les diagrammes de séquence montrent les flux critiques du système

## 🎯 Utilisation pour la documentation

Ces diagrammes peuvent être inclus dans :
- La documentation du projet
- La présentation orale
- Le rapport de projet
- Le README GitHub

Pour les exporter en images, utilisez l'une des méthodes ci-dessus.

