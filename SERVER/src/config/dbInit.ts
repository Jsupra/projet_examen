import fs from "fs/promises"
import path from "path"
import db from "./database"


const schemaPath = path.join(__dirname, "../database/schema.sql")
const setup = async () => {
    const schema = await fs.readFile(schemaPath, "utf-8")
    await db.query(schema)
}


export default setup