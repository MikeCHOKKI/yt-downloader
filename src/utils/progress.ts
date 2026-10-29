import readline from "readline";
import chalk from "chalk";

export interface ProgressData {
  percent?: number;
  size?: string;
  speed?: string;
  status?: string;
  isLive?: boolean;
}

export class DownloadProgress {
  private interval: NodeJS.Timeout | null = null;
  private spinnerIndex = 0;
  private readonly spinnerFrames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  private data: ProgressData = {
    percent: 0,
    size: "0B",
    speed: "0B/s",
    status: "En attente...",
    isLive: false,
  };

  /**
   * Démarre l'affichage de la progression
   */
  public start(isLive: boolean = false): void {
    if (this.interval) {
      clearInterval(this.interval);
    }

    this.data.isLive = isLive;
    this.interval = setInterval(() => this.render(), 100);
  }

  /**
   * Arrête l'affichage de la progression
   */
  public stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;

      // Effacer la ligne et repositionner le curseur
      readline.clearLine(process.stdout, 0);
      readline.cursorTo(process.stdout, 0);
    }
  }

  /**
   * Met à jour les données de progression
   * @param data Nouvelles données
   */
  public update(data: ProgressData): void {
    this.data = { ...this.data, ...data };
  }

  /**
   * Affiche la barre de progression ou le statut du direct
   */
  private render(): void {
    const { percent = 0, status = "", isLive = false } = this.data;
    const spinner = chalk.cyan(this.spinnerFrames[this.spinnerIndex % this.spinnerFrames.length]);
    this.spinnerIndex++;

    let line = "";

    if (isLive) {
      // Affichage spécifique pour un flux direct continu
      line = `${chalk.red("🔴 [EN DIRECT]")} ${spinner} ${status || "Enregistrement en cours..."} ${chalk.gray("(Ctrl+C pour finaliser)")}`;
    } else {
      // Détermination sécurisée de la largeur de la console
      const cols =
        process.stdout.columns && !isNaN(process.stdout.columns)
          ? process.stdout.columns
          : 80;
      const width = Math.min(Math.max(cols - 35, 10), 45);
      const safePercent = Math.max(0, Math.min(100, isNaN(percent) ? 0 : percent));
      const complete = Math.max(0, Math.min(width, Math.round((width * safePercent) / 100)));
      const incomplete = Math.max(0, width - complete);

      const bar =
        chalk.green("█".repeat(complete)) + chalk.gray("░".repeat(incomplete));

      line = `${spinner} ${bar} ${safePercent.toFixed(1)}% ${status ? `| ${status}` : ""}`;
    }

    // Effacer la ligne actuelle et afficher la nouvelle
    readline.clearLine(process.stdout, 0);
    readline.cursorTo(process.stdout, 0);
    process.stdout.write(line);
  }
}
