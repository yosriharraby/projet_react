# Test - Affichage du Staff Actuel

## Objectif
Vérifier que les médecins et réceptionnistes ajoutés au staff apparaissent correctement dans la section "Staff actuel".

## Prérequis
1. Avoir un compte ADMIN avec une clinique créée
2. Avoir au moins un utilisateur DOCTOR ou RECEPTIONIST enregistré (mais pas encore ajouté au staff)

## Étapes de Test

### 1. Se connecter en tant qu'ADMIN
- Aller sur `/login`
- Se connecter avec vos identifiants ADMIN
- Vous devriez être redirigé vers `/dashboard`

### 2. Accéder à la page de gestion du staff
- Cliquer sur "👥 Gestion du Staff" dans les "Actions Rapides" du dashboard
- Ou aller directement sur `/admin/staff`
- La page devrait s'afficher sans erreur

### 3. Vérifier l'état initial
- La section "Staff actuel" devrait afficher : "Aucun membre du staff pour le moment. Ajoutez-en un ci-dessus."
- **IMPORTANT** : Il ne devrait PAS y avoir de message d'erreur rouge si le staff est simplement vide

### 4. Ajouter un médecin au staff
- Dans la section "Ajouter un membre au staff", entrer l'email d'un utilisateur DOCTOR
- Cliquer sur "Rechercher"
- Si l'utilisateur est trouvé, il devrait apparaître dans un encadré
- Sélectionner "Médecin" comme rôle
- Cliquer sur "Ajouter à la clinique"
- Un message de succès vert devrait apparaître

### 5. Vérifier l'affichage dans "Staff actuel"
- **CRITIQUE** : Le médecin ajouté devrait **immédiatement** apparaître dans la section "Staff actuel"
- Le tableau devrait afficher :
  - Nom du médecin
  - Email du médecin
  - Badge "Médecin" avec icône stéthoscope
  - Bouton "Retirer"

### 6. Ajouter un réceptionniste
- Répéter les étapes 4-5 avec un utilisateur RECEPTIONIST
- Sélectionner "Réceptionniste" comme rôle
- Vérifier qu'il apparaît dans le tableau avec le badge "Réceptionniste"

### 7. Vérifier le tableau complet
- Le tableau devrait maintenant afficher **tous** les membres du staff ajoutés
- L'ordre devrait être du plus récent au plus ancien (ordre décroissant par date de création)
- Chaque ligne devrait avoir les informations correctes

### 8. Tester la suppression
- Cliquer sur "Retirer" pour un membre du staff
- Confirmer la suppression
- Le membre devrait disparaître du tableau
- Un message de succès devrait apparaître

### 9. Recharger la page
- Recharger la page (`F5` ou `Ctrl+R`)
- Le staff devrait toujours être affiché correctement
- Les membres ajoutés précédemment ne devraient pas disparaître

## Résultats Attendus

✅ **Succès** si :
- Le staff est chargé sans erreur
- Les membres ajoutés apparaissent immédiatement dans le tableau
- Les informations affichées sont correctes (nom, email, rôle)
- La suppression fonctionne correctement
- Le staff persiste après rechargement de la page

❌ **Échec** si :
- Un message d'erreur rouge apparaît au chargement (sauf si vraiment il y a une erreur serveur)
- Les membres ajoutés n'apparaissent pas dans le tableau
- Les informations affichées sont incorrectes ou manquantes
- La suppression ne fonctionne pas
- Le staff disparaît après rechargement

## Dépannage

### Erreur "Erreur lors du chargement du staff"
1. Vérifier la console du navigateur (F12) pour voir l'erreur exacte
2. Vérifier que vous êtes bien connecté en tant qu'ADMIN
3. Vérifier que votre compte ADMIN a bien une membership avec une clinique
4. Vérifier les logs du serveur pour voir s'il y a une erreur côté API

### Les membres n'apparaissent pas après ajout
1. Vérifier la console du navigateur pour voir si `fetchStaff()` est appelé
2. Vérifier que l'API `/api/admin/staff` retourne bien les données
3. Vérifier que le message de succès apparaît après l'ajout
4. Vérifier que `fetchStaff()` est bien appelé après l'ajout réussi

### Le tableau est vide alors qu'il devrait y avoir des membres
1. Vérifier dans la base de données que les `Membership` existent bien
2. Vérifier que les `Membership` ont bien le `role` DOCTOR ou RECEPTIONIST
3. Vérifier que les `Membership` sont bien liées à la bonne clinique
4. Vérifier que l'API retourne bien les données dans le format attendu

## Notes Techniques

- L'API `/api/admin/staff` (GET) retourne `{ staff: Membership[] }`
- Chaque `Membership` inclut `{ id, role, user: { id, email, name, defaultRole } }`
- Le staff est filtré pour ne montrer que les rôles DOCTOR et RECEPTIONIST
- Le staff est trié par date de création décroissante (plus récent en premier)

