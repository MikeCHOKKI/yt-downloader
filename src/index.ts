import chalk from "chalk";
import figlet from "figlet";
import inquirer from "inquirer";
import { getVideoInfo, getPlaylistInfo } from "./utils/info";
import { loadConfig, saveConfig } from "./utils/config";
import { formatBytes, formatDuration } from "./utils/format";
import { VideoDownloader } from "./services/dowloader";

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
      { name: "1. Télécharger une vidéo", value: "video" },
      { name: "2. Télécharger une playlist", value: "playlist" },
      { name: "3. Liste et taille des vidéos", value: "info" },
      { name: "4. Options par défaut", value: "options" },
      new inquirer.Separator(),
      { name: "5. Quitter", value: "quit" },
    ],
  });

  switch (choice) {
    case "video":
      await downloadVideoFlow();
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

// Téléchargement d'une vidéo
async function downloadVideoFlow() {
  displayTitle();
  console.log(chalk.blue("📹 Téléchargement d'une vidéo\n"));

  const { url } = await inquirer.prompt({
    type: "input",
    name: "url",
    message: "URL de la vidéo à télécharger :",
    validate: (input) => (input ? true : "Veuillez entrer une URL valide"),
  });

  try {
    console.log(chalk.gray("\nRécupération des informations de la vidéo..."));
    const videoInfo = await getVideoInfo(url);

    console.log("\n" + chalk.bold("Informations de la vidéo :"));
    console.log(chalk.yellow("Titre : ") + videoInfo.title);
    console.log(chalk.yellow("Durée : ") + formatDuration(videoInfo.duration));
    console.log(
      chalk.yellow("Taille estimée : ") + formatBytes(videoInfo.filesize)
    );

    const { confirm } = await inquirer.prompt({
      type: "confirm",
      name: "confirm",
      message: "Voulez-vous télécharger cette vidéo ?",
      default: true,
    });

    if (confirm) {
      const config = loadConfig();
      const downloader = new VideoDownloader();
      await downloader.downloadVideo(url, config);

      console.log(chalk.green("\n✅ Téléchargement terminé !"));
    } else {
      console.log(chalk.yellow("\nTéléchargement annulé."));
    }
  } catch (error) {
    console.error(
      chalk.red("\n❌ Erreur lors de la récupération des informations :"),
      (error as Error).message
    );
  }

  await inquirer.prompt({
    type: "input",
    name: "continue",
    message: "Appuyez sur Entrée pour continuer...",
  });
}

// Téléchargement d'une playlist
async function downloadPlaylistFlow() {
  displayTitle();
  console.log(chalk.blue("📑 Téléchargement d'une playlist\n"));

  const { url } = await inquirer.prompt({
    type: "input",
    name: "url",
    message: "URL de la playlist à télécharger :",
    validate: (input) => (input ? true : "Veuillez entrer une URL valide"),
  });

  try {
    console.log(
      chalk.gray("\nRécupération des informations de la playlist...")
    );
    const playlistInfo = await getPlaylistInfo(url);

    console.log("\n" + chalk.bold("Informations de la playlist :"));
    console.log(chalk.yellow("Nom : ") + playlistInfo.title);
    console.log(chalk.yellow("Nombre de vidéos : ") + playlistInfo.videoCount);

    const { limit } = await inquirer.prompt({
      type: "input",
      name: "limit",
      message: "Nombre de vidéos à télécharger (vide pour tout télécharger) :",
      default: "",
    });

    const config = loadConfig();
    const downloader = new VideoDownloader();
    const limitNum = limit ? parseInt(limit) : undefined;

    await downloader.downloadPlaylist(url, {
      ...config,
      limit: limitNum,
    });

    console.log(chalk.green("\n✅ Téléchargement terminé !"));
  } catch (error) {
    console.error(
      chalk.red("\n❌ Erreur lors de la récupération des informations :"),
      (error as Error).message
    );
  }

  await inquirer.prompt({
    type: "input",
    name: "continue",
    message: "Appuyez sur Entrée pour continuer...",
  });
}

// Afficher les informations de liste de vidéos
async function showVideoListInfo() {
  displayTitle();
  console.log(chalk.blue("📊 Informations sur les vidéos\n"));

  const { url } = await inquirer.prompt({
    type: "input",
    name: "url",
    message: "URL de la playlist ou chaîne :",
    validate: (input) => (input ? true : "Veuillez entrer une URL valide"),
  });

  try {
    console.log(chalk.gray("\nRécupération des informations..."));
    const info = await getPlaylistInfo(url);

    console.log("\n" + chalk.bold("Informations :"));
    console.log(chalk.yellow("Nom : ") + info.title);
    console.log(chalk.yellow("Nombre de vidéos : ") + info.videoCount);
    console.log(
      chalk.yellow("Taille totale estimée : ") + formatBytes(info.totalSize)
    );
    console.log(
      chalk.yellow("Durée totale : ") + formatDuration(info.totalDuration)
    );
  } catch (error) {
    console.error(
      chalk.red("\n❌ Erreur lors de la récupération des informations :"),
      (error as Error).message
    );
  }

  await inquirer.prompt({
    type: "input",
    name: "continue",
    message: "Appuyez sur Entrée pour continuer...",
  });
}

// Modifier les options par défaut
async function changeDefaultOptions() {
  displayTitle();
  console.log(chalk.blue("⚙️ Options par défaut\n"));

  const currentConfig = loadConfig();

  const { resolution, outputDir, format, verbose } = await inquirer.prompt([
    {
      type: "list",
      name: "resolution",
      message: "Résolution maximale :",
      choices: ["480", "720", "1080", "1440", "2160"],
      default: currentConfig.resolution,
    },
    {
      type: "input",
      name: "outputDir",
      message: "Dossier de sortie :",
      default: currentConfig.outputDir,
    },
    {
      type: "list",
      name: "format",
      message: "Format de sortie :",
      choices: ["mp4", "mkv", "webm"],
      default: currentConfig.format,
    },
    {
      type: "confirm",
      name: "verbose",
      message: "Mode verbeux (afficher les détails) :",
      default: currentConfig.verbose,
    },
  ]);

  const newConfig = { resolution, outputDir, format, verbose };
  saveConfig(newConfig);

  console.log(chalk.green("\n✅ Options enregistrées !"));

  await inquirer.prompt({
    type: "input",
    name: "continue",
    message: "Appuyez sur Entrée pour continuer...",
  });
}

// Gestion des erreurs globale
function handleError(error: Error, verbose: boolean) {
  console.error(chalk.red("\n❌ Erreur:"), error.message);
  if (verbose) {
    console.error(chalk.red("Stack trace:"), error);
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

// Gestion des interruptions
process.on("SIGINT", () => {
  console.log(chalk.yellow("\n\n🛑 Programme interrompu par l'utilisateur"));
  process.exit(0);
});

// Démarrage de l'application
main().catch((error) => {
  console.error(chalk.red("\nErreur fatale :"), error);
  process.exit(1);
});
