import addOnSandboxSdk from "add-on-sdk-document-sandbox";
import { editor } from "express-document-sdk";

// Helper to check if we can edit
function canEdit() {
  // In a real implementation check editor.context
  return true;
}

const { runtime } = addOnSandboxSdk.instance;

function start() {
  runtime.exposeApi({
    createRectangle: async () => {
      console.log("createRectangle called");
      // Placeholder implementation
      const doc = editor.documentRoot;
      const page = doc.pages.first;
      const rect = editor.createRectangle();
      rect.width = 100;
      rect.height = 100;
      rect.fill = editor.makeColorFill({ red: 1, green: 0, blue: 0, alpha: 1 });
      page.artboards.first.children.append(rect);
    },
    insertMath: async (data: {
      imageData: ArrayBuffer;
      width: number;
      height: number;
      position?: { x: number; y: number };
    }) => {
      console.log("insertMath called", data.width, data.height);
      try {
        const blob = new Blob([data.imageData], { type: "image/png" });
        const bitmap = await editor.loadBitmapImage(blob);

        // ALL document mutations must be wrapped in queueAsyncEdit
        await editor.queueAsyncEdit(async () => {
          // Use current insertion parent (current page/artboard context)
          const insertionParent = editor.context.insertionParent;

          const imageContainer = editor.createImageContainer(bitmap, {
            initialSize: { width: data.width, height: data.height }
          });

          // Add to current artboard first
          insertionParent.children.append(imageContainer);

          // Position the image
          if (data.position) {
            imageContainer.translation = { x: data.position.x, y: data.position.y };
          }
          // If no position specified, leave at default (0, 0) on current artboard
        });
      } catch (e) {
        console.error("Failed to insert math", e);
        throw e;
      }
    },
    insertImage: async (data: { imageData: ArrayBuffer; title?: string }) => {
      console.log("insertImage called", data.title);
      try {
        const blob = new Blob([data.imageData], { type: "image/png" });
        const bitmap = await editor.loadBitmapImage(blob);

        // ALL document mutations must be wrapped in queueAsyncEdit
        await editor.queueAsyncEdit(async () => {
          // Use current insertion parent (current page/artboard context)
          const insertionParent = editor.context.insertionParent;

          const imageContainer = editor.createImageContainer(bitmap);

          // Add to current artboard
          insertionParent.children.append(imageContainer);

          // Position at (0, 0) on current artboard by default
          // User can move it after insertion
        });

        console.log("insertImage succeeded!");
      } catch (e) {
        console.error("Failed to insert image", e);
        throw e;
      }
    },
    getSelectedText: async () => {
      console.log("getSelectedText called");
      try {
        // @ts-ignore - selection might not be fully typed in the SDK version we have
        const selection = editor.context.selection;
        if (selection && selection.length > 0) {
          // Try to get text from the first selected item if it's a text node
          const node = selection[0];
          if (node.type === "Text") {
            return (node as any).text;
          }
        }
        return null;
      } catch (e) {
        console.error("Failed to get selected text", e);
        return null;
      }
    }
  });
}

start();
