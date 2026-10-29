# YT Downloader - Téléchargeur Média Universel

<p align="center">
  <strong>Application CLI interactive pour télécharger des vidéos, musiques, playlists et flux en direct depuis YouTube, Twitch, TikTok et +1700 plateformes ou liens directs.</strong>
</p>

<p align="center">
  <a href="https://github.com/MikeCHOKKI/yt-downloader/blob/main/LICENSE"><img src="https://img.shields.io/github/license/MikeCHOKKI/yt-downloader" alt="Licence"></a>
  <a href="https://github.com/MikeCHOKKI/yt-downloader/issues"><img src="https://img.shields.io/github/issues/MikeCHOKKI/yt-downloader" alt="Problèmes ouverts"></a>
</p>

YT Downloader est une application en ligne de commande (CLI) interactive et polyvalente. Initialement pensée pour YouTube, elle permet désormais de télécharger et convertir des médias depuis plus de 1 700 plateformes web ainsi que depuis des liens directs (fichiers ou flux HLS `.m3u8` / DASH `.mpd`).

## Fonctionnalités

- 🌐 **Support Multi-Plateformes Universel** : YouTube, Twitch, TikTok, Instagram, Twitter (X), Facebook, Reddit, Vimeo, Dailymotion, SoundCloud, Bandcamp, ainsi que tout lien direct / flux web.
- 🔴 **Téléchargement & Enregistrement de Directs (Live Streams)** :
  - Détection automatique des flux en direct.
  - Enregistrement en continu avec arrêt propre sans corruption (via `Ctrl+C`).
  - Option pour enregistrer depuis le début du live (DVR) ou en direct.
  - Format MKV résistant aux pannes pour les streams.
- 🎵 **Extraction Audio Uniquement** : Convertissez n'importe quelle vidéo ou musique en **MP3**, **M4A**, **FLAC**, **WAV** ou **OPUS** avec intégration des métadonnées.
- 📑 **Téléchargement de Playlists et Chaînes** : Téléchargez des collections entières avec filtrage par nombre d'éléments.
- 🍪 **Gestion des Cookies de Navigateur** : Possibilité d'utiliser les cookies de vos navigateurs (Chrome, Firefox, Brave, Edge...) pour accéder aux vidéos restreintes (âge, connexion).
- ⚙️ **Configuration Persistante** : Sauvegarde de vos préférences (qualité vidéo, formats, dossier de destination, cookies).
- 📊 **Progression Interactive & Résiliente** : Affichage temps réel de la vitesse, du volume et du pourcentage avec spinner animé.

## Prérequis

- [Node.js](https://nodejs.org/) (v18+)
- [FFmpeg](https://ffmpeg.org/download.html) installé sur votre système (nécessaire pour la fusion des flux et l'extraction audio).
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) à jour (`yt-dlp -U`).

## Installation

1. Clonez le dépôt :
   ```bash
   git clone https://github.com/MikeCHOKKI/yt-downloader.git
   ```
2. Accédez au répertoire du projet :
   ```bash
   cd yt-downloader
   ```
3. Installez les dépendances :
   ```bash
   npm install
   ```
4. Compilez le projet TypeScript :
   ```bash
   npm run build
   ```

## Utilisation

Pour lancer l'application en mode interactif :

```bash
npm start
```

Suivez ensuite le menu à l'écran pour choisir l'action souhaitée.

## Configuration

Vous pouvez ajuster les paramètres par défaut via l'option **"⚙️ Options par défaut & Cookies"** du menu principal :
- Qualité vidéo par défaut (best, 1080, 720, 480...)
- Format conteneur vidéo (mp4, mkv, webm)
- Qualité audio par défaut (best, 320k, 192k, 128k)
- Format audio par défaut (mp3, m4a, flac, wav, opus)
- Dossier de destination des téléchargements
- Navigateur source des cookies pour les vidéos avec compte ou restrictions

## Licence

Ce projet est sous licence ISC. Voir le fichier [LICENSE](LICENSE) pour plus de détails.
