export interface Food {
    code: string;
    name: string;
    scie: string;
    regn: number;
    [key: string]: string | number;
}
declare class IFCTService {
    private db;
    constructor();
    /**
     * Find foods whose names match the input (case-insensitive, partial match)
     */
    findFood(name: string): Food[];
    /**
     * Find foods by nutrient range
     */
    findByNutrient(nutrient: string, min: number, max: number): Food[];
    /**
     * Find food by code
     */
    findByCode(code: string): Food | null;
    /**
     * Close the database connection
     */
    close(): void;
}
declare const ifctService: IFCTService;
export default ifctService;
//# sourceMappingURL=ifct.d.ts.map