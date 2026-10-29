import YtDlpWrap from "yt-dlp-wrap";
import fs from "fs/promises";
import path from "path";
import chalk from "chalk";
import type { DownloadOptions } from "../types";
import { checkFFmpeg } from "../utils/ffmpeg";
import { DownloadProgress } from "../utils/progress";

export class VideoDownloader {
  private readonly progress: DownloadProgress;
  private currentOutputFile: string;
  private ytDlpWrap: YtDlpWrap;
  private activeChildProcess: any = null;

  constructor() {
    this.progress = new DownloadProgress();
    this.currentOutputFile = "";
    this.ytDlpWrap = new YtDlpWrap();
  }

  /**
   * Télécharge un média (vidéo, stream en direct ou audio seul) à partir d'une URL
   * @param url - URL de la vidéo à télécharger
   * @param options - Options de téléchargement
   * @returns Promise qui se résout avec le chemin du fichier téléchargé
   */
  async downloadVideo(
    url: string,
    options: DownloadOptions = {}
  ): Promise<string | void> {
    this.validateInputs(url);
    await this.checkDependencies();
    await this.prepareOutputDirectory(options.outputDir);

    const args = this.buildYtDlpArgs(url, options);
    return await this.executeDownload(args, options.verbose || false, false, options.isLive || false);
  }

  /**
   * Télécharge une playlist à partir d'une URL
   * @param url - URL de la playlist à télécharger
   * @param options - Options de téléchargement
   * @returns Promise qui se résout lorsque le téléchargement est terminé
   */
  async downloadPlaylist(
    url: string,
    options: DownloadOptions = {}
  ): Promise<string | void> {
    this.validateInputs(url);
    await this.checkDependencies();
    await this.prepareOutputDirectory(options.outputDir);

    const args = this.buildPlaylistArgs(url, options);
    return this.executeDownload(args, options.verbose || false, true, false);
  }

  private validateInputs(url: string): void {
    if (!url || typeof url !== "string" || url.trim().length === 0) {
      throw new Error("URL invalide ou manquante");
    }
  }

  private async checkDependencies(): Promise<void> {
    if (!checkFFmpeg()) {
      throw new Error(
        "FFmpeg n'est pas installé. FFmpeg est requis pour le traitement des flux et le muxing."
      );
    }
  }

  private async prepareOutputDirectory(outputDir = "downloads"): Promise<void> {
    try {
      await fs.mkdir(outputDir, { recursive: true });
    } catch (error) {
      throw new Error(
        `Impossible de créer le répertoire ${outputDir}: ${error}`
      );
    }
  }

  private buildFormatString(vq?: string, aq?: string): string {
    if (vq === "worst" && aq === "worstaudio") return "worst";
    if (vq === "worst") return "worstvideo+bestaudio/worst";
    if (aq === "worstaudio") return "bestvideo+worstaudio/best";

    let videoFormat = "bv*";
    if (vq && vq !== "best" && /^\d+$/.test(vq)) {
      videoFormat = `bv*[height<=?${vq}]`;
    } else if (vq === "worst") {
      videoFormat = "wv*";
    }

    let audioFormat = "ba*";
    if (aq && aq !== "best" && /k$/.test(aq)) {
      // Filtrer pour être au plus proche de la qualité souhaitée
      const bitrate = aq.replace("k", "");
      audioFormat = `ba*[abr<=?${bitrate}]/ba*`;
    } else if (aq === "worstaudio") {
      audioFormat = "wa*";
    }

    if (videoFormat === "bv*" && audioFormat === "ba*") {
      return "bestvideo+bestaudio/best";
    }

    return `${videoFormat}+${audioFormat}/${videoFormat}/best`;
  }

  private buildYtDlpArgs(url: string, options: DownloadOptions): string[] {
    const isLive = Boolean(options.isLive);
    const isAudioOnly = Boolean(options.audioOnly);

    const outputDir = options.outputDir || "downloads";
    const templateName = isLive
      ? "%(title)s - [LIVE %(upload_date>%Y-%m-%d)s].%(ext)s"
      : "%(title)s.%(ext)s";
    const outputTemplate = path.join(outputDir, templateName);

    const args: string[] = [
      "--js-runtimes",
      "node",
      "--newline",
      "--windows-filenames",
      "-o",
      outputTemplate,
    ];

    if (options.cookiesFromBrowser && options.cookiesFromBrowser !== "none") {
      args.push("--cookies-from-browser", options.cookiesFromBrowser);
    }

    if (isLive) {
      // Gestion des diffusions en direct (Live Streams)
      if (options.liveFromStart) {
        args.push("--live-from-start");
      } else {
        args.push("--no-live-from-start");
      }
      // Format MKV recommandé pour la résilience aux coupures des lives
      const liveFormat = options.format || "mkv";
      args.push("--merge-output-format", liveFormat);
      args.push("--fixup", "warn");
    } else if (isAudioOnly) {
      // Mode Audio seul (SoundCloud, Bandcamp, extraction MP3 / M4A)
      args.push("-x");
      args.push("--audio-format", options.audioFormat || "mp3");
      const audioQuality =
        options.audioQuality && options.audioQuality !== "best"
          ? options.audioQuality
          : "0";
      args.push("--audio-quality", audioQuality);
      args.push("--embed-metadata");
    } else {
      // Mode Vidéo standard
      const formatString = this.buildFormatString(
        options.videoQuality || options.resolution,
        options.audioQuality
      );
      args.push("-f", formatString);
      args.push("--merge-output-format", options.format || "mp4");
    }

    args.push("--console-title");
    args.push(url);

    return args;
  }

  private buildPlaylistArgs(url: string, options: DownloadOptions): string[] {
    const outputTemplate = path.join(
      options.outputDir || "downloads",
      "%(playlist)s/%(playlist_index)s - %(title)s.%(ext)s"
    );

    const args: string[] = [
      "--js-runtimes",
      "node",
      "--newline",
      "--windows-filenames",
      "-o",
      outputTemplate,
      "--console-title",
      "--yes-playlist",
    ];

    if (options.cookiesFromBrowser && options.cookiesFromBrowser !== "none") {
      args.push("--cookies-from-browser", options.cookiesFromBrowser);
    }

    if (options.audioOnly) {
      args.push("-x");
      args.push("--audio-format", options.audioFormat || "mp3");
      args.push("--embed-metadata");
    } else {
      const formatString = this.buildFormatString(
        options.videoQuality || options.resolution,
        options.audioQuality
      );
      args.push("-f", formatString);
      args.push("--merge-output-format", options.format || "mp4");
    }

    if (options.limit && options.limit > 0) {
      args.push("--playlist-items", `1-${options.limit}`);
    }

    args.push(url);
    return args;
  }

  private executeDownload(
    args: string[],
    verbose: boolean,
    isPlaylist: boolean = false,
    isLive: boolean = false
  ): Promise<string | void> {
    this.currentOutputFile = "";
    this.progress.start(isLive);

    return new Promise((resolve, reject) => {
      const emitter = this.ytDlpWrap.exec(args);
      this.activeChildProcess = (emitter as any).childProcess;

      // Gestionnaire pour capturer Ctrl+C et finaliser proprement yt-dlp
      const sigintHandler = () => {
        if (this.activeChildProcess) {
          console.log(
            chalk.yellow("\n\n🛑 Arrêt demandé : finalisation du fichier en cours...")
          );
          try {
            this.activeChildProcess.kill("SIGINT");
          } catch {
            // Ignorer si le processus est déjà arrêté
          }
        }
      };

      process.once("SIGINT", sigintHandler);

      emitter.on("ytDlpEvent", (eventType: string, eventData: string) => {
        const output = `[${eventType}] ${eventData}`;
        this.handleStdout(output, verbose, isLive);
      });

      emitter.on("close", (code) => {
        process.removeListener("SIGINT", sigintHandler);
        this.activeChildProcess = null;
        this.progress.stop();

        // Le code 0 ou code d'interruption propre (ex: live stream stoppé par l'utilisateur)
        if (code === 0 || (isLive && (code === null || code === 130 || code === 1))) {
          if (isPlaylist) {
            resolve();
          } else {
            resolve(this.currentOutputFile || "Fichier téléchargé");
          }
        } else {
          reject(new Error(`Téléchargement terminé avec le code ${code}`));
        }
      });

      emitter.on("error", (error) => {
        process.removeListener("SIGINT", sigintHandler);
        this.activeChildProcess = null;
        this.progress.stop();
        reject(
          new Error(`Erreur lors du lancement de yt-dlp: ${error.message}`)
        );
      });
    });
  }

  private handleStdout(output: string, verbose: boolean, isLive: boolean): void {
    if (verbose) {
      console.log(chalk.gray(output.trim()));
    }

    const destinationMatch = output.match(/\[download] Destination: (.+)/);
    if (destinationMatch) {
      this.currentOutputFile = destinationMatch[1];
    }

    const mergeMatch = output.match(/\[ffmpeg] Merging formats into "(.+)"/);
    if (mergeMatch) {
      this.currentOutputFile = mergeMatch[1];
    }

    const audioMatch = output.match(/\[ExtractAudio] Destination: (.+)/);
    if (audioMatch) {
      this.currentOutputFile = audioMatch[1];
    }

    this.updateProgress(output, isLive);
  }

  private updateProgress(output: string, isLive: boolean): void {
    // Cas 1: Téléchargement avec pourcentage et total connu
    const downloadingMatch = output.match(
      /\[download]\s+(\d+\.?\d*)%\s+of\s+~?(\d+\.?\d*)\s*([KMGTP]?i?B)\s+at\s+(\d+\.?\d*)\s*([KMGTP]?i?B\/s)/i
    );

    if (downloadingMatch) {
      const percent = parseFloat(downloadingMatch[1]);
      const size = `${downloadingMatch[2]}${downloadingMatch[3]}`;
      const speed = `${downloadingMatch[4]}${downloadingMatch[5]}`;

      this.progress.update({
        percent,
        size,
        speed,
        status: `${size} à ${speed}`,
        isLive: false,
      });
      return;
    }

    // Cas 2: Flux direct (Live Stream) ou taille totale indéterminée
    const streamMatch = output.match(
      /\[download]\s+~?(\d+\.?\d*)\s*([KMGTP]?i?B)(?:\s+\([^)]+\))?\s+at\s+(\d+\.?\d*)\s*([KMGTP]?i?B\/s)/i
    );

    if (streamMatch) {
      const size = `${streamMatch[1]}${streamMatch[2]}`;
      const speed = `${streamMatch[3]}${streamMatch[4]}`;

      this.progress.update({
        size,
        speed,
        status: `${size} reçus (${speed})`,
        isLive: isLive || true,
      });
      return;
    }

    // Cas 3: Post-traitements
    if (output.includes("[ExtractAudio]")) {
      this.progress.update({
        percent: 98,
        status: "Extraction et encodage audio...",
      });
    } else if (output.includes("[ffmpeg] Merging formats")) {
      this.progress.update({
        percent: 99,
        status: "Finalisation du fichier...",
      });
    } else if (output.includes("[download] Downloading video")) {
      const videoMatch = output.match(
        /\[download] Downloading video (\d+) of (\d+)/
      );
      if (videoMatch) {
        const current = parseInt(videoMatch[1]);
        const total = parseInt(videoMatch[2]);
        this.progress.update({
          percent: (current / total) * 100,
          status: `Vidéo ${current}/${total}`,
        });
      }
    }
  }
}
