import express from "express";
import dotenv from "dotenv";
import pool from "pg"
import { textDbConnection } from "./config/database";

dotenv.config();


const app =express();

const PORT= 3000;

app.use(express.json());

const startServer = async () => {
    await textDbConnection();

app.listen(PORT,()=> {
    console.log( `server is running on http://locahost:${PORT}`)
})
}

startServer()

