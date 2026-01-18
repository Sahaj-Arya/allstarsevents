declare module "html5-qrcode" {
  export class Html5Qrcode {
    constructor(elementId: string);
    start(
      config: { facingMode?: string; deviceId?: { exact: string } },
      options: {
        fps?: number;
        qrbox?: number | { width: number; height: number };
        aspectRatio?: number;
        disableFlip?: boolean;
      },
      onSuccess: (text: string) => void,
      onError: (message: string) => void,
    ): Promise<void>;
    stop(): Promise<void>;
    clear(): void;
    static getCameras(): Promise<Array<{ id: string; label: string }>>;
  }
}
