import { InsertMathPayload } from "../sandbox/commands/insertMath";

// This interface declares all the APIs that the document sandbox runtime ( i.e. code.ts ) exposes to the UI/iframe runtime
export interface DocumentSandboxApi {
    createRectangle(): void;
    insertMath(payload: InsertMathPayload): Promise<void>;
}
