import { createMD5, createSHA1, createSHA256 } from 'hash-wasm';

import {
  CHUNK_SIZE,
  MAX_LIMIT_PAGE_SIZE,
  PAGE_SIZE,
  HashGeneratorError,
  noop,
  isFunction,
} from 'hash-gen/_internal';

import {
  fileReader,
  has2GBLimitation,
  getHashFile,
  clearHashFile,
  setInitHashFile,
  updateHashFile,
  getHashFiles,
  ProgressState,
} from 'hash-gen/core';

import type {
  HashType,
  HashGeneratorParams,
  FileInfo,
  NotifyEvent,
} from 'hash-gen/core';
import type { Hasher } from './types';

export class HashGenerator {
  private _hashType: HashType | undefined;

  private _state = new ProgressState();

  private _algorithm = new Map<number, Hasher>();

  private _onNotify: (event: NotifyEvent) => void = noop;

  /**
   * @description 파일 해시 생성을 시작합니다.
   * @param {HashGeneratorParams}
   */
  async run({ hashType, files, onNotify }: HashGeneratorParams) {
    // 기존 상태를 초기화합니다.
    this.initState();
    // 해시 타입 설정
    this._hashType = hashType;

    if (isFunction(onNotify)) {
      this._onNotify = onNotify;
    }

    // 파일 목록을 해시 생성을 위한 상태로 변환합니다.
    this._state.changeStartTime(performance.now());
    this._onNotify({ type: 'initialized' });

    for (const [index, file] of files.entries()) {
      setInitHashFile(index, file);
      this._state.addTotalBytes(file.size);
    }

    this._onNotify({ type: 'start', payload: getHashFiles() });
    const data = await this._runFilesExclusive(files);
    this._onNotify({ type: 'done' });

    return data;
  }

  // 파일이 하나라도 2GB 이상이면, 로직 루트를 다른 형태로 수정
  private async _runFilesExclusive(files: File[]) {
    let currentPage = 0;
    const size = files.length > MAX_LIMIT_PAGE_SIZE ? PAGE_SIZE : files.length;
    const maxPage = Math.ceil(files.length / size);

    while (currentPage < maxPage) {
      const start = currentPage * size;
      const end = start + size;
      const currentFiles = files.slice(start, end);

      const primises = currentFiles.map((file, index) => {
        const nextIndex = start + index;
        return this._generateHash(file, nextIndex);
      });

      await Promise.all(primises);

      currentPage += 1;
    }

    this._onNotify({
      type: 'success',
      payload: getHashFiles(),
      state: this._state.getState(),
    });

    return getHashFiles();
  }

  private async _generateHash(file: File, index: number) {
    switch (this._hashType) {
      case 'SHA1': {
        this._algorithm.set(index, await createSHA1());
        break;
      }
      case 'MD5': {
        this._algorithm.set(index, await createMD5());
        break;
      }
      case 'SHA256': {
        this._algorithm.set(index, await createSHA256());
        break;
      }
      default: {
        throw new HashGeneratorError('invalid hash type');
      }
    }

    return await this._chunkReaderWithGenerateHash(
      file,
      index,
      has2GBLimitation(file),
    );
  }

  /**
   * @description 파일을 읽어서 해시 값을 계산합니다.
   * @param {File} file
   * @param {number} index
   * @param {boolean?} isBigSize
   * */
  private async _chunkReaderWithGenerateHash(
    file: File,
    index: number,
    isBigSize?: boolean,
  ) {
    let chunkSize = 0;
    let offset = 0;
    const fileSize = file.size;

    const algorithm = this._algorithm.get(index);
    if (!algorithm) {
      throw new HashGeneratorError('invalid hash algorithm');
    }

    algorithm.init();

    if (file.size === 0) {
      updateHashFile(index, {
        hash: algorithm.digest(),
        progress: 100,
        remainingTime: 0,
      });

      this._state.calculateTotalProgress();

      this._onNotify({
        type: 'status',
        currentIndex: index,
        payload: getHashFiles(),
        state: this._state.getState(),
      });
    } else {
      if (isBigSize) {
        // 크롬에서는 2GB 초과의 arraybuffer를 읽을 수 없다.
        chunkSize = CHUNK_SIZE;
      } else {
        // 얼마큼 읽을지 결정한다. 50MB보다 작으면, 파일 크기만큼 읽는다.
        chunkSize = fileSize > CHUNK_SIZE ? CHUNK_SIZE : fileSize;
      }

      while (offset < fileSize) {
        const ct = performance.now();
        const end = Math.min(offset + chunkSize, fileSize);

        const chunkDataArray = await fileReader(file, offset, end, true);

        algorithm.update(chunkDataArray);

        offset += chunkDataArray.length;

        const progress = (fileSize > 0 ? offset / fileSize : 0) * 100;
        const remainingTime = this._state.calculateRemainingTime(progress);

        updateHashFile(index, {
          progress: Math.round(progress),
          remainingTime: Math.round(remainingTime),
        });

        this._state.addCurrentBytes(chunkDataArray.length);
        this._state.calculateTotalProgress();
        this._state.calculateTotalRemainingTime(ct);

        this._onNotify({
          type: 'status',
          currentIndex: index,
          payload: getHashFiles(),
          state: this._state.getState(),
        });

        if (offset >= fileSize) {
          break;
        }
      }

      // 최종 해시 값을 계산합니다.
      updateHashFile(index, {
        hash: algorithm.digest(),
      });

      this._state.calculateTotalProgress();
      this._algorithm.delete(index);

      this._onNotify({
        type: 'status',
        currentIndex: index,
        payload: getHashFiles(),
        state: this._state.getState(),
      });
    }

    return getHashFile(index) as FileInfo;
  }

  /**
   * @description 해시 생성 클래스를 제거한다. */
  cleanup() {
    this.initState();
    this.initEvents();
  }

  /**
   * @description 해시 생성 클래스의 상태값을 초기화 */
  initState() {
    this._state.cleanup();
    this._hashType = undefined;
    this._onNotify = noop;
    this._algorithm.clear();
    clearHashFile();
  }

  /**
   * @description 해시 생성 클래스의 이벤트 초기화 */
  initEvents() {}
}
