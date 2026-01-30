import { Pool } from "pg";


// creation de la connection a la base de données
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT),
}

const db = new Pool(dbConfig); // creation de la connection a la base de données




export default db;
