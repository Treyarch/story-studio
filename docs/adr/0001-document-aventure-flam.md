# Conserver le document FLAM dans un mode de projet distinct

Une aventure personnelle FLAM exprime des classes, objets, événements et jets
narratifs que le graphe Lunii à index ne sait pas exécuter. Nous retenons un
mode `flam` dans l’enveloppe `.mbah` de schéma 5, avec un document JSON
structuré de version 1, plutôt qu’une extension du payload Avancé ou un fichier
d’éditeur séparé : les règles restent explicites tout en réutilisant le cycle
de sauvegarde, l’historique, les médias et la reprise de session existants.

Le schéma 4 et son payload Avancé opaque restent inchangés. Les brouillons
FLAM structurellement valides sont sauvegardables ; leurs diagnostics de
contenu bloqueront la génération. L’identité du travail local est distincte
de celle de l’aventure ; `saveVersion` exprime sa compatibilité de partie,
indépendamment des versions du document et du fichier. Aucun état de partie
n’est enregistré dans le document d’auteur et aucune migration de partie
n’est introduite. L’édition visuelle et le runtime généré sont des lots suivants.
