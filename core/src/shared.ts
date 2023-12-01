import { MAX_CHUNK_SIZE } from 'hash-gen/_internal';

export const has2GBLimitation = (file: File) => {
  return file.size > MAX_CHUNK_SIZE;
};

export const getByteSize = (bytes: number) => {
  if (bytes === 0) {
    return '0 B';
  }

  const k = 1024;
  const dm = 2;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${
    sizes[i]
  }`;
};

/**
 * @description 파일을 읽어서 arraybuffer or uint8array로 반환합니다.
 * @param {File} file
 * @param {number} start
 * @param {number} end
 * @param {boolean?} returnUint8Array
 */
export const fileReader = <T extends boolean | undefined = false>(
  file: File,
  start?: number | undefined,
  end?: number | undefined,
  returnUint8Array?: T,
) => {
  return new Promise<T extends false | undefined ? ArrayBuffer : Uint8Array>(
    (resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const arrayBuffer = reader.result as ArrayBuffer;
        if (returnUint8Array) {
          const uint8Array = new Uint8Array(arrayBuffer);
          return resolve(uint8Array as any);
        }
        resolve(arrayBuffer as any);
      };

      reader.onerror = () => {
        reject(reader.error);
      };

      const blob = file.slice(start, end);
      reader.readAsArrayBuffer(blob);
    },
  );
};
