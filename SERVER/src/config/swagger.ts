import swaggerJSDoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API de Gestion de Projets",
      version: "1.0.0",
      description: "Documentation interactive de l'API de gestion de projets (Niveau 3)",
    },
    servers: [
      {
        url: "http://localhost:3000/api",
        description: "Serveur de développement",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  // Chemin vers les fichiers contenant les annotations Swagger
  apis: ["./src/routes/*.ts", "./src/controllers/*.ts"], 
};

export const swaggerSpec = swaggerJSDoc(options);
