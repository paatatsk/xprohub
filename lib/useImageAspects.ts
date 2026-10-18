import { useEffect, useState } from 'react';
import { Image } from 'react-native';

/**
 * Natural aspect ratio (width / height) for each image URL, measured once
 * with Image.getSize. URLs not yet measured (or that fail) are absent, so
 * callers should fall back to a default ratio.
 */
export function useImageAspects(urls: string[]): Record<string, number> {
  const [aspects, setAspects] = useState<Record<string, number>>({});
  const key = urls.join('|');

  useEffect(() => {
    let cancelled = false;
    urls.forEach((url) => {
      if (aspects[url]) return;
      Image.getSize(
        url,
        (w, h) => {
          if (!cancelled && w > 0 && h > 0) {
            setAspects((prev) => ({ ...prev, [url]: w / h }));
          }
        },
        () => {},
      );
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return aspects;
}
