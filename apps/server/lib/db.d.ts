import { Pool } from "pg";
export declare const pool: Pool;
export declare function query<T = any>(strings: TemplateStringsArray, ...values: any[]): Promise<{
    rows: T[];
}>;
//# sourceMappingURL=db.d.ts.map