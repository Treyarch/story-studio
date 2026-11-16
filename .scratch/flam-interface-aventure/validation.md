# Validation de l’interface illustrée FLAM

## État

Implémentation locale et parcours automatisés réalisés. La vérification sur
FLAM réelle reste à effectuer ; aucun résultat matériel n’est déduit des
services hôtes simulés. Le ticket conserve son statut ouvert jusqu’à ce contrôle.

## Contrôles locaux

- Données d’auteur → vrai runtime Lua : menu, consultation, interruption de
  réécoute, progression des deux classes, inventaire, carnet, écoutes complètes,
  refus de sauvegarde, callbacks périmés, reprise et nouveau départ.
- Pack de production Rust → même parcours Lua, avec préparation des images LIF
  et des pistes audio ; contrôle indépendant du premier pixel et des dimensions.
- Formulaires → store réel : réglages, activation, édition, médias, annulation,
  rétablissement et passages des chapitres.
- Sauvegarde sur disque → déplacement → réouverture : médias du menu, des
  rubriques, des entrées, des objets et des chapitres.

## Résultats des commandes

- `node --test scripts/flam*.test.mjs` : 49 tests réussis.
- `node --test scripts/*.test.mjs` : 8 770 réussis, un échec existant dans
  le test de refus du cycle d’accueil. L’échec est reproduit sur le commit
  de départ inchangé : deux appels de journalisation apparaissent dans une
  assertion qui ne prévoit que création et suppression de session.
- `cargo test --all-targets` : 2 355 réussis, 58 ignorés, aucun échec.
- Compilation de production, contrôle i18n, ESLint et formatage Rust : réussis.
- Clippy : terminé, aucun nouvel avertissement dans les fichiers modifiés ;
  avertissements existants dans les messages XTTS et le chiffrement FLAM.
- Le contrôle des dix tests de génération FLAM comprend aussi le parcours
  illustré exécuté depuis le pack produit par Rust.

## Parcours matériel à consigner

1. Créer une aventure originale dans l’atelier. Ouvrir Présentation de l’aventure
   et configurer cinq rubriques. Utiliser des titres longs et des accents.
2. Préparer au moins quatre chapitres, des illustrations de menu et de scènes,
   un audio de scène et un audio d’entrée. Définir les conditions de classe
   des branches exclusives et des jalons permettant cent pour cent par branche.
3. Ajouter au carnet une entrée conditionnée par un événement acquis ; ajouter
   une entrée verrouillée visible, une entrée cachée et une rubrique vide.
4. Enregistrer, fermer, rouvrir et vérifier les réglages et médias. Générer et
   installer sous une identité neuve, avec le circuit habituel de transfert.
5. Vérifier le menu, la barre, les illustrations, les vignettes, les textes et
   leur défilement, ainsi que l’accès à toutes les pages de contenu long.
6. Commencer ; interrompre une narration par Retour. Vérifier que son chapitre
   est commencé, mais que son passage interrompu ne peut pas être réécouté.
7. Reprendre, terminer l’écoute, choisir sa classe, obtenir un objet. Consulter
   la fiche, l’inventaire, le carnet et les souvenirs. Revenir à la scène.
8. Réécouter un passage depuis les chapitres et l’interrompre. Reprendre le
   scénario ; contrôler classe, objets, événements, récompenses et jet mémorisé.
9. Consommer l’objet, puis consulter le carnet : la découverte durable reste
   disponible, et l’objet à zéro n’est plus présenté comme possédé.
10. Quitter vers la bibliothèque et rouvrir. Éteindre complètement, reprendre
    hors ligne et vérifier progression, écoutes, rubriques et scène en cours.
11. Annuler Recommencer, puis confirmer un nouveau départ et jouer l’autre
    classe. Vérifier la remise à zéro et cent pour cent avec cette autre branche.
12. Vérifier qu’une autre histoire conserve sa lecture et sa propre partie.

## Résultat matériel

- Firmware : à renseigner.
- UUID et version du pack : à renseigner.
- Parcours réellement effectués : à renseigner.
- Comparaison avec les vidéos et écarts de disposition : à renseigner.
- Anomalies ou limites : à renseigner.

Les listes utilisent des pages de trois entrées ; le menu commercial de la
vidéo semble défiler en continu. Le titre système, la batterie et Bluetooth
restent sous contrôle du firmware. Ces différences doivent être évaluées sur
l’écran, sans annoncer une reproduction à l’identique.

## Revue

Les deux axes et les correctifs sont consignés dans le [compte rendu](review.md).
Le lecteur illustré distingue aussi explicitement une partie incompatible
d’une erreur de lecture, sans réinitialisation automatique.
