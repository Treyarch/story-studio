Status: resolved
Type: task
Blocked by: 02, 03

# Générer et installer une création visuelle sur FLAM

## Objectif

Relier le document d’auteur et le runtime du ticket 03 à un contenu contrôlé,
puis au transfert sur l’appareil. Voir la [spécification](../spec.md).

## Réalisation

- Générer données et ressources à partir du document courant validé, sans
  insertion de texte de l’auteur comme code Lua exécutable.
- Résoudre les médias et produire le profil audio validé ; un texte sans
  piste n’est pas présenté comme une narration générée.
- Contrôler manifeste, chemins, ressources, identité et syntaxe du contenu.
  Ne publier le résultat qu’après réussite des contrôles.
- Intégrer progression, annulation et erreurs au parcours de génération.
- Réutiliser les protections démontrées par l’installateur expérimental :
  refus de remplacement, sauvegarde liste/cache, relecture, annulation et
  préservation des autres histoires et parties.
- Livrer une nouvelle aventure ; refuser la mise à jour d’une identité déjà
  installée tant que sa politique de compatibilité n’est pas définie.

## Acceptation

Un projet enregistré puis rouvert produit un contenu exécuté par le harnais
Lua. Des textes contenant guillemets, accents et délimiteurs Lua restent des
données. Un média absent ou un document invalide produit un refus sans contenu
partiel présenté comme prêt. Les tests sur volume synthétique démontrent
annulation, refus de remplacement et conservation des histoires témoins.
La génération n’implique pas une installation automatique.

## Résultat

Génération et installation disponibles dans le panneau de l’éditeur FLAM,
avec préparation des médias, manifeste vérifié, runtime embarqué et transfert
explicite vers une identité neuve. Annulation, refus de remplacement,
sauvegardes locales, relecture et préservation des histoires témoins sont
exercés sur des volumes synthétiques. Le vrai pack produit passe le harnais
Lua avec et sans narration.

Voir la [validation du lot 04](../validation-04.md) pour les contrôles et
les limites. Le parcours sur la FLAM réelle reste au ticket 05.
