import bcrypt from "bcrypt";
import { Request, Response } from "express";
import { findUserByEmail_Name, createrUser, findPassword } from "../models/auth.models";
import { register_dto } from "../models/types";
import { error } from "node:console";

function lowerCase (text: string){
   if(!text) return text;
   return text.toLowerCase();
}


export const register = async (req: Request, res: Response) => {
   try {
    const { username, name_display, email, role, password } = req.body;
    const lowerCaseUsername = lowerCase(username);
    const lowerCaseEmail = lowerCase(email);

    const User = await findUserByEmail_Name(lowerCaseEmail, lowerCaseUsername);
    if (User) {
        return res.status(400).json({
            error: 'user already exist'
        })
    }   


    const hashedPassword = await bcrypt.hash(password, 10);

    const userData: register_dto = {
        username: lowerCaseUsername,
        name_display: name_display,
        email: lowerCaseEmail,
        role,
        password: hashedPassword
        };

    const newUser = await createrUser(userData);

    if (newUser === null) return res.status(500).json({ error: 'internal servor error' })
    return res.status(201).json({Message: 'user create successully'})
   } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'internal servor error' })
   }
    
}



export const login = async (req: Request, res: Response) => {

    try {
        const { username, email, password } = req.body;
        const lowerCaseUsername = lowerCase(username);
        const lowerCaseEmail = lowerCase(email);

        const User = await findUserByEmail_Name(lowerCaseEmail, lowerCaseUsername);
        
        if (!User) {
            return res.status(404).json({ error: "invalid credentials"})
        }
        const storedPassword = await findPassword(lowerCaseEmail, lowerCaseUsername)
        const isMatch = await bcrypt.compare(password, storedPassword);

        if (!isMatch) { 
            return res.status(401).json({
                error: "invalid credentials"
            })
        }

        

    } catch (error) {
        console.error(error)
        return res.status(500).json({
            error: "internal servor error"
        })
    }
}