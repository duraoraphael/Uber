import { useState, useCallback } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';

interface UploadState {
  progress: number;
  uploading: boolean;
  error: string | null;
  url: string | null;
}

export function useStorage() {
  const [state, setState] = useState<UploadState>({
    progress: 0,
    uploading: false,
    error: null,
    url: null,
  });

  const uploadFile = useCallback(async (
    file: File,
    path: string,
  ): Promise<string> => {
    setState({ progress: 0, uploading: true, error: null, url: null });

    return new Promise((resolve, reject) => {
      const storageRef = ref(storage, path);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setState((prev) => ({ ...prev, progress }));
        },
        (error) => {
          const msg = error.message || 'Erro ao fazer upload';
          setState({ progress: 0, uploading: false, error: msg, url: null });
          reject(new Error(msg));
        },
        async () => {
          try {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            setState({ progress: 100, uploading: false, error: null, url });
            resolve(url);
          } catch (error) {
            const msg = error instanceof Error ? error.message : 'Erro ao obter URL';
            setState({ progress: 0, uploading: false, error: msg, url: null });
            reject(new Error(msg));
          }
        },
      );
    });
  }, []);

  const reset = useCallback(() => {
    setState({ progress: 0, uploading: false, error: null, url: null });
  }, []);

  return { ...state, uploadFile, reset };
}
