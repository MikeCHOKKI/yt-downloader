export interface DownloadOptions {
  resolution?: string;
  outputDir?: string;
  format?: string;
  verbose?: boolean;
  limit?: number;
  audioQuality?: string;
  videoQuality?: string;
  audioOnly?: boolean;
  audioFormat?: string;
  isLive?: boolean;
  liveFromStart?: boolean;
  cookiesFromBrowser?: string;
}

export interface VideoInfo {
  title: string;
  duration: number;
  filesize: number;
  url: string;
  extractor: string;
  isLive: boolean;
  liveStatus?: string;
  hasVideo?: boolean;
  hasAudio?: boolean;
  thumbnail?: string;
}

export interface PlaylistInfo {
  title: string;
  videoCount: number;
  totalSize: number;
  totalDuration: number;
  extractor: string;
  videos: VideoInfo[];
}

export interface Config {
  resolution: string;
  outputDir: string;
  format: string;
  verbose: boolean;
  audioQuality: string;
  videoQuality: string;
  audioFormat: string;
  cookiesFromBrowser?: string;
}
