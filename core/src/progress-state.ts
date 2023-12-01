import { SECOND_PER_CHUNK } from 'hash-gen/_internal';

export class ProgressState {
  private _totalProgress: number;

  private _totalRemainingTime: number;

  private _estimatedTotalTime: number;

  private _startTime = 0;

  private _currentBytes = 0;

  private _totalBytes = 0;

  constructor() {
    this._totalProgress = 0;
    this._totalRemainingTime = 0;
    this._estimatedTotalTime = 0;
    this._startTime = 0;
    this._currentBytes = 0;
    this._totalBytes = 0;
  }

  get totalProgress() {
    return Math.round(this._totalProgress * 100);
  }

  get totalRemainingTime() {
    return Math.round(this._totalRemainingTime);
  }

  get estimatedTotalTime() {
    return this._estimatedTotalTime;
  }

  getState() {
    return {
      totalProgress: this.totalProgress,
      totalRemainingTime: this.totalRemainingTime,
      estimatedTotalTime: this.estimatedTotalTime,
      currentBytes: this._currentBytes,
      totalBytes: this._totalBytes,
    };
  }

  changeStartTime(time: number) {
    this._startTime = time;
  }

  addTotalBytes(bytes: number) {
    this._totalBytes += bytes;
  }

  addCurrentBytes(bytes: number) {
    this._currentBytes += bytes;
  }

  calculateTotalProgress() {
    this._totalProgress = this._currentBytes / this._totalBytes;
  }

  /**
   * @description 개별 파일의 예상 처리 시간을 계산합니다.
   * @param {number} progress */
  calculateRemainingTime(progress: number) {
    const currentTime = performance.now();
    const elapsedTime = (currentTime - this._startTime) / SECOND_PER_CHUNK; // ms to seconds
    const estimatedTotalTime = (elapsedTime / progress) * 100;
    const remainingTime = estimatedTotalTime - elapsedTime;
    // console.log('----------------------------------------');
    // console.log(`개별 상태`);
    // console.log(`진행률: ${progress}%`);
    // console.log(`남은 시간: ${remainingTime.toFixed(2)} 초`);
    // console.log(`경과 시간: ${elapsedTime.toFixed(2)} 초`);
    // console.log(`예상 처리 시간: ${estimatedTotalTime.toFixed(2)} 초`);
    // console.log('----------------------------------------');
    return remainingTime;
  }

  /**
   * @description 전체 예상 처리 시간을 계산합니다.
   * @param {number?} ct - 현재 시간
   */
  calculateTotalRemainingTime(ct?: number) {
    const currentTime = ct || performance.now();
    const totalBytes = this._totalBytes;
    const currentBytes = this._currentBytes;

    const progress = (currentBytes / totalBytes) * 100;
    const elapsedTime = (currentTime - this._startTime) / SECOND_PER_CHUNK; // ms to seconds
    const estimatedTotalTime = (elapsedTime / progress) * 100;
    const remainingTime = estimatedTotalTime - elapsedTime;

    // console.log('----------------------------------------');
    // console.log('전체 상태');
    // console.log(`전체 바이트: ${totalBytes} ${this.getByteSize(totalBytes)}`);
    // console.log(
    //   `현재 바이트: ${currentBytes} ${this.getByteSize(currentBytes)}`,
    // );
    // console.log(`진행률: ${progress}%`);
    // console.log(`남은 시간: ${remainingTime.toFixed(2)} 초`);
    // console.log(`경과 시간: ${elapsedTime.toFixed(2)} 초`);
    // console.log(`예상 처리 시간: ${estimatedTotalTime.toFixed(2)} 초`);
    // console.log('----------------------------------------');
    this._totalRemainingTime = remainingTime;

    return remainingTime;
  }

  /**
   * @description 해시 생성 클래스를 제거한다. */
  cleanup() {
    this._totalProgress = 0;
    this._totalRemainingTime = 0;
    this._estimatedTotalTime = 0;
    this._startTime = 0;
    this._currentBytes = 0;
    this._totalBytes = 0;
  }
}
