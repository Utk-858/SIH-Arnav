"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path = __importStar(require("path"));
class IFCTService {
    constructor() {
        // Use absolute path for Docker compatibility
        const dbPath = process.env.NODE_ENV === 'production'
            ? '/app/data/ifct2017.db'
            : path.join(__dirname, '../../data/ifct2017.db');
        this.db = new better_sqlite3_1.default(dbPath, { readonly: true });
    }
    /**
     * Find foods whose names match the input (case-insensitive, partial match)
     */
    findFood(name) {
        const query = `SELECT * FROM ifct WHERE LOWER("name") LIKE LOWER(?)`;
        const stmt = this.db.prepare(query);
        const results = stmt.all(`%${name}%`);
        return results;
    }
    /**
     * Find foods by nutrient range
     */
    findByNutrient(nutrient, min, max) {
        const query = `SELECT * FROM ifct WHERE "${nutrient}" BETWEEN ? AND ?`;
        const stmt = this.db.prepare(query);
        const results = stmt.all(min, max);
        return results;
    }
    /**
     * Find food by code
     */
    findByCode(code) {
        const query = `SELECT * FROM ifct WHERE "\ufeffcode" = ? LIMIT 1`;
        const stmt = this.db.prepare(query);
        const result = stmt.get(code);
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
exports.default = ifctService;
//# sourceMappingURL=ifct.js.map