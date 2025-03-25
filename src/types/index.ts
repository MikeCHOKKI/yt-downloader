export interface DownloadOptions {
  resolution?: string;
  outputDir?: string;
  format?: string;
  verbose?: boolean;
  limit?: number;
}

export interface VideoInfo {
  title: string;
  duration: number;
  filesize: number;
  url: string;
}

export interface PlaylistInfo {
  title: string;
  videoCount: number;
  totalSize: number;
  totalDuration: number;
  videos: VideoInfo[];
}

export interface Config {
  resolution: string;
  outputDir: string;
  format: string;
  verbose: boolean;
}
