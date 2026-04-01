# Guide d'intégration Cha9a9a

## Vue d'ensemble

Votre système de paiement utilise maintenant **deux passerelles** :

### 🧪 Mode Test : Flouci
- **Objectif :** Tester le flux de paiement sans argent réel
- **Utilisation :** Développement local, démonstrations
- **Coût :** GRATUIT - aucune transaction réelle

### 💳 Mode Production : Cha9a9a
- **Objectif :** Traitement réel des paiements
- **Utilisation :** Production avec de vrais clients
- **Coût :** Transactions réelles via Cha9a9a

---

## Configuration

### Variables d'environnement

Votre fichier [.env](.env) contient maintenant :

```env
# Cha9a9a Payment Gateway (Production)
CHA9A9A_API_KEY=your_cha9a9a_api_key_here
CHA9A9A_API_SECRET=your_cha9a9a_secret_here
CHA9A9A_MERCHANT_ID=your_merchant_id_here
CHA9A9A_WEBHOOK_SECRET=your_webhook_secret_here
CHA9A9A_API_URL=https://api.cha9a9a.tn/v1/payment

# Flouci (Test Mode Only)
FLOUCI_APP_TOKEN=your_flouci_app_token_here
FLOUCI_APP_SECRET=your_flouci_app_secret_here

# Mode de paiement
PAYMENT_TEST_MODE=true  # true = Flouci (test), false = Cha9a9a (production)
```

---

## Architecture du système

### Flux de paiement

```
┌─────────────────────┐
│   Utilisateur       │
│   Clique "Payer"    │
└──────────┬──────────┘
           │
           v
┌─────────────────────────────────────┐
│   Backend vérifie PAYMENT_TEST_MODE │
└──────────┬─────────────┬────────────┘
           │             │
    TEST   │             │  PRODUCTION
   (true)  │             │  (false)
           v             v
   ┌──────────────┐  ┌──────────────┐
   │   Flouci     │  │   Cha9a9a    │
   │   (Test)     │  │ (Production) │
   │              │  │              │
   │ • Simulation │  │ • Vrai API   │
   │ • Gratuit    │  │ • Argent réel│
   │ • Instantané │  │ • Webhooks   │
   └──────────────┘  └──────────────┘
```

---

## Fichiers créés/modifiés

### 1. **`server/_core/cha9a9a-payment.ts`** (Nouveau)
Service d'intégration Cha9a9a :
```typescript
export async function createCha9a9aPayment(...)
export function verifyCha9a9aWebhookSignature(...)
export async function getCha9a9aPaymentStatus(...)
```

### 2. **`server/_core/payment.ts`** (Modifié)
Routage intelligent entre Cha9a9a et Flouci :
```typescript
export async function createPayment() {
  if (PAYMENT_TEST_MODE) {
    return createFlouciPaymentInternal(); // Test
  }
  return createCha9a9aPayment(); // Production
}
```

### 3. **`server/_core/index.ts`** (Modifié)
Endpoint mis à jour pour supporter les deux passerelles :
```typescript
const paymentMethod = PAYMENT_TEST_MODE ? "flouci" : "cha9a9a";
const gatewayPayment = await createPaymentGateway(...);
```

### 4. **`client/src/pages/CaseDetail.tsx`** (Modifié)
Détection du mode de test/production :
```typescript
const isTestPayment = res.data.payment_id?.startsWith("test_flouci_");
```

---

## Comment tester

### Mode Test (Flouci) - Actuellement actif

1. **Serveur démarré** : http://localhost:3004/
2. **Cliquez "Support Now"** sur n'importe quel cas
3. **Résultat** :
   ```
   ✅ TEST MODE (Flouci): Payment simulated successfully!

   Payment ID: test_flouci_1234567890
   Amount: XXX TND

   This is a test payment. No real money was charged.
   ```

### Logs du serveur (Mode Test)
```
[Payment] ⚠️  TEST MODE - Using Flouci (no real transaction)
[Flouci] Creating test payment: amount=100, description=Test
[Flouci] ✅ Test payment created: test_flouci_1234567890
[Payment] ⚠️  TEST MODE (Flouci) - Auto-completing test payment
[Payment] ✅ Test payment auto-completed and case amount updated
```

---

## Configuration Cha9a9a pour Production

### Étape 1 : Obtenir les identifiants Cha9a9a

1. **Inscription :** https://cha9a9a.tn/signup
2. **Créer une application** dans votre tableau de bord
3. **Obtenir vos identifiants** :
   - API Key
   - API Secret
   - Merchant ID
   - Webhook Secret

### Étape 2 : Mettre à jour `.env`

```env
# Production Cha9a9a
CHA9A9A_API_KEY=prod_abc123xyz789
CHA9A9A_API_SECRET=secret_prod_xyz789abc123
CHA9A9A_MERCHANT_ID=merchant_12345
CHA9A9A_WEBHOOK_SECRET=webhook_secret_prod_abc123

# Désactiver le mode test
PAYMENT_TEST_MODE=false
```

### Étape 3 : Configurer le Webhook

Dans votre tableau de bord Cha9a9a :
```
URL Webhook : https://votredomaine.com/api/payments/webhook/cha9a9a
Événements :
  ✓ payment.completed
  ✓ payment.failed
  ✓ payment.cancelled
```

### Étape 4 : Tester en production

1. Déployer l'application
2. Faire un paiement test avec une vraie carte
3. Vérifier que le webhook est reçu
4. Confirmer la mise à jour du montant

---

## Structure de l'API Cha9a9a

### Créer un paiement
```http
POST https://api.cha9a9a.tn/v1/payment/create
Authorization: Bearer {CHA9A9A_API_KEY}
X-API-Secret: {CHA9A9A_API_SECRET}
Content-Type: application/json

{
  "merchant_id": "merchant_12345",
  "amount": 100,
  "currency": "TND",
  "description": "Donation pour cas X",
  "success_url": "https://yourapp.com/success",
  "cancel_url": "https://yourapp.com/cancel",
  "callback_url": "https://yourapp.com/api/payments/webhook/cha9a9a",
  "reference": "payment_1234567890",
  "customer": {
    "email": "donor@example.com",
    "name": "Donor Name"
  }
}
```

### Réponse
```json
{
  "payment_id": "cha9a9a_xyz789abc123",
  "payment_url": "https://pay.cha9a9a.tn/xyz789",
  "status": "pending",
  "created_at": "2026-02-07T21:00:00Z"
}
```

### Webhook (Paiement réussi)
```json
{
  "event": "payment.completed",
  "payment_id": "cha9a9a_xyz789abc123",
  "amount": 100,
  "currency": "TND",
  "reference": "payment_1234567890",
  "status": "completed",
  "timestamp": "2026-02-07T21:05:00Z"
}
```

---

## Tableau de comparaison

| Fonctionnalité | Flouci (Test) | Cha9a9a (Production) |
|----------------|---------------|----------------------|
| **Mode** | 🧪 Test | 💳 Production |
| **Argent réel** | ❌ Non | ✅ Oui |
| **Appels API** | ❌ Simulés | ✅ Réels |
| **Webhooks** | ❌ Auto | ✅ Réels |
| **Coût** | 💰 Gratuit | 💰 Frais de transaction |
| **Vitesse** | ⚡ Instantané | ⏱️ Normal |
| **ID Paiement** | `test_flouci_*` | `cha9a9a_*` |
| **Configuration** | `.env` uniquement | Identifiants + Webhooks |

---

## Dépannage

### Erreur : "Invalid API credentials"

**Cause :** Identifiants Cha9a9a incorrects

**Solution :**
```bash
# Vérifier les variables d'environnement
echo $CHA9A9A_API_KEY
echo $CHA9A9A_API_SECRET
echo $CHA9A9A_MERCHANT_ID
```

### Erreur : "Webhook signature verification failed"

**Cause :** Secret webhook incorrect

**Solution :**
```env
# Vérifier et mettre à jour
CHA9A9A_WEBHOOK_SECRET=correct_secret_here
```

### Le paiement reste en "pending"

**Causes possibles :**
1. Webhook non configuré
2. URL webhook incorrecte
3. Signature webhook invalide

**Solution :**
```bash
# Vérifier les logs du webhook
tail -f server.log | grep "webhook"
```

---

## Tests automatisés

Les tests continuent de fonctionner avec le mode test :

```bash
pnpm test payment
```

**Résultat attendu :** ✅ 14/14 tests passed

---

## Base de données

### Table `payments`

```sql
SELECT
  id,
  case_id,
  amount,
  status,
  payment_method,  -- 'flouci' (test) ou 'cha9a9a' (prod)
  transaction_id,  -- 'test_flouci_*' ou 'cha9a9a_*'
  payment_url,
  created_at
FROM payments
ORDER BY created_at DESC;
```

### Exemple Test Mode
```
id: 7
case_id: 1
amount: 1234
status: completed
payment_method: flouci
transaction_id: test_flouci_1770498052484
```

### Exemple Production Mode
```
id: 8
case_id: 2
amount: 5000
status: pending
payment_method: cha9a9a
transaction_id: cha9a9a_xyz789abc123
payment_url: https://pay.cha9a9a.tn/xyz789
```

---

## Checklist de déploiement

### Avant le déploiement

- [ ] Obtenir les identifiants Cha9a9a production
- [ ] Mettre à jour `.env` avec les vrais identifiants
- [ ] Configurer le webhook dans Cha9a9a
- [ ] Tester avec un petit montant
- [ ] Vérifier que le webhook fonctionne
- [ ] Confirmer la mise à jour de la base de données

### Configuration Production

```env
# ⚠️ IMPORTANT : Changer en false pour la production
PAYMENT_TEST_MODE=false

# ✅ Identifiants réels
CHA9A9A_API_KEY=prod_real_key_here
CHA9A9A_API_SECRET=prod_real_secret_here
CHA9A9A_MERCHANT_ID=prod_merchant_id_here
CHA9A9A_WEBHOOK_SECRET=prod_webhook_secret_here
```

### Après le déploiement

- [ ] Faire un paiement test avec une vraie carte
- [ ] Vérifier que le paiement apparaît dans Cha9a9a
- [ ] Confirmer la réception du webhook
- [ ] Vérifier la mise à jour du statut
- [ ] Tester le remboursement (si applicable)

---

## Support

### Documentation

- **Cha9a9a :** https://docs.cha9a9a.tn
- **Flouci (référence) :** https://developers.flouci.com

### Logs utiles

```bash
# Voir tous les paiements
grep "\[Payment\]" server.log

# Voir Cha9a9a uniquement
grep "\[Cha9a9a\]" server.log

# Voir Flouci uniquement
grep "\[Flouci\]" server.log

# Voir les webhooks
grep "webhook" server.log
```

---

## Résumé

✅ **Configuration actuelle :**
- Mode Test activé (Flouci)
- Cha9a9a configuré et prêt pour la production
- Système flexible avec switch test/production

🎯 **Pour passer en production :**
1. Obtenir identifiants Cha9a9a
2. Mettre `PAYMENT_TEST_MODE=false`
3. Configurer webhooks
4. Tester et déployer

🚀 **Votre système de paiement est maintenant prêt pour Cha9a9a !**
