# Vérification du prototype de classes

## Contrôles locaux

- Harnais Lua réussi : parcours de chaque classe jusqu’à la fin, choix refusé
  sans effet, écriture refusée avant changement de classe, reprise du module et
  d’une nouvelle instance, nouveau départ permettant l’autre classe, sauvegarde
  de classe invalide signalée sans écrasement.
- Régressions inventaire, coffre unique, porte consommant la clé, dé de un à
  vingt, résultats conservés, erreurs de stockage et callbacks audio réussies.
- Cinq tests Python du transfert sur volume synthétique réussis.
- Syntaxe Python et Lua, et `git diff --check` réussis.
- Pack construit avec le Piper C++ embarqué et la voix locale française.
  Liste autorisée, manifeste et identité vérifiés ; sources Lua embarquées
  identiques aux fichiers testés.
- Décodage intégral de dix narrations stéréo et de la piste mono de comparaison.
  Les pistes stéréo sont en 44,1 kHz, deux canaux. Les nouvelles narrations
  durent entre 13,1 et 14,1 secondes.

Les modifications restent dans le prototype et sa documentation ; aucune
surface JavaScript, Rust ou de transfert de production n’est modifiée.

## Validation sur appareil

Pack installé et relu sur la FLAM `2.4.1-d5186dc0` sous son nouvel UUID.
La taille et la date de modification de 3 451 fichiers existants hors liste/cache
sont inchangées ; le contenu de 2 862 petits fichiers, scripts et métadonnées
est identique. Les gros fichiers audio n’ont pas été entièrement hachés.
La liste et le cache ont été sauvegardés avant modification.

Rapport local : `exports/flam-classes-prototype/validation.json`.
Sauvegarde d’installation :
`~/.local/share/com.hugs11.story-studio/flam-prototype/20261114T170832699872Z/`.

L’utilisateur confirme le fonctionnement après le parcours matériel demandé :
« ca marche tres bien, parfait ». Cette confirmation valide le jalon des classes
et leur reprise sur sa FLAM 2.4.1, en complément des contrôles locaux.
