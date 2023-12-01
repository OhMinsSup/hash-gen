export type Callback = (...arguments_: any) => void;

export type HashType = 'SHA256' | 'SHA1' | 'MD5';

export type FileInfo = {
  index: number;
  file: File;
  hash?: string | undefined;
  progress: number;
  remainingTime: number;
};

export type HashGeneratorParams = {
  hashType: HashType;
  files: File[];
  onNotify?: (event: NotifyEvent) => void;
};

export type NotifyEventType =
  | 'initialized'
  | 'start'
  | 'status'
  | 'success'
  | 'done'
  | 'error';

export interface BaseNotifyEvent {
  type: NotifyEventType;
}

export interface NotifyEventInitialized extends BaseNotifyEvent {
  type: 'initialized';
}

export interface NotifyEventStart extends BaseNotifyEvent {
  type: 'start';
  payload: FileInfo[];
}

export interface NotifyEventStatus extends BaseNotifyEvent {
  type: 'status';
  currentIndex: number;
  payload: FileInfo[];
  state: {
    totalProgress: number;
    totalRemainingTime: number;
    estimatedTotalTime: number;
    currentBytes: number;
    totalBytes: number;
  };
}

export interface NotifyEventSuccess extends BaseNotifyEvent {
  type: 'success';
  payload: FileInfo[];
  state: {
    totalProgress: number;
    totalRemainingTime: number;
    estimatedTotalTime: number;
    currentBytes: number;
    totalBytes: number;
  };
}

export interface NotifyEventDone extends BaseNotifyEvent {
  type: 'done';
}

export interface NotifyEventError extends BaseNotifyEvent {
  type: 'error';
}

export type NotifyEvent =
  | NotifyEventInitialized
  | NotifyEventStart
  | NotifyEventStatus
  | NotifyEventSuccess
  | NotifyEventDone
  | NotifyEventError;
