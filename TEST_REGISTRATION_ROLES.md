# 🧪 INSTRUCTIONS DE TEST - REGISTRATION AVEC RÔLES

## ✅ Ce qui a été implémenté

1. **Enum Role mis à jour** - Ajout de `PATIENT` dans Prisma
2. **Formulaire de registration amélioré** - Sélection de rôle avec descriptions
3. **API Registration mise à jour** - Gestion des différents rôles avec logique spécifique
4. **Page Login améliorée** - Messages de succès après registration

---

## 🚀 ÉTAPES DE TEST COMPLÈTES

### Étape 1: Appliquer la migration Prisma

```bash
# Arrêter le serveur de développement si il tourne (Ctrl+C)

# Créer et appliquer la migration
npx prisma migrate dev --name add_patient_role

# Régénérer le client Prisma
npx prisma generate

# Redémarrer le serveur
pnpm dev
```

**Résultat attendu**: La migration doit ajouter `PATIENT` à l'enum `Role` dans la base de données.

---

### Étape 2: Tester la Registration ADMIN

1. **Aller sur `/register`**

2. **Remplir le formulaire avec les informations ADMIN:**
   - Nom: "Dr. Martin"
   - Email: "admin@test.com" (ou un email non utilisé)
   - Mot de passe: "password123"
   - Rôle: Sélectionner "👨‍💼 Administrateur (Propriétaire de clinique)"

3. **Vérifier que les champs clinique apparaissent:**
   - ✅ Nom de la clinique * (obligatoire)
   - ✅ Adresse de la clinique (optionnel)
   - ✅ Téléphone de la clinique (optionnel)

4. **Remplir les informations de la clinique:**
   - Nom de la clinique: "Clinique Test Admin"
   - Adresse: "123 Rue Test"
   - Téléphone: "+33 1 23 45 67 89"

5. **Cliquer sur "Créer mon compte"**

6. **Vérifier:**
   - ✅ Message de succès sur la page de login
   - ✅ Redirection vers `/login`
   - ✅ Se connecter avec les identifiants créés
   - ✅ Redirection vers `/dashboard` (pas d'onboarding car clinique déjà créée)
   - ✅ Le dashboard doit afficher "Rôle: ADMIN"
   - ✅ Toutes les fonctionnalités admin doivent être accessibles

---

### Étape 3: Tester la Registration DOCTOR

1. **Aller sur `/register`**

2. **Remplir le formulaire:**
   - Nom: "Dr. Dupont"
   - Email: "doctor@test.com"
   - Mot de passe: "password123"
   - Rôle: Sélectionner "👨‍⚕️ Médecin"

3. **Vérifier:**
   - ✅ Les champs clinique ne doivent PAS apparaître
   - ✅ Message d'information: "Votre compte sera créé. Un administrateur devra vous ajouter à une clinique..."

4. **Cliquer sur "Créer mon compte"**

5. **Vérifier:**
   - ✅ Compte créé avec succès
   - ✅ Redirection vers `/login`

6. **Se connecter:**
   - ✅ Connexion réussie
   - ✅ Redirection vers `/dashboard`
   - ⚠️ Mais pas de membership → Redirection vers `/onboarding`
   - ✅ Le message devrait indiquer qu'un admin doit ajouter le médecin

**Note**: Pour tester complètement un DOCTOR, un ADMIN doit créer une membership pour ce DOCTOR (fonctionnalité à venir dans Sprint 5).

---

### Étape 4: Tester la Registration RECEPTIONIST

1. **Aller sur `/register`**

2. **Remplir le formulaire:**
   - Nom: "Marie Martin"
   - Email: "receptionist@test.com"
   - Mot de passe: "password123"
   - Rôle: Sélectionner "👤 Réceptionniste"

3. **Vérifier:**
   - ✅ Les champs clinique ne doivent PAS apparaître
   - ✅ Message d'information approprié

4. **Cliquer sur "Créer mon compte"**

5. **Vérifier:**
   - ✅ Compte créé avec succès
   - ✅ Connexion → Redirection vers `/onboarding` (pas encore de membership)

---

### Étape 5: Tester la Registration PATIENT

1. **Aller sur `/register`**

2. **Remplir le formulaire:**
   - Nom: "Jean Patient"
   - Email: "patient@test.com"
   - Mot de passe: "password123"
   - Rôle: Sélectionner "👥 Patient"

3. **Vérifier:**
   - ✅ Les champs clinique ne doivent PAS apparaître
   - ✅ Message: "Vous pourrez accéder au portail patient..."

4. **Cliquer sur "Créer mon compte"**

5. **Vérifier:**
   - ✅ Compte créé avec succès
   - ✅ Redirection vers `/login` avec message spécifique patient

6. **Se connecter:**
   - ✅ Connexion réussie
   - ⚠️ Actuellement, redirection vers `/dashboard` puis `/onboarding`
   - **Note**: Le portail patient sera créé au Sprint 4, donc pour l'instant le comportement est normal

---

### Étape 6: Tester les Validations

#### Test 6.1: Validation du nom de clinique (ADMIN uniquement)

1. **Sélectionner rôle ADMIN**
2. **Ne PAS remplir le nom de la clinique**
3. **Essayer de soumettre**
4. ✅ Erreur: "Le nom de la clinique est obligatoire pour les administrateurs"

#### Test 6.2: Validation du rôle

1. **Ne PAS sélectionner de rôle**
2. **Remplir les autres champs**
3. **Essayer de soumettre**
4. ✅ Erreur: "Veuillez sélectionner un rôle"

#### Test 6.3: Email déjà utilisé

1. **Essayer de créer un compte avec un email existant**
2. ✅ Erreur: "Cet email est déjà utilisé"

#### Test 6.4: Mot de passe trop court

1. **Entrer un mot de passe de moins de 6 caractères**
2. ✅ Erreur: "Le mot de passe doit contenir au moins 6 caractères"

---

### Étape 7: Vérifier la Base de Données

Connectez-vous à votre base de données PostgreSQL et vérifiez:

```sql
-- Vérifier que PATIENT est dans l'enum
SELECT unnest(enum_range(NULL::"Role"));

-- Vérifier les utilisateurs créés
SELECT id, email, name, "createdAt" FROM "User" ORDER BY "createdAt" DESC;

-- Vérifier les membreships créées (pour ADMIN)
SELECT m.id, m.role, u.email, c.name as clinic_name
FROM "Membership" m
JOIN "User" u ON m."userId" = u.id
JOIN "Clinic" c ON m."clinicId" = c.id;
```

**Résultats attendus:**
- ✅ L'enum Role contient: ADMIN, DOCTOR, RECEPTIONIST, PATIENT
- ✅ Tous les utilisateurs sont créés
- ✅ Seul l'ADMIN a une membership avec une clinique
- ✅ DOCTOR, RECEPTIONIST, PATIENT n'ont PAS de membership

---

### Étape 8: Tester le Flux Complet ADMIN

1. **Créer un compte ADMIN** (comme dans Étape 2)
2. **Se connecter**
3. **Vérifier le dashboard:**
   - ✅ Statistiques s'affichent
   - ✅ Nom de la clinique visible
   - ✅ Rôle ADMIN affiché
   - ✅ Toutes les actions rapides fonctionnent

4. **Tester les permissions:**
   - ✅ Créer un patient (doit fonctionner)
   - ✅ Créer un service (doit fonctionner)
   - ✅ Créer un rendez-vous (doit fonctionner)
   - ✅ Créer une ordonnance (doit fonctionner)

---

### Étape 9: Tester l'Interface Utilisateur

1. **Vérifier le design du formulaire:**
   - ✅ Design cohérent avec le reste de l'application
   - ✅ Icônes pour chaque rôle
   - ✅ Descriptions claires
   - ✅ Messages d'aide contextuels

2. **Vérifier la responsivité:**
   - ✅ Le formulaire s'adapte sur mobile
   - ✅ Tous les éléments sont visibles

3. **Vérifier les interactions:**
   - ✅ Les champs clinique apparaissent/disparaissent selon le rôle
   - ✅ Les messages d'information changent selon le rôle
   - ✅ Validation en temps réel

---

## ✅ CHECKLIST DE VALIDATION

Avant de passer au Sprint 3, vérifiez que:

- [ ] La migration s'applique sans erreur
- [ ] L'enum Role contient PATIENT
- [ ] Registration ADMIN crée utilisateur + clinique + membership
- [ ] Registration DOCTOR crée seulement utilisateur
- [ ] Registration RECEPTIONIST crée seulement utilisateur
- [ ] Registration PATIENT crée seulement utilisateur
- [ ] Les validations fonctionnent correctement
- [ ] Les messages d'erreur sont clairs
- [ ] Les messages de succès s'affichent après registration
- [ ] Le flux de connexion fonctionne pour tous les rôles
- [ ] Le dashboard affiche correctement le rôle de l'utilisateur

---

## 🐛 PROBLÈMES COURANTS

### Erreur: "invalid input value for enum Role: \"PATIENT\""

**Solution**: 
```bash
# La migration n'a pas été appliquée
npx prisma migrate dev --name add_patient_role
npx prisma generate
```

### Les champs clinique n'apparaissent pas pour ADMIN

**Vérifier**:
1. Que vous avez bien sélectionné "ADMIN" dans le select
2. Console du navigateur pour voir les erreurs JavaScript
3. Recharger la page

### Erreur: "Le nom de la clinique est obligatoire" même si rempli

**Vérifier**:
1. Que le champ n'est pas rempli avec seulement des espaces
2. Validation Zod dans le code

### Après registration ADMIN, redirection vers onboarding

**Cause**: La clinique n'a pas été créée correctement.

**Solution**:
1. Vérifier les logs du serveur
2. Vérifier la base de données que la clinique existe
3. Vérifier que la membership existe

---

## 📝 FLUX ATTENDU PAR RÔLE

### ADMIN
1. Registration → Crée User + Clinic + Membership(ADMIN)
2. Login → Dashboard (pas d'onboarding)
3. Accès complet à toutes les fonctionnalités

### DOCTOR
1. Registration → Crée seulement User
2. Login → Dashboard → Onboarding (pas de membership)
3. Un ADMIN doit ajouter le DOCTOR à une clinique (Sprint 5)

### RECEPTIONIST
1. Registration → Crée seulement User
2. Login → Dashboard → Onboarding (pas de membership)
3. Un ADMIN doit ajouter le RECEPTIONIST à une clinique (Sprint 5)

### PATIENT
1. Registration → Crée seulement User
2. Login → Dashboard → Onboarding (pas de membership)
3. Portail patient sera créé au Sprint 4

---

## 🎯 RÉSULTAT FINAL

Après tous les tests, vous devriez avoir:

✅ Un système de registration complet avec sélection de rôle  
✅ Gestion différenciée selon le rôle choisi  
✅ Validation complète des formulaires  
✅ Messages d'erreur et de succès clairs  
✅ Interface utilisateur intuitive  
✅ Base de données correctement mise à jour  

---

## ✅ VALIDATION FINALE

Une fois tous les tests passés, vous pouvez dire:
**"Registration avec rôles validée, prêt pour Sprint 3"**

Et je passerai à l'implémentation du Sprint 3 (Module Facturation & Stripe).

