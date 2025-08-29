# YT Downloader

<p align="center">
  <strong>Une application CLI interactive pour télécharger des vidéos et playlists YouTube.</strong>
</p>

<p align="center">
  <a href="https://github.com/MikeCHOKKI/yt-downloader/blob/main/LICENSE"><img src="https://img.shields.io/github/license/MikeCHOKKI/yt-downloader" alt="Licence"></a>
  <a href="https://github.com/MikeCHOKKI/yt-downloader/issues"><img src="https://img.shields.io/github/issues/MikeCHOKKI/yt-downloader" alt="Problèmes ouverts"></a>
</p>

YT Downloader est une application en ligne de commande (CLI) interactive qui simplifie le téléchargement de vidéos et de playlists depuis YouTube. Contrairement aux outils classiques, elle offre une interface intuitive avec des menus interactifs, une gestion des configurations persistantes et une expérience de téléchargement améliorée.

## Fonctionnalités

-   **Téléchargement de Vidéos et Playlists** : Téléchargez des vidéos individuelles ou des playlists entières en quelques clics.
-   **Informations Détaillées** : Obtenez des informations sur les vidéos et playlists (titre, durée, taille estimée, etc.) avant de télécharger.
-   **Choix de la Qualité** : Sélectionnez la qualité vidéo et audio souhaitée pour chaque téléchargement.
-   **Configuration Personnalisée** : Configurez des options par défaut (qualité, dossier de sortie, format) pour une utilisation plus rapide.
-   **Interface Interactive** : Naviguez facilement grâce à des menus et des invites clairs et conviviaux.
-   **Configuration Persistante** : Vos préférences sont sauvegardées pour les utilisations futures.

## Prérequis

Avant de commencer, assurez-vous d'avoir installé [FFmpeg](https://ffmpeg.org/download.html) sur votre système. FFmpeg est nécessaire pour fusionner les flux vidéo et audio.

## Installation

1.  Clonez le dépôt :
    ```bash
    git clone https://github.com/MikeCHOKKI/yt-downloader.git
    ```
2.  Accédez au répertoire du projet :
    ```bash
    cd yt-downloader
    ```
3.  Installez les dépendances :
    ```bash
    npm install
    ```

## Utilisation

Pour démarrer l'application, exécutez :

```bash
npm start
```

Suivez ensuite les instructions interactives pour télécharger des vidéos, des playlists ou configurer les options.

## Configuration

Vous pouvez configurer les options par défaut en sélectionnant l'option "Options par défaut" dans le menu principal. Les options configurables incluent :

-   **Qualité vidéo par défaut** : La qualité vidéo préférée (ex: 1080, 720, best).
-   **Qualité audio par défaut** : La qualité audio préférée (ex: 128k, best).
-   **Dossier de sortie** : Le répertoire où les vidéos seront sauvegardées.
-   **Format de sortie** : Le format de conteneur vidéo (ex: mp4, mkv).

## Contributions

Les contributions sont les bienvenues ! Veuillez consulter le fichier [CONTRIBUTING.md](CONTRIBUTING.md) pour les directives.

## Licence

Ce projet est sous licence ISC. Voir le fichier [LICENSE](LICENSE) pour plus de détails.
