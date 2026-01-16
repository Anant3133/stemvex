/**
 * insertMath - Sandbox command to create math equation images on canvas
 *
 * Why this lives in the Sandbox:
 * - ALL canvas mutations must happen in the Document Sandbox
 * - Only the sandbox has access to editor.createImageContainer()
 * - The UI sends bitmap image data, sandbox creates the MediaContainerNode
 */

import { editor } from "express-document-sdk";

export interface InsertMathPayload {
  imageData: ArrayBuffer; // PNG image as ArrayBuffer
  width: number;
  height: number;
  position?: { x: number; y: number };
}

/**
 * Insert a math equation as a bitmap image on the canvas
 * @param payload - Image data and positioning info from UI
 */
export async function insertMath(payload: InsertMathPayload): Promise<void> {
  const { imageData, width, height, position } = payload;

  try {
    console.log(`Inserting math image: ${width}x${height}px`);
    console.log(`ArrayBuffer size: ${imageData.byteLength} bytes`);

    // Convert ArrayBuffer to Blob
    const blob = new Blob([imageData], { type: "image/png" });
    console.log(`Blob created: ${blob.size} bytes, type: ${blob.type}`);

    // Load bitmap image from the PNG blob (this is allowed outside queueAsyncEdit)
    const bitmapImage = await editor.loadBitmapImage(blob);
    console.log(`BitmapImage loaded: ${bitmapImage.width}x${bitmapImage.height}`);

    // ALL document mutations must be wrapped in queueAsyncEdit
    await editor.queueAsyncEdit(async () => {
      // Create image container from the bitmap
      const mediaContainer = editor.createImageContainer(bitmapImage);

      // Add to the artboard
      editor.context.insertionParent.children.append(mediaContainer);

      // Position at top-left of artboard (0,0) or use provided position
      const targetX = position?.x ?? 0;
      const targetY = position?.y ?? 0;

      mediaContainer.setPositionInParent(
        { x: targetX, y: targetY },
        { x: 0, y: 0 } // Top-left registration point
      );

      console.log(`Positioned at (${targetX}, ${targetY})`);
    });

    console.log("Math equation inserted successfully");
  } catch (error) {
    console.error("Failed to insert math:", error);
    throw new Error(`Failed to insert math equation: ${error instanceof Error ? error.message : String(error)}`);
  }
}
