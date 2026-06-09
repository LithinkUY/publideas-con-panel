import postgres from "postgres";

// Evita que falle el build en Vercel si la variable no está en el entorno de Build
const dummySql = async () => { throw new Error("DATABASE_URL is not set at runtime"); };
dummySql.transaction = async () => { throw new Error("DATABASE_URL is not set at runtime"); };

export const sql = process.env.DATABASE_URL 
    ? postgres(process.env.DATABASE_URL) 
    : (dummySql as any);
