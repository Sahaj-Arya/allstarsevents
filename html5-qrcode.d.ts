declare module "html5-qrcode" {
  export class Html5Qrcode {
    constructor(elementId: string);
    start(
      config: { facingMode: string },
      options: { fps: number; qrbox: number },
      onSuccess: (text: string) => void,
      onError: (message: string) => void
    ): Promise<void>;
    stop(): Promise<void>;
    clear(): void;
  }
}
