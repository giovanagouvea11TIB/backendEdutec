import express from "express"
import cors from "cors"
import mysql2 from "mysql2/promise"
import bcrypt from "bcrypt"

const { DB_HOST, DB_DATABASE, DB_USER, DB_PASSWORD } = process.env;

const database = mysql2.createPool({
    host: DB_HOST,
    database: DB_DATABASE,
    user: DB_USER,
    password: DB_PASSWORD,
    connectionLimit: 10
})

const app = express()
const port = 3333

app.use(cors())
app.use(express.json())

app.get("/", async (request, response) => {
    try {
        const selectCommand = "SELECT name, email FROM tecteen_edutec";
        const [users] = await database.query(selectCommand);
        response.json(users);
    } catch (error) {
        console.error(error);
        response.status(500).json({ message: "Erro ao buscar usuários." });
    }
})

app.post("/cadastrar", async (request, response) => {
    const { user } = request.body;
    const { text, name, email, password } = user;

    if (!text || !name || !email || !password) {
        return response.status(400).json({ message: "Todos os campos são obrigatórios." });
    }

    try {
        const saltRounds = 10;
        const senha_hash = await bcrypt.hash(password, saltRounds);

        const insertCommand = `
            INSERT INTO tecteen_edutec (text, name, email, senha)
            VALUES (?, ?, ?, ?)
        `;

        const values = [text, name, email, senha_hash]; 

        await database.query(insertCommand, values);

        response.status(201).json({ message: "Usuário cadastrado com sucesso!" });

    } catch (error) {
        console.error(error);

        if (error.code === 'ER_DUP_ENTRY') {
            return response.status(409).json({ message: "Nickname ou E-mail já cadastrado. Tente outro." });
        }

        response.status(500).json({ message: "Erro interno do servidor ao cadastrar usuário." });
    }
})

app.listen(port, () => {
    console.log(`Server running on port ${port}!`);
})