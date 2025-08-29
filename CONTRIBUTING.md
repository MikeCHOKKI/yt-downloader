# Contribuer à YT Downloader

Nous sommes ravis que vous souhaitiez contribuer à YT Downloader ! Que vous vouliez signaler un bug, suggérer une fonctionnalité ou soumettre des modifications de code, ce guide vous aidera à démarrer.

## Comment Contribuer

-   [Signaler un Bug](#signaler-un-bug)
-   [Suggérer une Fonctionnalité](#suggérer-une-fonctionnalité)
-   [Proposer des Modifications](#proposer-des-modifications)

## Signaler un Bug

Si vous rencontrez un bug, veuillez ouvrir une [issue sur GitHub](https://github.com/MikeCHOKKI/yt-downloader/issues). Lors de la création de l'issue, veuillez inclure :

-   Un titre clair et descriptif.
-   Les étapes pour reproduire le bug.
-   Le comportement attendu et ce qui s'est réellement passé.
-   Les détails de votre environnement (système d'exploitation, version de Node.js, etc.).

## Suggérer une Fonctionnalité

Si vous avez une idée pour une nouvelle fonctionnalité ou une amélioration, ouvrez une [issue sur GitHub](https://github.com/MikeCHOKKI/yt-downloader/issues) pour en discuter. Décrivez la fonctionnalité et pourquoi vous pensez qu'elle serait bénéfique.

## Proposer des Modifications

Si vous souhaitez apporter des modifications au code, voici comment procéder :

### Processus de Développement

1.  **Forkez** le dépôt sur votre compte GitHub.
2.  **Clonez** votre fork sur votre machine locale :
    ```bash
    git clone https://github.com/VOTRE-NOM-UTILISATEUR/yt-downloader.git
    cd yt-downloader
    ```
3.  **Installez les dépendances** du projet :
    ```bash
    npm install
    ```
4.  **Créez une nouvelle branche** pour vos modifications :
    ```bash
    git checkout -b feature/votre-nom-de-fonctionnalite
    ```
5.  **Effectuez vos modifications** dans le code source (répertoire `src`).
6.  **Testez vos modifications** en exécutant l'application en mode développement :
    ```bash
    npm start
    ```
    Ou en construisant le projet et en l'exécutant :
    ```bash
    npm run build
    npm run serve
    ```

### Normes de Codage

-   Le code est écrit en **TypeScript**. Veuillez suivre les meilleures pratiques de TypeScript.
-   Essayez de conserver un style de code cohérent avec le reste du projet.
-   Commentez votre code lorsque c'est nécessaire pour expliquer la logique complexe.

### Soumettre une Pull Request

1.  **Commitez** vos modifications avec des messages clairs et descriptifs.
    ```bash
    git commit -m "feat: Ajout de la fonctionnalité X"
    ```
2.  **Pushez** votre branche vers votre fork :
    ```bash
    git push origin feature/votre-nom-de-fonctionnalite
    ```
3.  **Ouvrez une Pull Request** depuis votre fork vers la branche `main` du dépôt original.
4.  Dans la description de votre Pull Request, **décrivez en détail** les changements que vous avez apportés et **liez l'issue** correspondante si applicable (par exemple, `Closes #123`).

Nous examinerons votre contribution dès que possible. Merci de participer à l'amélioration de YT Downloader !
