Status: ready-for-agent
Type: task
Blocked by: 01

# Exécuter sur FLAM les règles du document d’aventure

## Objectif

Remplacer, dans un nouveau runtime, les hypothèses propres à la clé des
lucioles par le document du ticket 01, sans modifier les prototypes validés.
Voir la [spécification](../spec.md).

## Réalisation

- Décrire scènes et choix depuis les données générées ; afficher inventaire
  et classe depuis les définitions de l’auteur.
- Évaluer les conditions avant chaque action, y compris après reprise.
  Appliquer tous les effets ou aucun ; empêcher les quantités négatives.
- Mémoriser les récompenses par identité et les jets par identité ; conserver
  un résultat proposé pendant une écriture refusée ou incertaine.
- Sauvegarder l’état candidat avant de présenter les conséquences ; garder
  les protections audio, la réconciliation et le retour bibliothèque actif.
- Valider les états restaurés et leur compatibilité avec l’aventure.
  Recommencer exige confirmation et ne touche qu’à sa partie.

## Acceptation

Exécuter le vrai runtime et les données générées dans le harnais Lua existant,
en simulant seulement l’hôte. Couvrir les deux classes, acquisition unique,
consommation atomique, choix masqués ou désactivés, vingt résultats possibles,
revisite sans nouveau tirage, fin, réouverture et nouvelle instance.
Injecter stockage refusé, incertain et illisible, ainsi que les régressions
audio connues. Ces résultats seuls ne prouvent pas la reprise sur l’appareil.
