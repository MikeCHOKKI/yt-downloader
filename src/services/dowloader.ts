import { spawn } from "child_process";
import fs from "fs/promises";
import path from "path";
import chalk from "chalk";
import type { DownloadOptions } from "../types";
import { checkFFmpeg } from "../utils/ffmpeg";
import { DownloadProgress } from "../utils/progress";

export class VideoDownloader {
  private readonly progress: DownloadProgress;

  constructor() {
    this.progress = new DownloadProgress();
  }

  /**
   * Télécharge une vidéo à partir d'une URL
   * @param url - URL de la vidéo à télécharger
   * @param options - Options de téléchargement
   * @returns Promise qui se résout avec le chemin du fichier téléchargé
   * @throws Error si le téléchargement échoue
   */
  async downloadVideo(
    url: string,
    options: DownloadOptions = {}
  ): Promise<string> {
    this.validateInputs(url);
    await this.checkDependencies();
    await this.prepareOutputDirectory(options.outputDir);

    const args = this.buildYtDlpArgs(url, options);
    return this.executeDownload(args, options.verbose || false);
  }

  /**
   * Télécharge une playlist à partir d'une URL
   * @param url - URL de la playlist à télécharger
   * @param options - Options de téléchargement
   * @returns Promise qui se résout lorsque le téléchargement est terminé
   * @throws Error si le téléchargement échoue
   */
  async downloadPlaylist(
    url: string,
    options: DownloadOptions = {}
  ): Promise<string> {
    this.validateInputs(url);
    await this.checkDependencies();
    await this.prepareOutputDirectory(options.outputDir);

    const args = this.buildPlaylistArgs(url, options);
    return this.executeDownload(args, options.verbose || false);
  }

  private validateInputs(url: string): void {
    if (!url) {
      throw new Error("URL invalide ou manquante");
    }
  }

  private async checkDependencies(): Promise<void> {
    if (!checkFFmpeg()) {
      throw new Error(
        "FFmpeg n'est pas installé. Installation requise pour fusionner les flux."
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

  private buildYtDlpArgs(url: string, options: DownloadOptions): string[] {
    const outputTemplate = path.join(
      options.outputDir || "downloads",
      "%(title)s.%(ext)s"
    );
    const format = options.resolution
      ? `bestvideo[height<=${options.resolution}]+bestaudio/best[height<=${options.resolution}]`
      : "bestvideo+bestaudio/best";

    return [
      "--newline",
      "-o",
      outputTemplate,
      "-f",
      format,
      "--merge-output-format",
      options.format || "mp4",
      "--console-title",
      url,
    ];
  }

  private buildPlaylistArgs(url: string, options: DownloadOptions): string[] {
    const outputTemplate = path.join(
      options.outputDir || "downloads",
      "%(playlist)s/%(playlist_index)s - %(title)s.%(ext)s"
    );

    const format = options.resolution
      ? `bestvideo[height<=${options.resolution}]+bestaudio/best[height<=${options.resolution}]`
      : "bestvideo+bestaudio/best";

    const args = [
      "--newline",
      "-o",
      outputTemplate,
      "-f",
      format,
      "--merge-output-format",
      options.format || "mp4",
      "--console-title",
      "--yes-playlist",
    ];

    // Limiter le nombre de vidéos si spécifié
    if (options.limit && options.limit > 0) {
      args.push("--playlist-items", `1-${options.limit}`);
    }

    args.push(url);
    return args;
  }

  private executeDownload(args: string[], verbose: boolean): Promise<string> {
    let outputFile = "";
    this.progress.start();

    return new Promise((resolve, reject) => {
      const ytdl = spawn("yt-dlp", args);

      ytdl.stdout.on("data", (data) =>
        this.handleStdout(data.toString(), verbose, outputFile)
      );
      ytdl.stderr.on("data", (data) =>
        this.handleStderr(data.toString(), verbose)
      );

      ytdl.on("close", (code) => {
        this.progress.stop();
        if (code === 0) {
          resolve(outputFile);
        } else {
          reject(new Error(`Téléchargement échoué avec le code ${code}`));
        }
      });

      ytdl.on("error", (error) => {
        this.progress.stop();
        reject(
          new Error(`Erreur lors du lancement de yt-dlp: ${error.message}`)
        );
      });
    });
  }

  private handleStdout(
    output: string,
    verbose: boolean,
    outputFile: string
  ): void {
    if (verbose) {
      console.log(chalk.gray(output.trim()));
    }

    const destinationMatch = output.match(/\[download] Destination: (.+)/);
    if (destinationMatch) {
      outputFile = destinationMatch[1];
    }

    this.updateProgress(output);
  }

  private handleStderr(output: string, verbose: boolean): void {
    if (verbose) {
      console.error(chalk.red(output.trim()));
    }
  }

  private updateProgress(output: string): void {
    const downloadingMatch = output.match(
      /\[download]\s+(\d+\.\d+)%\s+of\s+~?(\d+\.\d+)([KMG])iB\s+at\s+(\d+\.\d+)([KMG])iB\/s/
    );

    if (downloadingMatch) {
      const percent = parseFloat(downloadingMatch[1]);
      const size = `${downloadingMatch[2]}${downloadingMatch[3]}iB`;
      const speed = `${downloadingMatch[4]}${downloadingMatch[5]}iB/s`;

      this.progress.update({
        percent,
        size,
        speed,
        status: `${size} à ${speed}`,
      });
    } else if (output.includes("[ffmpeg] Merging formats")) {
      this.progress.update({
        percent: 100,
        status: "Fusion des formats...",
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
