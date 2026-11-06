# Freshin — vérification du 6 novembre 2026

## État repris

L'archive fournie a été restaurée sur le commit
`060b9b29537de97ea1ab4fe1980fa823eaabeaa6`, dans `/workspace/freshin`.
Les fichiers restaurés correspondaient aux sommes SHA-256 du manifeste.
Le checkout attaché utilise la branche `work` ; aucun commit, push ou déploiement
n'a été effectué. Aucun fichier `.env` existant, identifiant ou base existante
n'a été modifié. La migration de livraison a été exécutée uniquement dans les
bases SQLite en mémoire des tests.

## Résultat

- Dépendances Composer réellement installées dans `vendor`, scripts de découverte
  inclus. `composer validate --no-check-publish` et `composer check-platform-reqs`
  réussissent avec PHP 8.4.24.
- 32 packages retirés : 10 SDK de paiement et 22 dépendances transitives.
  Aucune version des packages conservés n'a changé par rapport au verrou initial.
- `npm ci` réussi ; `npm run build` réussi. Vite signale seulement des fichiers
  JavaScript volumineux après minification.
- **71 tests réussis, 310 assertions**, en 7,75 secondes : horaires GMT/BST,
  fermeture, dates invalides, paramètres et propriété du magasin, domaine
  personnalisé, COD, Stripe simulé, échec Stripe sans perte de panier/stock,
  API sans secret, sauvegarde d'une clé secrète inchangée et abonnement SaaS.
- TypeScript : **948 erreurs restantes contre 966 au commit initial**.
  La comparaison par fichier, code d'erreur et expression concernée ne relève
  aucune nouvelle erreur. Le contrôle global TypeScript reste donc en échec.
- Routes chargées : aucun contrôleur applicatif manquant et aucune route des
  anciennes passerelles. Routes Ziggy régénérées.
- Syntaxe PHP contrôlée et `git diff --check` réussi.

## Corrections après restauration

Les sept thèmes avaient un attribut `store` dupliqué sur la confirmation de
commande ; ces doublons ont été retirés. Le type du formulaire de paiement a
été corrigé, ainsi que le type d'adresse des factures.

Les bibliothèques des anciennes passerelles, options restantes des écrans de
configuration, exemptions CSRF obsolètes et test Razorpay ont été nettoyés.
L'ancien test Stripe, qui exigeait l'exposition du secret, vérifie désormais
son absence. Les champs historiques des commandes et reçus ont été conservés.

Les produits sont verrouillés en transaction lors du contrôle et de la réduction
du stock. Sur domaine personnalisé, placer une commande exige désormais POST.
Les messages d'erreur des commandes et du retour Stripe ne renvoient pas de
messages techniques internes. Les paramètres publics des vitrines utilisent
une liste de champs autorisés pour éviter de sérialiser les identifiants.

Le paiement SaaS Stripe utilise le compte superadmin réellement configuré,
sa devise, le calcul serveur du prix et sa clé d'activation, sans adresse de
livraison fictive.

## Activation sur le magasin réel

1. Installer les dépendances verrouillées (`composer install`, `npm ci`).
2. Avec l'environnement applicatif habituel configuré, exécuter
   `php artisan migrate`, puis `npm run build`. Ne pas utiliser `migrate:fresh`.
3. Dans les réglages de devise du magasin, sélectionner **GBP**.
4. Dans **Settings → Payment Settings**, activer **Cash on Delivery**.
   Activer Stripe séparément avec les deux clés correspondantes, d'abord en
   mode test. Laisser le champ secret vide conserve la clé déjà enregistrée.
5. Dans **Stores → Settings → Ordering & Delivery**, choisir les vrais jours et
   horaires de commande, les jours de livraison et la fenêtre de réservation,
   activer le planning puis enregistrer. Europe/London suit automatiquement
   GMT/BST. Les valeurs lundi–vendredi 09:00–17:00 sont des exemples modifiables.
6. Le widget de contact WhatsApp reste dans les réglages du magasin,
   indépendamment des moyens de paiement.

## Reproduction des tests et limites

```sh
php vendor/bin/pest tests/Unit/OrderingScheduleTest.php tests/Unit/OrderingScheduleHttpTest.php tests/Feature/StripePaymentTest.php
npm run build
npm run types
```

Un fichier local temporaire `.env.testing`, contenant uniquement une clé
publique de fixture et une configuration SQLite en mémoire, a servi aux tests.
Il est exclu de l'export. Aucun service Stripe ou WhatsApp réel n'a été appelé
par les tests. Les paiements 3-D Secure, webhooks Stripe, rapprochement après
abandon de paiement et parcours visuel sur un vrai navigateur ne sont pas
validés par ces tests. La suite complète des tests hérités, en dehors des trois
fichiers ci-dessus, n'a pas été exécutée.

Les horaires restent désactivés par défaut. Aucun horaire commercial réel,
moyen de paiement réel ou changement de base de production n'a été activé.

## Package Plesk et publication GitHub

Le package de distribution contient les dependances de production et le frontend
compile. Il ne contient pas de .env, de cle applicative ou de base : le premier
appel web cree une nouvelle cle sur le serveur a partir de .env.example, sans
ecraser de fichier .env existant. Le bootstrap a trois tests dedies.
L'assistant /install repond HTTP 200 sans base configuree. Le seeding doit etre
realise sous MySQL/MariaDB : le seeder initial utilise RLIKE et ne fonctionne
pas entierement sur SQLite. Aucun deploiement sur freshin.space n'a ete fait.

Validation finale pour GitHub : **74 tests reussis, 316 assertions** (dont
trois tests du bootstrap d'installation). La configuration accepte egalement
les noms de variables CACHE_DRIVER, QUEUE_DRIVER et MAIL_DRIVER ecrits par
l'assistant d'installation historique.
