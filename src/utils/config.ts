import fs from "fs";
import path from "path";
import os from "os";
import { Config } from "../types";

const CONFIG_FILE = path.join(os.homedir(), ".ytdownloader.json");

// Configuration par défaut
const DEFAULT_CONFIG: Config = {
  resolution: "1080",
  outputDir: "downloads",
  format: "mp4",
  verbose: false,
};

/**
 * Charge la configuration depuis le fichier
 * @returns Configuration chargée ou par défaut si non trouvée
 */
export function loadConfig(): Config {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, "utf8");
      const config = JSON.parse(data);
      return { ...DEFAULT_CONFIG, ...config };
    }
  } catch (error) {
    console.error("Erreur lors du chargement de la configuration:", error);
  }

  // Si le fichier n'existe pas ou erreur, utiliser la config par défaut
  return { ...DEFAULT_CONFIG };
}

/**
 * Enregistre la configuration dans le fichier
 * @param config Configuration à sauvegarder
 */
export function saveConfig(config: Config): void {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), "utf8");
  } catch (error) {
    console.error(
      "Erreur lors de l'enregistrement de la configuration:",
      error
    );
  }
}
