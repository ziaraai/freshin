# Reprendre une installation Plesk interrompue

Le correctif limite a deux les liens de prechargement transmis dans les en-tetes
HTTP. Avec le build fourni, /login renvoyait 4179 octets de valeurs d'en-tetes,
contre 1134 apres correction, ce qui evite la limite nginx courante de 4 Ko.

L'assistant d'origine marquait l'application installee meme apres une erreur de
migration. Le correctif arrete la finalisation apres un echec, controle les codes
de retour de migrate et db:seed et empeche deux installations simultanees.
Il ne modifie ni ne supprime les tables deja creees.

## Installation neuve deja echouee

1. Extraire Freshin-installation-hotfix.zip dans la RACINE du projet (le dossier
   contenant artisan, app et bootstrap), en remplacant les fichiers du correctif.
   Aucun .env, identifiant, fichier utilisateur ou base n'est inclus dans le ZIP.
2. Dans Plesk, creer une NOUVELLE base MySQL/MariaDB vide et son utilisateur.
   Conserver l'ancienne base pour diagnostic. Ne pas supprimer les tables
   manuellement et ne pas utiliser migrate:fresh.
3. Dans le gestionnaire de fichiers Plesk, renommer storage/installed en
   storage/installed.failed si ce fichier existe. Ne pas modifier .env a ce stade.
4. Ouvrir https://freshin.space/install et saisir les identifiants de la nouvelle
   base dans l'assistant. Cliquer une fois sur Install et attendre le resultat.
5. Si une erreur reapparait, conserver la sortie et relever les erreurs associees
   dans storage/logs/laravel.log ; ne pas partager de mots de passe ni le .env.

Une base contenant deja order_items alors que sa migration est encore en attente
est un etat partiel. La cause initiale exacte requiert les journaux de la premiere
execution ; il ne faut pas masquer l'erreur en ignorant l'existence de la table.

L'erreur nginx relevee etait : upstream sent too big header while reading
response header from upstream. Elle ne prouve pas un arret du service PHP-FPM.
