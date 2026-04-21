import { Server as HttpServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";

let io: Server;

export const initSocket = (httpServer: HttpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: ["http://localhost:5173", "http://localhost:3000"],
            methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
            credentials: true,
        },
    });

    // --- MIDDLEWARE DE SÉCURITÉ JWT ---
    io.use((socket, next) => {
        // On récupère le token soit dans auth (frontend propre) soit dans query (Postman/Test)
        const token = socket.handshake.auth.token || socket.handshake.query.token; 

        if (!token) {
            return next(new Error("Authentication error: Token missing"));
        }

        try {
            const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string);
            (socket as any).user = decoded; // On stocke les infos de l'utilisateur dans le socket
            next();
        } catch (err) {
            next(new Error("Authentication error: Invalid token"));
        }
    });

    io.on('connection', (socket) => {
        console.log("Un utilisateur est connecté :", socket.id);

        // Rejoindre un salon de discussion spécifique à un projet
        socket.on('joinProject', (projectId: string) => {
            socket.join(projectId);
            console.log(`L'utilisateur ${socket.id} a rejoint le projet ${projectId}`);
        });

        // Rejoindre un salon personnel pour les notifications (invitations, etc.)
        socket.on('joinUser', (userId: string) => {
            socket.join(userId);
            console.log(`L'utilisateur ${socket.id} a rejoint son salon personnel ${userId}`);
        });

        socket.on('disconnect', () => {
            console.log(`L'utilisateur ${socket.id} s'est déconnecté`);
        });
    });

    return io;
};

export { io };
