import * as fs from 'fs';
import * as path from 'path';
import csv from 'csv-parser';
import Database from 'better-sqlite3';

interface FoodRow {
  [key: string]: string | number;
}

async function convertCSVToSQLite() {
  const csvPath = path.join(__dirname, '../../ifct2017_compositions.csv');
  const dbPath = path.join(__dirname, '../data/ifct2017.db');

  // Ensure data directory exists
  const dataDir = path.dirname(dbPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Remove existing database if it exists
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }

  const db = new Database(dbPath);

  let headers: string[] = [];
  let isFirstRow = true;
  let insertStmt: any = null;
  let rowCount = 0;

  // Read CSV and collect data
  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('headers', (headerList: string[]) => {
        headers = headerList;
      })
      .on('data', (data: any) => {
        if (isFirstRow) {
          // Create table
          const columnDefs = headers.map((header, index) => {
            if (index < 4) {
              // First 4 columns: code, name, scie, regn
              if (header === 'regn') {
                return `"${header}" INTEGER`;
              } else {
                return `"${header}" TEXT`;
              }
            } else {
              // All other columns are REAL
              return `"${header}" REAL`;
            }
          });

          const createTableSQL = `CREATE TABLE ifct (${columnDefs.join(', ')})`;
          db.exec(createTableSQL);

          // Prepare insert statement
          const placeholders = headers.map(() => '?').join(', ');
          const quotedHeaders = headers.map(h => `"${h}"`).join(', ');
          const insertSQL = `INSERT INTO ifct (${quotedHeaders}) VALUES (${placeholders})`;
          insertStmt = db.prepare(insertSQL);

          isFirstRow = false;
        }

        // Convert string values to numbers where appropriate
        const processedData: FoodRow = {};
        headers.forEach((header, index) => {
          const value = data[header];
          if (index < 4) {
            // Keep as string for first 4 columns
            processedData[header] = value;
          } else {
            // Convert to number for nutrient columns
            const numValue = parseFloat(value);
            processedData[header] = isNaN(numValue) ? 0 : numValue;
          }
        });

        // Insert row
        insertStmt.run(...headers.map(h => processedData[h]));
        rowCount++;
      })
      .on('end', () => {
        resolve();
      })
      .on('error', reject);
  });

  // Create indexes for performance
  console.log('Creating indexes...');
  db.exec('CREATE INDEX idx_name ON ifct("name")');
  db.exec('CREATE INDEX idx_protcnt ON ifct("protcnt")');
  db.exec('CREATE INDEX idx_enerc ON ifct("enerc")');
  db.exec('CREATE INDEX idx_fatce ON ifct("fatce")');

  db.close();
  console.log(`Database created successfully at ${dbPath}`);
  console.log(`Processed ${rowCount} rows`);
}

// Run the conversion
convertCSVToSQLite().catch(console.error);