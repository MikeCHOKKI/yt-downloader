import chalk from "chalk";
import figlet from "figlet";
import inquirer from "inquirer";
import { getVideoInfo, getPlaylistInfo } from "./utils/info";
import { loadConfig, saveConfig } from "./utils/config";
import { formatBytes, formatDuration } from "./utils/format";
import { VideoDownloader } from "./services/downloader";
import type { VideoInfo } from "./types";

// Validation d'URL
function validateUrl(input: string): boolean | string {
  if (!input || input.trim().length === 0) {
    return "Veuillez entrer une URL.";
  }
  const url = input.trim();
  if (!/^https?:\/\/|^\w+:\/\//i.test(url)) {
    return "L'URL doit commencer par http:// ou https://";
  }
  return true;
}

// Affichage du titre
function displayTitle() {
  console.clear();
  console.log(
    chalk.cyan(
      figlet.textSync("YT Downloader", {
        font: "Standard",
        horizontalLayout: "default",
      })
    )
  );
  console.log(
    chalk.magenta("  ✦ Téléchargeur Universel : Vidéos, Audios, Streams & +1700 Plateformes ✦")
  );
  console.log(
    chalk.gray(
      "    (YouTube, Twitch, TikTok, Instagram, Twitter/X, SoundCloud, Liens directs...)\n"
    )
  );
  console.log(chalk.gray("─".repeat(process.stdout.columns || 80)));
}

// Menu principal
async function mainMenu() {
  displayTitle();

  const { choice } = await inquirer.prompt({
    type: "list",
    name: "choice",
    message: "Que souhaitez-vous faire ?",
    choices: [
      {
        name: "1. 📹 Télécharger un média (Vidéo / Audio - YouTube, TikTok, Twitch, etc.)",
        value: "video",
      },
      {
        name: "2. 🎵 Télécharger en Audio uniquement (MP3, M4A, FLAC...)",
        value: "audio",
      },
      {
        name: "3. 🔴 Enregistrer un Direct / Live Stream (Enregistrement en continu)",
        value: "live",
      },
      {
        name: "4. 📑 Télécharger une Playlist ou Chaîne",
        value: "playlist",
      },
      {
        name: "5. 📊 Inspecter une URL (plateforme, durée, flux direct)",
        value: "info",
      },
      {
        name: "6. ⚙️ Options par défaut & Cookies",
        value: "options",
      },
      new inquirer.Separator(),
      { name: "7. 👋 Quitter", value: "quit" },
    ],
  });

  switch (choice) {
    case "video":
      await downloadVideoFlow();
      break;
    case "audio":
      await downloadAudioOnlyFlow();
      break;
    case "live":
      await downloadLiveStreamFlow();
      break;
    case "playlist":
      await downloadPlaylistFlow();
      break;
    case "info":
      await showVideoListInfo();
      break;
    case "options":
      await changeDefaultOptions();
      break;
    case "quit":
      console.log(chalk.yellow("\n👋 Au revoir !"));
      process.exit(0);
  }

  // Retour au menu principal après chaque action
  return mainMenu();
}

// Affichage des informations d'un média
function printMediaDetails(videoInfo: VideoInfo) {
  console.log("\n" + chalk.bold("Informations du média :"));
  console.log(chalk.blue("🌐 Plateforme : ") + chalk.bold(videoInfo.extractor));
  console.log(chalk.yellow("Titre : ") + videoInfo.title);

  if (videoInfo.isLive) {
    console.log(
      chalk.red("Statut : ") +
        chalk.bgRed.white.bold(" 🔴 EN DIRECT (Live Stream) ")
    );
    console.log(
      chalk.yellow("Taille estimée : ") + "Flux continu (en direct)"
    );
  } else {
    console.log(chalk.yellow("Durée : ") + formatDuration(videoInfo.duration));
    console.log(
      chalk.yellow("Taille estimée : ") +
        (videoInfo.filesize > 0
          ? formatBytes(videoInfo.filesize)
          : "Dynamique / Inconnue")
    );
  }
}

// Téléchargement d'un média (Vidéo, Stream ou choix Audio)
async function downloadVideoFlow() {
  displayTitle();
  console.log(chalk.blue("📹 Téléchargement d'un média (Tous sites & liens directs)\n"));

  const { url } = await inquirer.prompt({
    type: "input",
    name: "url",
    message: "URL du média à télécharger :",
    validate: validateUrl,
  });

  const config = loadConfig();

  try {
    console.log(chalk.gray("\nAnalyse du média et détection de la plateforme..."));
    const videoInfo = await getVideoInfo(url.trim(), config.cookiesFromBrowser);
    printMediaDetails(videoInfo);

    // Cas spécifique : Si le média est un Live Stream en cours
    if (videoInfo.isLive) {
      console.log(
        chalk.cyan(
          "\nCe média est un flux en direct. Vous pouvez l'enregistrer en continu."
        )
      );

      const { liveConfirm } = await inquirer.prompt({
        type: "confirm",
        name: "liveConfirm",
        message: "Voulez-vous lancer l'enregistrement de ce direct ?",
        default: true,
      });

      if (!liveConfirm) {
        console.log(chalk.yellow("\nEnregistrement annulé."));
        await pause();
        return;
      }

      const { liveMode, liveFormat } = await inquirer.prompt([
        {
          type: "list",
          name: "liveMode",
          message: "Mode d'enregistrement du direct :",
          choices: [
            {
              name: "1. 🔴 Enregistrer à partir de maintenant (en direct)",
              value: "now",
            },
            {
              name: "2. ⏪ Enregistrer depuis le début du live (si DVR supporté)",
              value: "from_start",
            },
          ],
        },
        {
          type: "list",
          name: "liveFormat",
          message: "Format du fichier (MKV recommandé contre les corruptions) :",
          choices: ["mkv", "mp4", "ts"],
          default: "mkv",
        },
      ]);

      console.log(
        chalk.yellow(
          "\n🔴 Enregistrement démarré ! Appuyez sur Ctrl+C pour stopper et sauvegarder la vidéo.\n"
        )
      );

      const downloader = new VideoDownloader();
      await downloader.downloadVideo(url.trim(), {
        ...config,
        isLive: true,
        liveFromStart: liveMode === "from_start",
        format: liveFormat,
      });

      console.log(chalk.green("\n✅ Enregistrement du direct finalisé avec succès !"));
      await pause();
      return;
    }

    // Cas d'une vidéo normale : proposer Vidéo ou Audio seul
    const { confirm } = await inquirer.prompt({
      type: "confirm",
      name: "confirm",
      message: "Voulez-vous télécharger ce média ?",
      default: true,
    });

    if (!confirm) {
      console.log(chalk.yellow("\nTéléchargement annulé."));
      await pause();
      return;
    }

    const { downloadType } = await inquirer.prompt({
      type: "list",
      name: "downloadType",
      message: "Que souhaitez-vous extraire ?",
      choices: [
        { name: "🎬 Vidéo + Audio (Complet)", value: "video" },
        { name: "🎵 Audio uniquement (MP3, M4A, FLAC...)", value: "audio" },
      ],
      default: "video",
    });

    const downloader = new VideoDownloader();

    if (downloadType === "audio") {
      const { audioFormat, audioQuality } = await inquirer.prompt([
        {
          type: "list",
          name: "audioFormat",
          message: "Format audio souhaité :",
          choices: ["mp3", "m4a", "flac", "wav", "opus"],
          default: config.audioFormat || "mp3",
        },
        {
          type: "list",
          name: "audioQuality",
          message: "Qualité audio :",
          choices: ["best", "320k", "192k", "128k"],
          default: config.audioQuality || "best",
        },
      ]);

      await downloader.downloadVideo(url.trim(), {
        ...config,
        audioOnly: true,
        audioFormat,
        audioQuality,
      });
    } else {
      const { videoQuality, audioQuality, format } = await inquirer.prompt([
        {
          type: "list",
          name: "videoQuality",
          message: "Qualité vidéo souhaitée :",
          choices: ["best", "1080", "720", "480", "worst"],
          default: config.videoQuality,
        },
        {
          type: "list",
          name: "audioQuality",
          message: "Qualité audio souhaitée :",
          choices: ["best", "192k", "128k", "64k", "worstaudio"],
          default: config.audioQuality,
        },
        {
          type: "list",
          name: "format",
          message: "Format conteneur :",
          choices: ["mp4", "mkv", "webm"],
          default: config.format,
        },
      ]);

      await downloader.downloadVideo(url.trim(), {
        ...config,
        videoQuality,
        audioQuality,
        format,
        audioOnly: false,
      });
    }

    console.log(chalk.green("\n✅ Téléchargement terminé avec succès !"));
  } catch (error) {
    handleError(error as Error, config.verbose);
  }

  await pause();
}

// Raccourci : Téléchargement Audio uniquement
async function downloadAudioOnlyFlow() {
  displayTitle();
  console.log(chalk.blue("🎵 Téléchargement Audio uniquement (MP3, M4A, FLAC, SoundCloud...)\n"));

  const { url } = await inquirer.prompt({
    type: "input",
    name: "url",
    message: "URL de la vidéo ou musique à convertir en audio :",
    validate: validateUrl,
  });

  const config = loadConfig();

  try {
    console.log(chalk.gray("\nRécupération des informations audio..."));
    const videoInfo = await getVideoInfo(url.trim(), config.cookiesFromBrowser);
    printMediaDetails(videoInfo);

    const { audioFormat, audioQuality } = await inquirer.prompt([
      {
        type: "list",
        name: "audioFormat",
        message: "Format audio souhaité :",
        choices: ["mp3", "m4a", "flac", "wav", "opus"],
        default: config.audioFormat || "mp3",
      },
      {
        type: "list",
        name: "audioQuality",
        message: "Qualité audio :",
        choices: ["best", "320k", "192k", "128k"],
        default: config.audioQuality || "best",
      },
    ]);

    const downloader = new VideoDownloader();
    await downloader.downloadVideo(url.trim(), {
      ...config,
      audioOnly: true,
      audioFormat,
      audioQuality,
    });

    console.log(chalk.green("\n✅ Fichier audio téléchargé et converti avec succès !"));
  } catch (error) {
    handleError(error as Error, config.verbose);
  }

  await pause();
}

// Raccourci : Enregistrement d'un Direct / Live Stream
async function downloadLiveStreamFlow() {
  displayTitle();
  console.log(
    chalk.red("🔴 Enregistrement d'un Direct / Live Stream (YouTube Live, Twitch, Kick...)\n")
  );

  const { url } = await inquirer.prompt({
    type: "input",
    name: "url",
    message: "URL du direct à enregistrer :",
    validate: validateUrl,
  });

  const config = loadConfig();

  try {
    console.log(chalk.gray("\nVérification du flux en direct..."));
    const videoInfo = await getVideoInfo(url.trim(), config.cookiesFromBrowser);
    printMediaDetails(videoInfo);

    const { liveMode, liveFormat } = await inquirer.prompt([
      {
        type: "list",
        name: "liveMode",
        message: "Mode d'enregistrement :",
        choices: [
          {
            name: "1. 🔴 Enregistrer à partir de maintenant (en direct)",
            value: "now",
          },
          {
            name: "2. ⏪ Enregistrer depuis le début de la diffusion (DVR)",
            value: "from_start",
          },
        ],
      },
      {
        type: "list",
        name: "liveFormat",
        message: "Format de conteneur (MKV recommandé pour la tolérance aux pannes) :",
        choices: ["mkv", "mp4", "ts"],
        default: "mkv",
      },
    ]);

    console.log(
      chalk.yellow(
        "\n🔴 Enregistrement du direct en cours... Appuyez sur Ctrl+C pour arrêter et enregistrer la vidéo.\n"
      )
    );

    const downloader = new VideoDownloader();
    await downloader.downloadVideo(url.trim(), {
      ...config,
      isLive: true,
      liveFromStart: liveMode === "from_start",
      format: liveFormat,
    });

    console.log(chalk.green("\n✅ Enregistrement du live finalisé !"));
  } catch (error) {
    handleError(error as Error, config.verbose);
  }

  await pause();
}

// Téléchargement d'une playlist ou chaîne
async function downloadPlaylistFlow() {
  displayTitle();
  console.log(chalk.blue("📑 Téléchargement d'une playlist ou chaîne\n"));

  const { url } = await inquirer.prompt({
    type: "input",
    name: "url",
    message: "URL de la playlist ou chaîne :",
    validate: validateUrl,
  });

  const config = loadConfig();

  try {
    console.log(chalk.gray("\nRécupération des informations de la playlist..."));
    const playlistInfo = await getPlaylistInfo(url.trim(), config.cookiesFromBrowser);

    console.log("\n" + chalk.bold("Informations de la playlist :"));
    console.log(chalk.blue("🌐 Plateforme : ") + chalk.bold(playlistInfo.extractor));
    console.log(chalk.yellow("Nom : ") + playlistInfo.title);
    console.log(chalk.yellow("Nombre de vidéos : ") + playlistInfo.videoCount);

    const { limit } = await inquirer.prompt({
      type: "input",
      name: "limit",
      message: "Nombre de vidéos à télécharger (vide pour tout télécharger) :",
      default: "",
    });

    const { downloadType } = await inquirer.prompt({
      type: "list",
      name: "downloadType",
      message: "Type de téléchargement :",
      choices: [
        { name: "🎬 Vidéos complètes", value: "video" },
        { name: "🎵 Audio uniquement (MP3)", value: "audio" },
      ],
      default: "video",
    });

    const downloader = new VideoDownloader();
    const limitNum = limit ? parseInt(limit) : undefined;

    await downloader.downloadPlaylist(url.trim(), {
      ...config,
      limit: limitNum,
      audioOnly: downloadType === "audio",
    });

    console.log(chalk.green("\n✅ Téléchargement de la playlist terminé !"));
  } catch (error) {
    handleError(error as Error, config.verbose);
  }

  await pause();
}

// Afficher les informations détaillées d'une URL
async function showVideoListInfo() {
  displayTitle();
  console.log(chalk.blue("📊 Inspecter une URL (plateformes, formats, direct...)\n"));

  const { url } = await inquirer.prompt({
    type: "input",
    name: "url",
    message: "URL de la vidéo, playlist ou direct :",
    validate: validateUrl,
  });

  const config = loadConfig();

  try {
    console.log(chalk.gray("\nInspection en cours..."));
    const info = await getVideoInfo(url.trim(), config.cookiesFromBrowser);
    printMediaDetails(info);
  } catch (error) {
    console.error(
      chalk.red("\n❌ Erreur lors de la récupération des informations :"),
      (error as Error).message
    );
  }

  await pause();
}

// Modifier les options par défaut
async function changeDefaultOptions() {
  displayTitle();
  console.log(chalk.blue("⚙️ Options par défaut & Paramètres\n"));

  const currentConfig = loadConfig();

  const answers = await inquirer.prompt([
    {
      type: "list",
      name: "videoQuality",
      message: "Qualité vidéo par défaut :",
      choices: ["best", "1080", "720", "480", "worst"],
      default: currentConfig.videoQuality || "best",
    },
    {
      type: "list",
      name: "format",
      message: "Format vidéo par défaut :",
      choices: ["mp4", "mkv", "webm"],
      default: currentConfig.format || "mp4",
    },
    {
      type: "list",
      name: "audioQuality",
      message: "Qualité audio par défaut :",
      choices: ["best", "320k", "192k", "128k", "64k"],
      default: currentConfig.audioQuality || "best",
    },
    {
      type: "list",
      name: "audioFormat",
      message: "Format audio par défaut (quand mode audio) :",
      choices: ["mp3", "m4a", "flac", "wav", "opus"],
      default: currentConfig.audioFormat || "mp3",
    },
    {
      type: "input",
      name: "outputDir",
      message: "Dossier de sortie :",
      default: currentConfig.outputDir || "downloads",
    },
    {
      type: "list",
      name: "cookiesFromBrowser",
      message: "Navigateur pour les cookies (pour vidéos restreintes ou comptes) :",
      choices: ["none", "chrome", "firefox", "brave", "edge", "safari"],
      default: currentConfig.cookiesFromBrowser || "none",
    },
    {
      type: "confirm",
      name: "verbose",
      message: "Mode verbeux (afficher les détails) :",
      default: currentConfig.verbose || false,
    },
  ]);

  saveConfig({
    ...currentConfig,
    ...answers,
    resolution: answers.videoQuality,
  });

  console.log(chalk.green("\n✅ Options enregistrées avec succès !"));
  await pause();
}

// Petite pause conviviale
async function pause() {
  await inquirer.prompt({
    type: "input",
    name: "continue",
    message: "Appuyez sur Entrée pour continuer...",
  });
}

// Gestion globale des erreurs
function handleError(error: Error, verbose: boolean) {
  console.error(chalk.red("\n❌ Erreur :"), error.message);
  if (verbose) {
    console.error(chalk.red("Stack trace :"), error);
  }
}

// Point d'entrée principal
async function main() {
  try {
    await mainMenu();
  } catch (error) {
    const config = loadConfig();
    handleError(error as Error, config.verbose);
    process.exit(1);
  }
}

// Gestion des interruptions Ctrl+C en dehors des téléchargements
process.on("SIGINT", () => {
  console.log(chalk.yellow("\n\n🛑 Programme interrompu par l'utilisateur"));
  process.exit(0);
});

// Démarrage de l'application
main();
