# WinRak — Guide de connexion Supabase

## Étape 1 — Créer le projet Supabase

1. Aller sur https://supabase.com
2. Créer un compte (gratuit)
3. Cliquer **"New project"**
4. Remplir :
   - **Name** : `winrak`
   - **Database Password** : un mot de passe fort (notez-le)
   - **Region** : `West EU (Paris)` — le plus proche de l'Algérie
5. Attendre ~2 minutes que le projet se crée

## Étape 2 — Récupérer les clés API

Dans le dashboard Supabase :
- **Settings** → **API**
- Copier : `Project URL` et `anon public key`

## Étape 3 — Exécuter le schéma SQL

Dans le dashboard Supabase :
- **SQL Editor** → **New query**
- Coller et exécuter dans cet ordre :
  1. Contenu de `supabase/schema.sql`
  2. Contenu de `supabase/rls.sql`
  3. Contenu de `supabase/seed.sql` (données de test)
  4. Migrations (dans l'ordre, après les 3 fichiers ci-dessus) :
     - `supabase/migrations/20260621_critical_fixes.sql`
     - `supabase/migrations/20260622_dispatch_system.sql`
     - `supabase/migrations/20260623_secure_pricing.sql`
     - `supabase/migrations/20260623_secure_transactions.sql`

## Étape 4 — Créer le bucket de stockage

Dans le dashboard Supabase :
- **Storage** → **New bucket**
- Name : `driver-docs`
- Public : **NON** (privé — accès via signed URLs)
- Cliquer **Save**

Ajouter une policy :
- **Policies** → **New policy** → "Custom policy"
```sql
-- Chauffeurs peuvent uploader leurs propres docs
CREATE POLICY "driver_upload_own_docs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'driver-docs' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Chauffeurs et admins peuvent lire
CREATE POLICY "driver_read_own_docs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'driver-docs' AND
  (
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
);
```

## Étape 5 — Configurer les variables d'environnement

### Application mobile (Expo) :
```bash
# Copier le fichier example
cp .env.example .env.local

# Modifier .env.local avec vos vraies valeurs :
EXPO_PUBLIC_SUPABASE_URL=https://VOTRE_ID.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=VOTRE_ANON_KEY
```

### Dashboard Web :
Modifier `dashboard/supabase-config.js` :
```javascript
const SUPABASE_URL      = 'https://VOTRE_ID.supabase.co'
const SUPABASE_ANON_KEY = 'VOTRE_ANON_KEY'
```

## Étape 6 — Activer le Realtime

Dans le dashboard Supabase :
- **Database** → **Replication**
- Activer pour les tables :
  - `driver_locations` ✓
  - `trips`            ✓
  - `notifications`    ✓
  - `driver_documents` ✓

## Étape 7 — Créer le compte admin

Dans Supabase :
- **Authentication** → **Users** → **Invite user**
- Email : votre email admin
- Après confirmation, exécuter :
```sql
INSERT INTO public.profiles (id, role, full_name)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'VOTRE_EMAIL'),
  'admin',
  'Administrateur WinRak'
);
```

## Résumé de l'architecture des fichiers

```
WinRak/
├── lib/
│   └── supabase.ts          ← Client Supabase (Expo)
├── services/
│   ├── auth.service.ts      ← OTP SMS, login, profil
│   ├── documents.service.ts ← Upload docs chauffeur
│   ├── trips.service.ts     ← CRUD courses
│   ├── realtime.service.ts  ← GPS live, Realtime
│   └── finance.service.ts   ← Transactions, retraits
├── supabase/
│   ├── schema.sql           ← Tables + triggers + vues
│   ├── rls.sql              ← Sécurité Row Level Security
│   ├── seed.sql             ← Données de test
│   └── SETUP_GUIDE.md       ← Ce fichier
└── dashboard/
    ├── index.html           ← Dashboard admin
    ├── app.js               ← Logique dashboard
    └── supabase-config.js   ← Client Supabase (Web)
```

## Prochaines étapes après le setup

- [ ] Étape 2 : Connecter l'app mobile (remplacer mock data)
- [ ] Étape 3 : Upload réel de documents depuis l'app
- [ ] Étape 4 : Finance réelle
- [ ] Étape 5 : GPS en temps réel
- [ ] Étape 6 : Paiements CIB/Edahabia
