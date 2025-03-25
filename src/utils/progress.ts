import readline from "readline";
import chalk from "chalk";

interface ProgressData {
  percent?: number;
  size?: string;
  speed?: string;
  status?: string;
}

export class DownloadProgress {
  private interval: NodeJS.Timeout | null = null;
  private data: ProgressData = {
    percent: 0,
    size: "0B",
    speed: "0B/s",
    status: "En attente...",
  };

  /**
   * Démarre l'affichage de la progression
   */
  public start(): void {
    if (this.interval) {
      clearInterval(this.interval);
    }

    // Mettre à jour l'affichage toutes les 100ms
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
   * Affiche la barre de progression
   */
  private render(): void {
    const { percent = 0, size = "", speed = "", status = "" } = this.data;

    // Créer la barre de progression
    const width = Math.min(process.stdout.columns - 30, 50);
    const complete = Math.round((width * percent) / 100);
    const incomplete = width - complete;

    const bar =
      chalk.green("█".repeat(complete)) + chalk.gray("░".repeat(incomplete));

    // Créer la ligne complète
    const line = `${bar} ${percent.toFixed(1)}% ${status ? `| ${status}` : ""}`;

    // Effacer la ligne actuelle et afficher la nouvelle
    readline.clearLine(process.stdout, 0);
    readline.cursorTo(process.stdout, 0);
    process.stdout.write(line);
  }
}
