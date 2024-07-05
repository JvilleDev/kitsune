import express, { Request, Response } from "express";
import sqlite3 from "sqlite3";
const db = new sqlite3.Database("./src/data.sqlite");
const router = express.Router();

// * -> Fetch All Responses
router.get("/responses", (req: Request, res: Response) => {
  db.all("SELECT * FROM responses", (err, rows) => {
    if (err) {
      console.error(err);
      res.status(500).send("Internal Server Error");
    } else {
      res.send(rows);
    }
  });
});
// * -> Add Response
type ResponseType = {
  contains: string;
  type: 'image' | 'text' | 'doc',
  answer: string
}
router.post("/responses", (req: Request, res: Response) => {
  const body: ResponseType = req.body;
  db.run(
    "INSERT INTO responses (contains,type,answer) VALUES (?,?,?)",
    [body.contains, body.type, body.answer],
    function (err) {
      if (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
      } else {
        res.send({ id: this.lastID, ...body });
      }
    }
  );
})
// ? -> Update Response
router.put("/responses/:id", (req: Request, res: Response) => {
  const id = req.params.id;
  const body: ResponseType = req.body;
  db.run(
    "UPDATE responses SET contains = ?, type = ?, answer = ? WHERE id = ?",
    [body.contains, body.type, body.answer, id],
    function (err) {
      if (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
      } else {
        res.send({ id, ...body });
      }
    }
  );
})
// ! -> Ruta DELETE para eliminar una respuesta
router.delete("/responses/:id", (req: Request, res: Response) => {
  const id = req.params.id;
  
  db.run(
    "DELETE FROM responses WHERE id = ?",
    id,
    function (err) {
      if (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
      } else if (this.changes === 0) {
        res.status(404).send("Response not found");
      } else {
        res.status(204).send();
      }
    }
  );
});

// * -> Fetch All Chats
router.get("/chats", (req: Request, res: Response) => {
  db.all("SELECT * FROM chats", (err, rows) => {
    if (err) {
      console.error(err);
      res.status(500).send("Internal Server Error");
    } else {
      res.send(rows);
    }
  });
});

// ? -> Fetch Chat
router.get("/chats/:id", (req: Request, res: Response) => {
  const id = req.params.id;
  db.get(`SELECT * FROM chats WHERE id = ?`, [id], (err, row) => {
    if (err) {
      console.error(err);
      res.status(500).send("Internal Server Error");
    } else if (!row) {
      res.status(404).send({ error: "Chat not found" });
    } else {
      res.send(row);
    }
  });
});
export {router, type ResponseType};