import type { FileInfo } from './types';

const HAHS_FILE = new Map<number, FileInfo>();

export const getHashFiles = () => {
  return [...HAHS_FILE.values()];
};

export const getHashFile = (index: number) => {
  return HAHS_FILE.get(index);
};

const setHashFile = (index: number, fileInfo: FileInfo) => {
  HAHS_FILE.set(index, fileInfo);
};

export const clearHashFile = () => {
  HAHS_FILE.clear();
};

export const setInitHashFile = (index: number, file: File) => {
  setHashFile(index, {
    index,
    file,
    hash: undefined,
    progress: 0,
    remainingTime: 0,
  });
};

export const updateHashFile = (index: number, input: Partial<FileInfo>) => {
  const fileInfo = getHashFile(index);
  if (fileInfo) {
    setHashFile(index, { ...fileInfo, ...input });
  }
};
