// AudioCache.ts: XHR audio download → blob URL storage; getAudioUrl() used by ChiptunePlayer

let _audioBlobUrl = '/assets/donne_ricche.ogg';

/** Returns the preloaded blob URL, or the original path if XHR has not completed. */
export function getAudioUrl(): string {
  return _audioBlobUrl;
}

/** Called by AssetLoader after XHR completes. */
export function setAudioBlobUrl(url: string): void {
  _audioBlobUrl = url;
}

export function loadAudio(onProgress: (pct: number) => void): Promise<void> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', '/assets/donne_ricche.ogg');
    xhr.responseType = 'blob';

    xhr.onprogress = (e) => {
      if (e.lengthComputable && e.total > 0) onProgress(e.loaded / e.total);
    };

    xhr.onload = () => {
      _audioBlobUrl = URL.createObjectURL(xhr.response as Blob);
      onProgress(1);
      resolve();
    };

    xhr.onerror = () => {
      onProgress(1);
      resolve();
    };
    xhr.send();
  });
}
