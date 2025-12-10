# 🔍 Dépannage - Erreur "Erreur serveur" lors du chargement du staff

## Problème
L'erreur "Erreur serveur" apparaît lors du chargement de la page `/admin/staff`.

## Étapes de Diagnostic

### 1. Vérifier les logs du serveur
Ouvrez la console du serveur (terminal où vous avez lancé `pnpm dev`) et cherchez les logs qui commencent par `[GET /api/admin/staff]`.

Vous devriez voir :
- `[GET /api/admin/staff] Starting...`
- `[GET /api/admin/staff] Auth successful: { userId, clinicId, role }`
- `[GET /api/admin/staff] Fetching staff for clinic: ...`
- `[GET /api/admin/staff] Staff found: X members`

Si vous voyez une erreur, notez le message exact.

### 2. Vérifier les logs du navigateur
Ouvrez la console du navigateur (F12) et cherchez les logs qui commencent par `[fetchStaff]`.

Vous devriez voir :
- `[fetchStaff] Starting fetch...`
- `[fetchStaff] Response status: 200` (ou un autre code)
- `[fetchStaff] Staff data received: { staff: [...] }`

### 3. Vérifier que l'utilisateur a une membership ADMIN
Dans la base de données, vérifiez que votre utilisateur ADMIN a bien une `Membership` avec le rôle `ADMIN` :

```sql
-- Vérifier les memberships de l'utilisateur
SELECT m.*, u.email, c.name as clinic_name
FROM "Membership" m
JOIN "User" u ON m."userId" = u.id
JOIN "Clinic" c ON m."clinicId" = c.id
WHERE u.email = 'votre-email@example.com';
```

Vous devriez voir au moins une ligne avec `role = 'ADMIN'`.

### 4. Vérifier que la clinique existe
Vérifiez que la clinique associée à votre membership existe :

```sql
-- Vérifier la clinique
SELECT c.*, m.role
FROM "Clinic" c
JOIN "Membership" m ON c.id = m."clinicId"
JOIN "User" u ON m."userId" = u.id
WHERE u.email = 'votre-email@example.com';
```

### 5. Vérifier les permissions
Vérifiez que le fichier `src/lib/permissions.ts` contient bien :

```typescript
MANAGE_STAFF: ["ADMIN"] as Role[],
```

## Solutions Possibles

### Solution 1 : L'utilisateur n'a pas de membership
**Symptôme** : Logs montrent "No clinic found" ou erreur 404

**Solution** :
1. Vérifiez que vous vous êtes bien inscrit en tant qu'ADMIN
2. Si vous avez créé votre compte avant l'implémentation de la création automatique de clinique, vous devrez peut-être créer une clinique manuellement
3. Ou supprimez votre compte et recréez-le en tant qu'ADMIN

### Solution 2 : Erreur Prisma
**Symptôme** : Logs montrent une erreur Prisma (ex: "P2001", "P2002", etc.)

**Solution** :
1. Vérifiez que la base de données est accessible
2. Vérifiez que les migrations Prisma sont à jour : `npx prisma migrate dev`
3. Vérifiez que le client Prisma est généré : `npx prisma generate`

### Solution 3 : Erreur de session
**Symptôme** : Logs montrent "Unauthorized" ou erreur 401

**Solution** :
1. Déconnectez-vous et reconnectez-vous
2. Vérifiez que les cookies de session sont bien présents
3. Vérifiez que `authOptions` est correctement configuré

### Solution 4 : Erreur de permission
**Symptôme** : Logs montrent "You don't have permission" ou erreur 403

**Solution** :
1. Vérifiez que votre membership a bien le rôle `ADMIN`
2. Vérifiez que vous êtes bien connecté avec le bon compte
3. Vérifiez que la clinique associée à votre membership est correcte

## Test Rapide

Pour tester rapidement si le problème vient de l'API ou du frontend :

1. Ouvrez la console du navigateur (F12)
2. Allez dans l'onglet "Network" (Réseau)
3. Rechargez la page `/admin/staff`
4. Cliquez sur la requête `/api/admin/staff`
5. Regardez la réponse :
   - Si le statut est 200 et que la réponse contient `{ staff: [...] }`, le problème vient du frontend
   - Si le statut est 500, regardez la réponse pour voir le message d'erreur exact
   - Si le statut est 401/403/404, suivez les solutions correspondantes ci-dessus

## Commandes Utiles

```bash
# Régénérer le client Prisma
npx prisma generate

# Appliquer les migrations
npx prisma migrate dev

# Voir les données dans la base
npx prisma studio
```

## Informations à Fournir pour Aide

Si le problème persiste, fournissez :
1. Les logs du serveur (tous les logs `[GET /api/admin/staff]`)
2. Les logs du navigateur (tous les logs `[fetchStaff]`)
3. La réponse de l'API (onglet Network du navigateur)
4. Le résultat de la requête SQL pour vérifier les memberships
5. La version de Node.js : `node --version`
6. La version de Prisma : `npx prisma --version`

