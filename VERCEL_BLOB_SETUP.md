# Configuration Vercel Blob Storage

## Problème résolu
L'upload de fichiers ne fonctionnait pas sur Vercel car le système de fichiers est **en lecture seule** en production.

## Solution
Utilisation de **Vercel Blob Storage** pour stocker les images et fiches techniques des modèles de véhicules.

## Configuration requise

### 1. Activer Vercel Blob dans votre projet

1. Allez sur votre dashboard Vercel: https://vercel.com/dashboard
2. Sélectionnez votre projet `kpandji-dashboard`
3. Allez dans **Storage** → **Create Store** → **Blob**
4. Créez un nouveau Blob Store (gratuit jusqu'à 5GB)

### 2. Variables d'environnement

Vercel ajoutera automatiquement la variable `BLOB_READ_WRITE_TOKEN` à votre projet.

Si ce n'est pas le cas, ajoutez-la manuellement :
- Allez dans **Settings** → **Environment Variables**
- Ajoutez : `BLOB_READ_WRITE_TOKEN` avec le token fourni par Vercel Blob

### 3. Redéployer

Une fois le Blob Storage configuré, redéployez votre application :
```bash
git push
```

Ou via le dashboard Vercel : **Deployments** → **Redeploy**

## Comment ça fonctionne

### En développement (local)
- Les fichiers sont sauvegardés dans `public/externes/`
- Accès via `/externes/filename.ext`

### En production (Vercel)
- Les fichiers sont uploadés vers Vercel Blob
- Accès via une URL Vercel Blob (ex: `https://xxxx.public.blob.vercel-storage.com/...`)

## Code modifié

Les fichiers suivants ont été mis à jour :
- ✅ `lib/actions/modele.ts` - Utilise Vercel Blob en production
- ✅ `package.json` - Ajout de `@vercel/blob`

## Test

1. En local : `npm run dev` - Les fichiers seront dans `public/externes/`
2. En production : Les fichiers seront automatiquement uploadés vers Vercel Blob

## Pricing

Vercel Blob (gratuit) :
- 5 GB de stockage
- 100 GB de bande passante / mois

Au-delà, voir : https://vercel.com/docs/storage/vercel-blob/usage-and-pricing

## Alternatives possibles

Si vous préférez une autre solution :
- **Cloudinary** : CDN d'images avec transformations
- **AWS S3** : Stockage cloud Amazon
- **UploadThing** : Service d'upload simplifié pour Next.js

## Support

Documentation officielle : https://vercel.com/docs/storage/vercel-blob

