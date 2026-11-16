Status: resolved
Type: task

# Valider la narration d’une aventure personnelle sur FLAM

## Objectif

Compléter les essais des Compagnons du village avec trois scènes narrées,
dans une copie d’identité indépendante. Conserver les règles existantes.

## Acceptation

- Le projet sauvegardé se rouvre avec trois fichiers audio accessibles.
- Génération et installation depuis l’éditeur réussies.
- Choix de classe, clairière et sentier : narration audible jusqu’à sa fin,
  puis choix accessibles, sans lecture superposée ni erreur.
- La revisite de la clairière permet de réécouter sans recevoir une seconde clé.
- Après extinction et reprise : bonne scène, narration audible, classe et clé
  conservées. Une reprise de scène est attendue, pas une reprise à la seconde.
- Une scène sans narration et une fin restent accessibles.

## Comments

Préparation le 16 novembre 2026 : copie dédiée avec trois textes originaux
et voix locale XTTS `dd_narration_faerun`. Les essais physiques restent à réaliser.

## Préparation terminée

- Projet : `exports/flam-editeur-visuel/validation-audio/les-compagnons-validation-audio.mbah`.
- Identité : `d0a48d02-7b72-4c00-ab88-24954436387e`, saveVersion 1.
- Trois narrations XTTS : départ (~8 s), clairière (~14 s), sentier (~10 s).
- Réouverture par le vrai codec, résolution des trois chemins médias, règles
  identiques à l’original et identités indépendantes vérifiées.
- Conversion FFmpeg selon les paramètres du service de production vérifiée :
  MP3 stéréo 44,1 kHz, 128 kb/s. Données compilées et syntaxe Lua vérifiées.
- Cinq tests runtime et persistance réussis.
- Aucune génération de pack ni installation effectuée à ce stade. La qualité
  à l’écoute et la lecture matérielle ne sont pas encore confirmées.

## Parcours guidé

1. Ouvrir la copie `.mbah` dans Story Studio.
2. Dans le panneau de production, générer vers un dossier de sortie, puis
   installer en sélectionnant le volume FLAM connecté.
3. Éjecter proprement, débrancher et ouvrir « Les compagnons — validation audio ».
4. Commencer et écouter le choix de classe (~8 s), choisir Pisteur, écouter
   la clairière (~14 s). Vérifier que chaque piste va au bout et affiche les choix.
5. Prendre la clé : la clairière est relue, sans superposition. Vérifier une
   seule clé dans l’inventaire. Éteindre et reprendre : clairière audible,
   Pisteur et clé conservés, coffre vide.
6. Ouvrir la porte puis traverser : écouter le sentier (~10 s), lire les traces,
   continuer vers le dé et une fin sans narration. Aucun blocage attendu.

Consigner les confirmations matérielles avant résolution du ticket.

## Échec matériel signalé

L’utilisateur signale une absence d’audio. Après « Commencer », les choix
apparaissent immédiatement. Le reçu `474994f9-b5e9-485a-94f9-20325d5e8ea7`
confirme l’identité attendue et les trois pistes avec leurs fichiers mp3map.
Le manifeste du pack généré référence correctement les trois pistes.

Le contrôle `lua .scratch/flam-narration/reproduire-audio.lua
.scratch/flam-narration/debug-pack` sur le vrai contenu du pack généré
appelle `audio.play` avec `0-stereo.mp3` après Commencer. Ce contrôle ne
reproduit pas le symptôme matériel et ne valide pas la lecture sur FLAM.
Reconnexion USB demandée pour inspecter la copie effectivement installée.
Aucune correction du runtime fondée sur une hypothèse à ce stade.

### Inspection USB en lecture seule

La FLAM reconnectée contient la bonne identité d’aventure. Toutes les empreintes
du reçu correspondent. Les cinq scripts déchiffrés et les six fichiers MP3/map
sont identiques au pack généré. Le contrôle minimal sur ces scripts installés
appelle bien `audio.play` avec `0-stereo.mp3`. La sauvegarde est dans la scène
`clairiere`, classe `pisteur` : cette copie a bien été jouée. Aucune écriture
sur l’appareil effectuée. Confirmation de l’écran de narration et du son dans
une autre histoire demandée pour poursuivre le diagnostic matériel.

### Correction du profil audio et essai comparatif B

L’utilisateur a bien vu l’écran « Écoute le début de cette scène… », sans son,
et confirme le son d’une autre histoire au même volume. L’indication initiale
de choix immédiats ne signifiait donc pas que la narration était ignorée.

Écart confirmé : le prototype validé utilisait ID3v2.3 et Info/Xing (profil
Audio B), mais `flam_pack::media::audio` les supprimait. Le MP3 installé
contient bien un signal audible au décodage logiciel. Le contrôle du profil
de production a d’abord échoué sur l’absence d’ID3v2.3, puis réussi après
rétablissement du profil et adaptation de la table aux métadonnées. La cause
matérielle du silence reste à confirmer par l’essai comparatif.

- Huit tests du générateur réussis, dont table avec métadonnées, ancien format,
  troncatures et parcours du vrai runtime dans le pack Rust avec narration.
- Trois pistes du vrai pack corrigé décodées intégralement ; tous les offsets
  et positions de la table sont conformes aux paquets relevés par FFprobe.
- Copie : `exports/flam-editeur-visuel/validation-audio-b/les-compagnons-audio-b.mbah`.
- Titre : « Les compagnons — audio B ». Identité :
  `f1e62110-5386-4d4f-bcfc-4c857d866440`, saveVersion 1.
- Génération, relecture du pack et installation via les services Rust de
  production, à l’aide d’un pilote local temporaire retiré des sources finales.
- Reçu : `~/.local/share/com.hugs11.story-studio/flam-installations/
  b3c83a38-5b22-4bf9-81d9-b0392101988f/installation.json`.
- Scripts déchiffrés et médias relus depuis la FLAM : conformes au pack.
  La liste ajoute uniquement cette identité. Ancienne copie conservée pour
  comparaison ; aucune migration de partie.
- Rebuild natif réussi (`npm run tauri:build -- --no-bundle`).
- Six tests de transfert FLAM réussis, en complément des huit du générateur.
- Formatage Rust et `git diff --check` réussis.
- Validation matérielle audio B en attente : éjecter proprement, débrancher,
  ouvrir « Les compagnons — audio B », Commencer puis choisir Pisteur et écouter
  les deux premières narrations avant de poursuivre le parcours complet.

### Audio confirmé sur FLAM

Après la demande d’écouter les narrations du choix de classe et de la clairière
dans « Les compagnons — audio B », l’utilisateur confirme : « oui c'est bon
l'audio fonctionne ». La lecture audible de ces deux scènes est validée sur
la FLAM 2.4.1. Le rétablissement du profil Audio B avec sa table adaptée corrige
le silence observé ; l’essai ne distingue pas l’effet individuel d’ID3 et de Xing.

Le ticket reste ouvert pour vérifier la reprise audio après extinction avec
classe et clé conservées, l’absence de récompense doublée, puis la narration
du sentier et le passage vers une fin sans narration. Prochaine étape guidée :
prendre la clé, vérifier la quantité 1, éteindre complètement et reprendre.

### Reprise audio après extinction confirmée

Après le parcours demandé (prise de clé, quantité 1, extinction complète,
rallumage et reprise), l’utilisateur confirme : « ok ca marche bien ».
La narration de la clairière fonctionne après reprise, la classe Pisteur et
la clé sont conservées, et le coffre ne redonne aucune clé. Ce parcours
matériel est validé. Restent la narration du sentier et l’accès à une fin
sans narration dans cette copie audio B.

### Sentier et fin confirmés

Après ouverture de la porte, traversée, écoute du sentier, choix « Lire les
traces », passage par le dé et arrivée à une fin, l’utilisateur confirme :
« oui ca marche bien ». La troisième narration et la poursuite dans les scènes
sans narration sont validées, sans blocage signalé.

## Answer

La validation audio est terminée sur la FLAM 2.4.1 de l’utilisateur, avec
« Les compagnons — audio B » (`f1e62110-5386-4d4f-bcfc-4c857d866440`).
Les trois narrations sont audibles, les choix et la fin restent accessibles,
et la reprise après extinction conserve narration de scène, classe et clé,
sans seconde récompense du coffre.

Le générateur rétablit le profil MP3 Audio B (ID3v2.3, Info/Xing) du prototype
validé ; la table de lecture exclut les métadonnées et pointe sur les paquets
audio. Huit tests du générateur et six tests du transfert réussissent, les
trois tables correspondent aux paquets FFprobe, et le rebuild natif réussit.

La génération et l’installation initiales avaient été effectuées dans l’éditeur.
La copie corrigée a été générée et installée par les mêmes services Rust, via
un pilote local retiré des sources finales ; ce second passage n’est pas une
nouvelle validation manuelle de l’interface. Le résultat ne généralise pas aux
autres firmwares et n’isole pas l’effet individuel d’ID3 et de Xing.
