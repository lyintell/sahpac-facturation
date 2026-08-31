# SAHPAC Facturation

Application web de facturation pour SAHPAC : créer des factures (pro forma et définitives), gérer les clients, et enregistrer les paiements (y compris partiels).

Origine : projet démarré sur Lovable, puis transféré en local. Interface en français, montants en **FCFA**, TVA par défaut **18 %**.

Prod : [app-facturation.sahpac.com](https://app-facturation.sahpac.com) (GitHub Pages).

---

## Features

**Auth**
- Connexion / inscription (email + mot de passe, Supabase Auth)
- Mot de passe oublié + page de réinitialisation
- Changement de mot de passe (admin)
- Routes protégées : l’app principale exige d’être connecté

**Clients**
- CRUD (nom, adresse, téléphone)
- Recherche, historique des factures d’un client
- Totaux : facturé / payé / reliquat
- Créer une facture depuis un client

**Factures**
- Pro forma ou définitive, numérotation séparée (`001 / 26` = n° / année)
- Conversion pro forma → facture définitive (lien `proforma_id`, option TVA)
- Copie, édition, suppression
- Un ou plusieurs types d’intervention, zones, description des travaux, fréquence, constats, observations
- TVA optionnelle, totaux séparés par type d’intervention si besoin
- Filtres : type, paiement, dates, recherche
- Stats : total, payé, reliquat
- Paiements partiels (`paid_amount`) ; statut `pending` / `paid`
- Aperçu, impression, export PDF

**Référentiels (admin)**
- Types d’intervention (nom, description, prix standard)
- Zones d’intervention

**PWA** : installable (Vite PWA, mise à jour auto).

---

## Structure du projet

```
sahpac-facturation/
├── 0_docs/                 Documentation interne
├── src/
│   ├── App.tsx             Routes
│   ├── main.tsx
│   ├── pages/              Auth, ResetPassword, Index, NotFound
│   ├── components/         Métier + Header + ProtectedRoute
│   │   └── ui/             shadcn/ui (kit complet, peu utilisé)
│   ├── hooks/              Auth, clients, factures, zones, types d’intervention
│   ├── types/              Modèles métier (Client, Invoice, …)
│   ├── integrations/supabase/  Client + types générés
│   ├── assets/             Logo
│   └── lib/utils.ts
├── supabase/migrations/    Schéma Postgres + RLS
├── public/
├── dist/                   Build (déploiement Pages)
├── .github/workflows/      Deploy GitHub Pages (push sur main)
├── CNAME                   app-facturation.sahpac.com
├── InitialisationDB.sql    Script schéma (référence, hors migrations)
└── Seperate_proforma_definitive.sql  Index n° unique par type + proforma_id
```

**Composants métier**

| Fichier | Rôle |
|---|---|
| `InvoiceList.tsx` | Liste, filtres, stats, paiement, conversion |
| `InvoiceForm.tsx` | Création / édition |
| `InvoicePreview.tsx` | Aperçu, print, PDF, paiement |
| `ClientManager.tsx` | Clients + factures liées |
| `AdminPanel.tsx` | Types, zones, mot de passe |

**Hooks** : `useAuth`, `useClients`, `useInvoices`, `useZones`, `useInterventionTypes`. Accès direct à Supabase (pas React Query malgré le provider).

**Routes** : `/` (app), `/auth`, `/reset-password`. L’app interne est un onglet (`invoices` / `clients` / `new` / `admin`), pas des URLs distinctes.

---

## Architecture

```
Navigateur (SPA + PWA)
    → Vite / React 18 / TypeScript
    → Supabase JS (Auth + Postgres)
```

| Couche | Techno |
|---|---|
| Front | React 18, Vite 5, TypeScript, React Router 6 |
| UI | Tailwind, shadcn/ui, Radix, lucide-react, sonner |
| Forms / dates | react-hook-form, zod, date-fns (locale `fr`) |
| PDF | jspdf + html2canvas |
| Backend | Supabase (Postgres, Auth, RLS) |
| Deploy | GitHub Actions → GitHub Pages |
| Dev | port **8080**, alias `@` → `src/` |

**Env** (`.env`) : `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`.

**Données (tables)** : `clients`, `invoices`, `zones`, `intervention_types`. Chaque ligne a un `user_id` (créateur). Les politiques RLS actuelles : tout utilisateur **authentifié** voit / modifie / supprime **toutes** les données (partage d’équipe, plus isolation par user).

**Facture (points notables)**
- Multi-interventions stockées en JSON dans `intervention_description` (compat anciennes factures texte).
- Numéros uniques par couple (`invoice_number`, `is_pro_forma`).
- `paid_amount` pour les acomptes.

---

## Autres détails

- Lancer : `npm i` puis `npm run dev`. Build : `npm run build`.
- Node 20 en CI. `lovable-tagger` actif en mode dev.
- `QueryClient` est monté mais les hooks n’utilisent pas React Query.
- `useLocalStorage` et une grande partie de `src/components/ui/` sont du kit Lovable, peu ou pas utilisés.
- Playwright + `playwright-fixture.ts` : config Lovable, pas de suite e2e réelle.
- Scripts SQL à la racine : `InitialisationDB.sql` (schéma complet) ; `Seperate_proforma_definitive.sql` n’est pas dans `supabase/migrations/` (colonne `proforma_id` déjà présente côté types générés).
- `dist/` n’est pas ignoré par git. `.gitignore` n’ignore pas `.env`.
- Fichiers sensibles à ne pas committer : `.env`, `Secrets.txt.txt`.
- README encore le template Lovable (pas à jour).
- PWA : `navigateFallbackDenylist` pour `/~oauth` (auth Lovable / OAuth).
