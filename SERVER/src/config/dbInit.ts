import fs from "fs/promises"
import path from "path"
import db from "./database"



const setupDb = async () => {
   try {
    const schemaPath = path.join(__dirname, "../database/schema.sql")
    const schema = await fs.readFile(schemaPath, "utf-8")
    await db.query(schema)
    console.log("Database schema loaded successfully")
       

    const seedPath = path.join(__dirname, "../database/seed.sql")
    const seed = await fs.readFile(seedPath, "utf-8")
    await db.query(seed)
    console.log("Database seed loaded successfully")
   } catch (error) {
    console.error("Error during database setup:", error)
   }
}


export default setupDb