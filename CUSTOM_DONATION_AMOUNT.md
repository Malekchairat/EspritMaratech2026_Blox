# Fonctionnalité : Montant de don personnalisé

## Vue d'ensemble

Les utilisateurs peuvent maintenant **saisir le montant exact** qu'ils souhaitent donner, au lieu d'être obligés de donner le montant total du cas.

---

## Ce qui a été modifié

### Fichier : [client/src/pages/CaseDetail.tsx](client/src/pages/CaseDetail.tsx)

#### 1. Ajout d'un état pour le montant de don
```typescript
const [donationAmount, setDonationAmount] = useState<string>("");
```

#### 2. Validation du montant avant le paiement
```typescript
async function handleFlouciPay() {
  // Valider le montant de don
  const amount = parseFloat(donationAmount);
  if (!donationAmount || isNaN(amount) || amount <= 0) {
    setPaymentError("Please enter a valid amount greater than 0");
    return;
  }

  // Utiliser le montant saisi au lieu du montant total
  const res = await axios.post("/api/payments/flouci", {
    amount: amount, // ✅ Montant personnalisé
    // ...
  });
}
```

#### 3. Interface utilisateur : Champ de saisie
```tsx
<div className="space-y-2">
  <label>Donation Amount (TND)</label>
  <input
    type="number"
    min="1"
    step="0.01"
    value={donationAmount}
    onChange={(e) => setDonationAmount(e.target.value)}
    placeholder="Enter amount..."
  />
  <span>TND</span>
  <p>Remaining: {remaining} TND</p>
</div>
```

#### 4. Bouton désactivé sans montant
```tsx
<Button
  onClick={handleFlouciPay}
  disabled={isPaying || !donationAmount} // ✅ Désactivé si vide
>
  Support Now
</Button>
```

---

## Fonctionnalités

### ✅ Ce qui fonctionne maintenant :

1. **Champ de saisie personnalisé**
   - Type : Number
   - Min : 1
   - Step : 0.01 (permet les centimes)
   - Placeholder : "Enter amount..."

2. **Validation du montant**
   - Vérifie que le champ n'est pas vide
   - Vérifie que le montant > 0
   - Affiche un message d'erreur si invalide

3. **Affichage du montant restant**
   - Montre combien il reste à collecter
   - Calcul : `targetAmount - currentAmount`

4. **Bouton intelligent**
   - Désactivé si aucun montant n'est saisi
   - Désactivé pendant le traitement

---

## Interface utilisateur

### Avant (Ancien comportement) :
```
┌─────────────────────────┐
│ [Support Now - 1000 TND]│
└─────────────────────────┘
```
Problème : Obligé de donner tout le montant

### Après (Nouveau comportement) :
```
┌─────────────────────────────┐
│ Donation Amount (TND)       │
│ ┌─────────────────────┐     │
│ │ [   50.00    ] TND  │     │
│ └─────────────────────┘     │
│ Remaining: 950.00 TND       │
│                             │
│ [  Support Now  ]           │
└─────────────────────────────┘
```
✅ Liberté de choisir le montant

---

## Exemples d'utilisation

### Cas 1 : Don partiel
```
Target: 1000 TND
Current: 200 TND
Remaining: 800 TND

Utilisateur saisit: 50 TND
Résultat: Don de 50 TND enregistré
Nouveau solde: 250 TND / 1000 TND
```

### Cas 2 : Don complet
```
Target: 1000 TND
Current: 950 TND
Remaining: 50 TND

Utilisateur saisit: 50 TND
Résultat: Don de 50 TND enregistré
Nouveau solde: 1000 TND / 1000 TND ✅ OBJECTIF ATTEINT
```

### Cas 3 : Don supérieur à l'objectif
```
Target: 1000 TND
Current: 980 TND
Remaining: 20 TND

Utilisateur saisit: 100 TND
Résultat: Don de 100 TND accepté
Nouveau solde: 1080 TND / 1000 TND (108% atteint)
```

---

## Validation et messages d'erreur

### Erreurs gérées :

1. **Champ vide**
   ```
   Utilisateur clique sans saisir
   → Message: "Please enter a valid amount greater than 0"
   → Bouton désactivé
   ```

2. **Montant = 0**
   ```
   Utilisateur saisit: 0
   → Message: "Please enter a valid amount greater than 0"
   ```

3. **Montant négatif**
   ```
   Utilisateur saisit: -10
   → Empêché par l'attribut min="1" du input
   ```

4. **Montant non numérique**
   ```
   Utilisateur saisit: "abc"
   → isNaN() détecte et rejette
   → Message: "Please enter a valid amount greater than 0"
   ```

---

## Code clé

### Validation avant envoi
```typescript
const amount = parseFloat(donationAmount);

// Vérifications
if (!donationAmount) {
  // Champ vide
  setPaymentError("Please enter a valid amount");
  return;
}

if (isNaN(amount)) {
  // Pas un nombre
  setPaymentError("Please enter a valid amount");
  return;
}

if (amount <= 0) {
  // Montant <= 0
  setPaymentError("Amount must be greater than 0");
  return;
}

// ✅ Montant valide, procéder au paiement
```

---

## Tests

### Test 1 : Saisie normale
```
1. Ouvrir un cas
2. Saisir "50" dans le champ
3. Cliquer "Support Now"
4. ✅ Paiement de 50 TND créé
```

### Test 2 : Sans saisie
```
1. Ouvrir un cas
2. Ne rien saisir
3. Bouton désactivé ❌
4. ✅ Impossible de cliquer
```

### Test 3 : Montant invalide
```
1. Ouvrir un cas
2. Saisir "0"
3. Cliquer "Support Now"
4. ✅ Message d'erreur affiché
```

### Test 4 : Décimales
```
1. Ouvrir un cas
2. Saisir "25.50"
3. Cliquer "Support Now"
4. ✅ Paiement de 25.50 TND créé
```

---

## Mode Test (Flouci)

Avec `PAYMENT_TEST_MODE=true` :

```
Input: 75 TND
Click: Support Now

Alert:
✅ TEST MODE (Flouci): Payment simulated successfully!

Payment ID: test_flouci_1234567890
Amount: 75 TND

This is a test payment. No real money was charged.
```

✅ Le montant dans l'alerte correspond au montant saisi

---

## Mode Production (Cha9a9a)

Avec `PAYMENT_TEST_MODE=false` :

```
Input: 100 TND
Click: Support Now

Redirect: https://pay.cha9a9a.tn/xyz789
Amount: 100 TND
```

✅ Redirection vers Cha9a9a avec le montant exact

---

## Avantages

### ✅ Pour les donateurs :
- Liberté de choisir le montant
- Peut faire plusieurs petits dons
- Voit combien il reste à collecter
- Interface claire et intuitive

### ✅ Pour les bénéficiaires :
- Plus de flexibilité = plus de dons
- Encourage les dons partiels
- Peut atteindre l'objectif progressivement

### ✅ Pour le système :
- Validation robuste
- Messages d'erreur clairs
- Compatible avec test/production
- Enregistrement exact dans la base de données

---

## Base de données

Les paiements sont enregistrés avec le montant exact :

```sql
SELECT
  id,
  case_id,
  amount,        -- ✅ Montant personnalisé (ex: 50, 75, 100)
  status,
  payment_method,
  created_at
FROM payments
ORDER BY created_at DESC;
```

### Exemple :
```
id: 8
case_id: 3
amount: 50      ✅ Montant saisi par l'utilisateur
status: completed
payment_method: flouci
```

---

## Internationalisation

Pour ajouter des traductions :

```json
{
  "caseDetail": {
    "donationAmountLabel": "Montant du don (TND)",
    "enterAmount": "Saisir le montant...",
    "remainingAmount": "Restant:"
  },
  "payment": {
    "errors": {
      "invalidAmount": "Veuillez saisir un montant valide supérieur à 0"
    }
  }
}
```

---

## Résumé

✅ **Fonctionnalité implémentée avec succès**

**Avant :** Don forcé du montant total
**Après :** Don personnalisé au choix de l'utilisateur

**Changements :**
- ✅ Champ de saisie ajouté
- ✅ Validation du montant
- ✅ Bouton intelligent (désactivé si vide)
- ✅ Affichage du montant restant
- ✅ Compatible test/production

**Test :** Ouvrez http://localhost:3004/ et essayez !
