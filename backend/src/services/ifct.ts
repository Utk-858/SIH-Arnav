import Database from 'better-sqlite3';
import * as path from 'path';

export interface Food {
  code: string;
  name: string;
  scie: string;
  regn: number;
  [key: string]: string | number; // For all nutrient columns
}

class IFCTService {
  private db: Database.Database;

  constructor() {
    // Use absolute path for Docker compatibility
    const dbPath = process.env.NODE_ENV === 'production'
      ? '/app/data/ifct2017.db'
      : path.join(__dirname, '../../data/ifct2017.db');
    this.db = new Database(dbPath, { readonly: true });
  }

  /**
   * Find foods whose names match the input (case-insensitive, partial match)
   */
  findFood(name: string): Food[] {
    const query = `SELECT * FROM ifct WHERE LOWER("name") LIKE LOWER(?)`;
    const stmt = this.db.prepare(query);
    const results = stmt.all(`%${name}%`) as Food[];
    return results;
  }

  /**
   * Find foods by nutrient range
   */
   findByNutrient(nutrient: string, min: number, max: number): Food[] {
     const query = `SELECT * FROM ifct WHERE "${nutrient}" BETWEEN ? AND ?`;
     const stmt = this.db.prepare(query);
     const results = stmt.all(min, max) as Food[];
     return results;
   }

   /**
    * Find food by code
    */
   findByCode(code: string): Food | null {
     const query = `SELECT * FROM ifct WHERE "\ufeffcode" = ? LIMIT 1`;
     const stmt = this.db.prepare(query);
     const result = stmt.get(code) as Food | undefined;
     return result || null;
   }

  /**
   * Close the database connection
   */
  close() {
    this.db.close();
  }
}

// Export a singleton instance
const ifctService = new IFCTService();

export default ifctService;