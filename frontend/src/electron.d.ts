export {};

declare global {
  interface Window {
    electronAPI?: {
      minimize: () => Promise<void>;
      maximize: () => Promise<boolean>;
      close: () => Promise<void>;
      isMaximized: () => Promise<boolean>;
      openFile: (options: any) => Promise<any>;
      saveFile: (options: any) => Promise<any>;
      getAppVersion: () => Promise<string>;
      onMenuNewBook: (callback: () => void) => () => void;
      onMenuNewChapter: (callback: () => void) => () => void;
      onMenuSave: (callback: () => void) => () => void;
      platform: string;
    };
  }
}
