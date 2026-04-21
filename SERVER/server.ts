import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response } from "express";
import { createServer } from "http";
import cors from "cors";
import cookieParser from "cookie-parser";
import db from "./src/config/database";
import apiRoutes from "./src/routes/index";
import setupDb from "./src/config/dbInit";
import { initSocket } from "./src/config/socket";

const app = express();
const httpServer = createServer(app); // lier express au serveur HTTP

// Initialisation de Socket.io
initSocket(httpServer);

const PORT = process.env.PORT || 3000;

// --- Middlewares ---
app.use(cors());
app.use(cookieParser());
app.use(express.json());

// --- Routes ---
app.get("/", (req: Request, res: Response) => {
    res.send("API opérationnelle");
});

app.use("/api", apiRoutes);


// --- Server startup ---
const start_server = async () => {
    try {
        console.log('Database connection test...');
        const client = await db.connect();
        console.log('Database connection test passed');
        client.release();

        console.log('Tables initialization...');
        // setupDb(); //decommenter pour initialiser la bd   
        console.log('Tables initialized successfully');

        // app.listen(PORT, () => {
        //     console.log(`Server running on: http://localhost:${PORT}`);
        // });

        httpServer.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });

    } catch (error) {
        console.error("Server startup error :", error);
        console.error(error);
        process.exit(1); // On arrête tout si la DB ne répond pas
    }
};

start_server();