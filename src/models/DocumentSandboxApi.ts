export interface DocumentSandboxApi {
  insertMath(options: {
    imageData: ArrayBuffer;
    width: number;
    height: number;
    position?: { x: number; y: number };
  }): Promise<void>;

  createRectangle(): Promise<void>;

  getSelectedText(): Promise<string | null>;
}
