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

        const doc = editor.documentRoot;
        const page = doc.pages.first;
        const artboard = page.artboards.first;

        const imageContainer = editor.createImageContainer(bitmap, {
          initialSize: { width: data.width, height: data.height }
        });

        if (data.position) {
          imageContainer.translation = { x: data.position.x, y: data.position.y };
        } else {
          // Center it
          imageContainer.translation = {
            x: artboard.width / 2 - data.width / 2,
            y: artboard.height / 2 - data.height / 2
          };
        }

        artboard.children.append(imageContainer);
      } catch (e) {
        console.error("Failed to insert math", e);
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
