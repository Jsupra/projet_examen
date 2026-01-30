import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response } from "express";
import cors from "cors";
import db from "./src/config/database";
import authRoutes from "./src/routes/auth.routes";

// Models




const app = express();
const PORT = process.env.PORT || 3000;

// --- Middlewares ---
app.use(cors());
app.use(express.json());

// --- Routes ---
app.get("/", (req: Request, res: Response) => {
    res.send("API opérationnelle");
});

app.use("/api/auth", authRoutes);

// --- Server startup ---
const start_server = async () => {
    try {
        console.log('Database connection test...');
        const client = await db.connect();
        console.log('Database connection test passed');
        client.release();

        console.log('Tables initialization...');
        // initialisation    
        console.log('Tables initialized successfully');

        app.listen(PORT, () => {
            console.log(`Server running on: http://localhost:${PORT}`);
        });

    } catch (error) {
        console.error("Server startup error :", error);
        console.error(error);
        process.exit(1); // On arrête tout si la DB ne répond pas
    }
};

start_server();