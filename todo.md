# TODO - Universelle Cellule Ariana

## Phase 1: Architecture et Planification
- [ ] Créer le schéma de base de données complet
- [ ] Définir les types TypeScript partagés

## Phase 2: Base de Données
- [x] Table users avec rôles (association, donateur, administrateur)
- [x] Table cases (cas sociaux) avec catégories
- [x] Table donations (dons) avec traçabilité
- [x] Table events (événements solidaires)
- [x] Table case_views (statistiques de vues)
- [x] Table case_photos (photos multiples par cas)
- [x] Générer et appliquer les migrations SQL

## Phase 3: Design System et Accessibilité
- [x] Configurer la palette de couleurs émotionnelle (bleu confiance, rouge urgence, teintes chaleureuses)
- [x] Implémenter le mode sombre/clair avec contraste élevé
- [x] Ajouter le système de taille de police ajustable
- [x] Intégrer les ARIA labels pour lecteurs d'écran
- [x] Configurer la navigation au clavier complète
- [x] Créer les palettes inclusives pour daltonisme
- [x] Implémenter les animations réduites (prefers-reduced-motion)
- [x] Optimiser le texte (line-height, letter-spacing, font-size)
- [x] Vérifier les ratios de contraste WCAG AAA

## Phase 4: Authentification et Permissions
- [x] Système d'authentification par email/mot de passe (JWT)
- [x] Gestion des trois rôles (Association, Donateur, Administrateur)
- [x] Middleware de protection des routes par rôle
- [ ] Page de sélection de rôle après inscription
- [x] Procédures tRPC protégées par rôle

## Phase 5: Pages Publiques
- [x] Page d'accueil émotionnelle avec hero section
- [x] Liste des cas sociaux avec cartes visuelles
- [x] Système de filtrage par catégories (santé, handicap, enfants, éducation, rénovation)
- [x] Recherche par mots-clés
- [x] Tri par urgence/date
- [x] Page détaillée d'un cas avec histoire complète
- [x] Galerie de photos pour chaque cas
- [x] Bouton "Soutenir maintenant" vers Cha9a9a
- [x] Barre de progression des dons

## Phase 6: Fonctionnalités Associations
- [x] Formulaire simplifié d'ajout de cas social
- [x] Upload multiple de photos avec S3
- [x] Champ lien Cha9a9a obligatoire
- [x] Sélection de catégorie
- [ ] Tableau de bord association
- [ ] Statistiques des dons par cas
- [ ] Nombre de vues par publication
- [ ] Historique des cas publiés
- [ ] Gestion des événements solidaires (CRUD)
- [ ] Édition et suppression de cas

## Phase 7: Fonctionnalités Donateurs
- [ ] Système de suivi des dons
- [ ] Historique personnel des dons
- [ ] Visualisation de l'impact (graphiques)
- [ ] Page de profil donateur
- [ ] Statistiques personnelles (montant total, nombre de cas soutenus)
- [ ] Favoris/bookmarks de cas

## Phase 8: Tableau de Bord Administrateur
- [ ] Dashboard avec statistiques globales
- [ ] Graphiques des dons collectés (journalier/mensuel)
- [ ] Modération des cas (approuver/rejeter)
- [ ] Suivi des cas urgents
- [ ] Gestion des événements (création/modification/suppression)
- [ ] Gestion des utilisateurs
- [ ] Statistiques détaillées par catégorie

## Phase 9: Notifications et Assistant Virtuel
- [ ] Système de notifications automatiques par email
- [ ] Notification au propriétaire lors de nouveaux dons
- [ ] Notification aux associations lors de dons sur leurs cas
- [ ] Notification lors de publication de nouveaux cas
- [ ] Résumés statistiques périodiques
- [ ] Assistant virtuel intelligent avec LLM
- [ ] Recherche conversationnelle de cas sociaux
- [ ] Réponses aux questions fréquentes
- [ ] Recommandations personnalisées basées sur préférences

## Phase 10: Documentation Technique
- [x] Fichier requirements.txt détaillé
- [x] Guide d'installation pas à pas
- [x] Documentation de l'architecture
- [x] Schéma de la base de données
- [x] Guide d'utilisation pour chaque rôle
- [x] Documentation API tRPC
- [x] Guide de contribution

## Phase 11: Page de Présentation Interactive
- [x] Créer une page web statique de présentation
- [x] Graphiques interactifs des fonctionnalités
- [x] Visualisation de l'architecture
- [x] Démonstration des fonctionnalités d'accessibilité
- [x] Captures d'écran de l'interface

## Phase 12: Tests et Livraison
- [ ] Tests unitaires avec Vitest
- [ ] Tests d'accessibilité
- [ ] Vérification WCAG AAA
- [ ] Checkpoint final
- [ ] Livraison complète
