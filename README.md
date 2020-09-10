# Moiki Vocalizer

![Image](../master/public/logo192.png?raw=true)

Moiki Vocalizer est une application de bureau multiplateforme permettant de transformer une histoire faite avec [Moiki](https://moiki.fr) en conte audio interactif.

# Fonctionnalités

+ 🎙️ enregistrements avec micro ou synthèse vocale
+ ♻️ conservation des actions et conditions
+ 🎵 conservation des boucles et effets sonores
+ 🔥 export en html5
+ 🦄 export vers STUdio

# Installation

Pour installer Moiki Vocalizer, veuillez télécharger l'archive correspondant à votre système depuis [la page des dernières releases](https://github.com/kaelhem/moiki-vocalizer/releases/latest)

Au premier lancement, Moiki Vocalizer téléchargera la librairie FFMPEG et demandera l'accès au micro (si nécessaire). Veuillez suivre les instructions pour le bon fonctionnement de l'application.

> Les éxecutables ne sont pas signés. Sur macOS vous devrez éventuellement aller dans `Préférences système/Sécurité et confidentialité` et autoriser l'ouverture de l'application.

# Documentation

En attendant une documentation plus détaillée, voici la marche à suivre pour une prise en main rapide :

1. Créer une histoire sur [Moiki](https://moiki.fr) et l'exporter en JSON
2. Glisser le fichier _.zip_ obtenu dans l'encart bleu de la page "Projets" de Moiki Vocalizer
3. Un nouveau projet est créé avec l'ensemble des textes à vocaliser. Pour chacun d'entre eux, vous pouvez soit générer un fichier audio basé sur la synthèse vocale, soit vous enregistrer vous-même. _Pour utiliser la synthèse vocale vous devrez avant tout paramétrer une voix._
4. Lorsque tous les textes sont vocalisés, la page de votre projet affiche _100%_ et vous pouvez l'exporter. Soyez patients, l'opération peut être longue !

### Notes sur l'enregistrement de la synthèse vocale

La technique utilisée pour enregistrer la syntèse vocale se fait en **temps réél**. Cela signifie que l'enregistrement peut prendre un certain temps.

Par ailleurs, si un micro est branché (ou intégré, comme sur un ordinateur portable), il se peut que l'enregistrement de la synthèse vocale se superpose aux sons captés par le micro (c'est le cas sur un MacBookPro). Il n'y a pas vraiment de solutions pour cela, mis à part de lancer l'enregistrement dans une pièce calme !
Sur un ordinateur ne possédant pas de micro, l'enregistrement de la synthèse vocale se passe correctement.

# Captures d'écran

![Image](../master/assets/screenshots/projects.png?raw=true)

![Image](../master/assets/screenshots/vocalize-story.png?raw=true)

![Image](../master/assets/screenshots/record.png?raw=true)

![Image](../master/assets/screenshots/export-modal.png?raw=true)

![Image](../master/assets/screenshots/export-report.png?raw=true)

# Développement

Moiki Vocalizer est une application react packagée avec [Electron](https://www.electronjs.org/) et bootstrappée avec [Create React App](https://github.com/facebook/create-react-app).

Afin de lancer un build, vous devrez au préalable installer [NodeJS](https://nodejs.org/en/). L'utilisation de [Yarn](https://yarnpkg.com/) est également recommandée.

```sh
# clone this repo
git clone https://github.com/kaelhem/moiki-vocalizer.git
cd moiki-vocalizer

# install dependencies
yarn
# or
npm i

# start dev build
yarn dev
# or
npm run dev

# release build (note: changer au préalable la plateforme cible dans la partie scripts du fichier package.json => "electron-pack": "electron-builder build -[xxx]" où xxx est m (mac), w (windows) ou l (linux).
yarn electron-pack
# or
npm run electron-pack
```
