/**
 * Data Parser Service
 * 
 * Handles parsing of various data file formats (CSV, XLSX) into a unified DataConfig structure.
 * Provides type inference, validation, and preview capabilities.
 */

import * as XLSX from 'xlsx';

// Re-export DataConfig from plotService for consistency
export interface DataConfig {
    columns: string[];
    rows: (string | number)[][];
}

export interface ColumnInfo {
    name: string;
    type: 'string' | 'number' | 'mixed';
    sampleValues: (string | number)[];
}

export interface ParseResult {
    data: DataConfig;
    columnInfo: ColumnInfo[];
    rowCount: number;
    parseWarnings: string[];
}

export interface FileInfo {
    name: string;
    size: number;
    type: string;
}

/**
 * Parse a File object (CSV or XLSX) into ParseResult
 */
export async function parseFile(file: File): Promise<ParseResult> {
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (extension === 'csv' || extension === 'txt') {
        const text = await file.text();
        return parseCSVText(text);
    } else if (extension === 'xlsx' || extension === 'xls') {
        return parseXLSXFile(file);
    } else {
        throw new Error(`Unsupported file format: .${extension}. Please use CSV or XLSX.`);
    }
}

/**
 * Parse CSV text into ParseResult
 */
export function parseCSVText(csvText: string): ParseResult {
    const warnings: string[] = [];
    const lines = csvText.trim().split(/\r?\n/);

    if (lines.length < 2) {
        throw new Error('CSV must have a header row and at least one data row.');
    }

    // Parse header
    const columns = splitCSVLine(lines[0]);
    if (columns.length === 0) {
        throw new Error('No columns found in CSV header.');
    }

    // Check for duplicate column names
    const uniqueColumns = new Set(columns);
    if (uniqueColumns.size !== columns.length) {
        warnings.push('Duplicate column names detected. Some columns may be overwritten.');
    }

    // Parse all data rows
    const rawRows: string[][] = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue; // Skip empty lines

        const row = splitCSVLine(line);

        if (row.length !== columns.length) {
            warnings.push(`Row ${i} has ${row.length} columns, expected ${columns.length}. Row will be skipped.`);
            continue;
        }

        rawRows.push(row);
    }

    if (rawRows.length === 0) {
        throw new Error('No valid data rows found in CSV.');
    }

    // Infer column types
    const columnInfo = inferColumnTypes(columns, rawRows);

    // Convert rows to typed values
    const rows = convertRowsToTyped(rawRows, columnInfo);

    return {
        data: { columns, rows },
        columnInfo,
        rowCount: rows.length,
        parseWarnings: warnings,
    };
}

/**
 * Parse XLSX file into ParseResult
 */
export async function parseXLSXFile(file: File): Promise<ParseResult> {
    const warnings: string[] = [];

    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    // Get first sheet
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
        throw new Error('Excel file has no sheets.');
    }

    if (workbook.SheetNames.length > 1) {
        warnings.push(`File has ${workbook.SheetNames.length} sheets. Only reading first sheet: "${sheetName}".`);
    }

    const sheet = workbook.Sheets[sheetName];

    // Convert to array of arrays
    const rawData: (string | number | boolean | null)[][] = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        defval: '',
        raw: true,
    });

    if (rawData.length < 2) {
        throw new Error('Excel sheet must have a header row and at least one data row.');
    }

    // Extract header
    const columns = (rawData[0] as (string | number)[]).map((c) =>
        c === null || c === undefined ? '' : String(c).trim()
    );

    if (columns.length === 0 || columns.every((c) => c === '')) {
        throw new Error('No valid column headers found in Excel file.');
    }

    // Parse data rows (skip header)
    const rawRows: string[][] = [];
    for (let i = 1; i < rawData.length; i++) {
        const row = rawData[i];
        if (!row || row.length === 0) continue;

        // Pad or truncate row to match column count
        const paddedRow: string[] = [];
        for (let j = 0; j < columns.length; j++) {
            const val = row[j];
            paddedRow.push(val === null || val === undefined ? '' : String(val));
        }

        // Skip completely empty rows
        if (paddedRow.every((v) => v === '')) continue;

        rawRows.push(paddedRow);
    }

    if (rawRows.length === 0) {
        throw new Error('No valid data rows found in Excel file.');
    }

    // Infer column types
    const columnInfo = inferColumnTypes(columns, rawRows);

    // Convert rows to typed values
    const rows = convertRowsToTyped(rawRows, columnInfo);

    return {
        data: { columns, rows },
        columnInfo,
        rowCount: rows.length,
        parseWarnings: warnings,
    };
}

/**
 * Split a CSV line respecting quoted fields
 */
function splitCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            // Handle escaped quotes ("") inside quoted field
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++; // Skip next quote
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }

    result.push(current.trim());

    // Remove surrounding quotes from values
    return result.map((val) => val.replace(/^"|"$/g, ''));
}

/**
 * Infer column types based on data values
 */
function inferColumnTypes(columns: string[], rows: string[][]): ColumnInfo[] {
    const checkLimit = Math.min(rows.length, 20); // Check first 20 rows

    return columns.map((name, colIndex) => {
        let numericCount = 0;
        let stringCount = 0;
        const sampleValues: (string | number)[] = [];

        for (let i = 0; i < checkLimit; i++) {
            const val = rows[i][colIndex];
            if (sampleValues.length < 3 && val !== '') {
                sampleValues.push(val);
            }

            if (val === '') continue;

            const num = Number(val);
            if (!isNaN(num)) {
                numericCount++;
            } else {
                stringCount++;
            }
        }

        let type: 'string' | 'number' | 'mixed' = 'string';
        if (numericCount > 0 && stringCount === 0) {
            type = 'number';
        } else if (numericCount > 0 && stringCount > 0) {
            type = 'mixed';
        }

        return { name, type, sampleValues };
    });
}

/**
 * Convert string rows to typed values based on column info
 */
function convertRowsToTyped(
    rawRows: string[][],
    columnInfo: ColumnInfo[]
): (string | number)[][] {
    return rawRows.map((row) =>
        row.map((val, colIndex) => {
            if (columnInfo[colIndex].type === 'number' && val !== '') {
                const num = Number(val);
                return isNaN(num) ? val : num;
            }
            return val;
        })
    );
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Get preview rows (first N rows)
 */
export function getPreviewRows(data: DataConfig, count: number = 5): (string | number)[][] {
    return data.rows.slice(0, count);
}
