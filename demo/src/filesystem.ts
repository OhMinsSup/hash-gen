import { fileOpen as _fileOpen } from 'browser-fs-access';
// @ts-ignore
import debounce from 'lodash.debounce';

export enum EVENT {
  KEYUP = 'keyup',
  POINTER_UP = 'pointerup',
  FOCUS = 'focus',
}

export const IMAGE_MIME_TYPES = {
  svg: 'image/svg+xml',
  png: 'image/png',
  jpg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  bmp: 'image/bmp',
  ico: 'image/x-icon',
  avif: 'image/avif',
  jfif: 'image/jfif',
} as const;

export const MIME_TYPES = {
  json: 'application/json',
  binary: 'application/octet-stream',
  plain: 'text/plain',
  zip: 'application/zip',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pdf: 'application/pdf',
  // image
  ...IMAGE_MIME_TYPES,
} as const;

type CANVAS_ERROR_NAMES = 'CANVAS_ERROR' | 'CANVAS_POSSIBLY_TOO_BIG';

export class CanvasError extends Error {
  constructor(
    message = "Couldn't export canvas.",
    name: CANVAS_ERROR_NAMES = 'CANVAS_ERROR',
  ) {
    super();
    this.name = name;
    this.message = message;
  }
}

export class AbortError extends DOMException {
  constructor(message = 'Request Aborted') {
    super(message, 'AbortError');
  }
}

type FILE_EXTENSION = Exclude<keyof typeof MIME_TYPES, 'binary'>;

const INPUT_CHANGE_INTERVAL_MS = 500;

export const fileOpen = <M extends boolean | undefined = false>(opts: {
  extensions?: FILE_EXTENSION[];
  description: string;
  multiple?: M;
}): Promise<M extends false | undefined ? File : File[]> => {
  type RetType = M extends false | undefined ? File : File[];

  const mimeTypes = opts.extensions?.reduce((mimeTypes, type) => {
    mimeTypes.push(MIME_TYPES[type]);

    return mimeTypes;
  }, [] as string[]);

  const extensions = opts.extensions?.reduce((acc, ext) => {
    if (ext === 'jpg') {
      return acc.concat('.jpg', '.jpeg');
    }
    return acc.concat(`.${ext}`);
  }, [] as string[]);

  return _fileOpen({
    description: opts.description,
    extensions,
    mimeTypes,
    multiple: opts.multiple ?? false,
    legacySetup: (resolve, reject, input) => {
      const scheduleRejection = debounce(reject, INPUT_CHANGE_INTERVAL_MS);
      const focusHandler = () => {
        checkForFile();
        document.addEventListener(EVENT.KEYUP, scheduleRejection);
        document.addEventListener(EVENT.POINTER_UP, scheduleRejection);
        scheduleRejection();
      };
      const checkForFile = () => {
        if (input.files?.length) {
          const ret = opts.multiple ? [...input.files] : input.files[0];
          resolve(ret as RetType);
        }
      };
      requestAnimationFrame(() => {
        window.addEventListener(EVENT.FOCUS, focusHandler);
      });
      const interval = window.setInterval(() => {
        checkForFile();
      }, INPUT_CHANGE_INTERVAL_MS);
      return (rejectPromise) => {
        clearInterval(interval);
        scheduleRejection.cancel();
        window.removeEventListener(EVENT.FOCUS, focusHandler);
        document.removeEventListener(EVENT.KEYUP, scheduleRejection);
        document.removeEventListener(EVENT.POINTER_UP, scheduleRejection);
        if (rejectPromise) {
          console.warn('Opening the file was canceled (legacy-fs).');
          rejectPromise(new AbortError());
        }
      };
    },
  }) as Promise<RetType>;
};
