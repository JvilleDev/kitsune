import express, { Request, Response } from "express";
import sqlite3 from "sqlite3";
import path from "path";
import multer from "multer";
import ShortUniqueId from "short-unique-id";
import fs from 'fs';
import mime from 'mime';

const db = new sqlite3.Database("./src/data.sqlite");
const router = express.Router();

// ! -> Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./src/media");
  },
  filename: (req, file, cb) => {
    const id = new ShortUniqueId({ length: 10 });
    const extension =
      path.extname(file.originalname) || "." + file.mimetype.split("/")[1];
    cb(
      null,
      file.originalname.substring(0, 20) + "-" + id.randomUUID() + extension
    );
  },
});

const upload = multer({ storage });

// * -> Fetch All Media
router.get("/media", async (req: Request, res: Response) => {
  const sql = `
    SELECT m.*, 
      CASE WHEN EXISTS (SELECT 1 FROM responses r WHERE r.answer = m.id) 
           THEN 1 ELSE 0 END AS isInResponse
    FROM media m
  `;
  
  db.all(sql, (err, rows) => {
    if (err) {
      console.error(err);
      res.status(500).send("Internal Server Error");
    } else {
      res.send(rows);
    }
  });
});

// * -> Fetch File
router.get("/media/:id", async (req: Request, res: Response) => {
  const id = req.params.id;
  const download = req.query?.download;
  db.get(`SELECT * FROM media WHERE id = ?`, [id], (err, row: {filename: string, filetype: string, id: number, originalname: string}) => {
    if (err) {
      console.error(err);
      res.status(500).send("Internal Server Error");
    } else if (!row) {
      res.status(404).send({error: "Media not found"});
    } else {
        res.setHeader("Content-Disposition", `${download ? "attachment" : "inline"}; filename=${row.originalname}`);
        res.sendFile(path.join(__dirname, `../media/${row.filename}`));
    }
  });
});
// ? -> Upload new file
router.post(
  "/media",
  upload.single("file"),
  async (req: Request, res: Response) => {
    const file = req.file;

    if (!file) {
      return res.status(400).send("No file uploaded.");
    }

    const filename = file.filename;
    const originalName = file.originalname
    const filetype = file.mimetype;

    db.run(
      "INSERT INTO media (filename, filetype, originalname) VALUES (?, ?,?)",
      [filename, filetype, originalName],
      function (err) {
        if (err) {
          console.error(err);
          res.status(500).send("Internal Server Error: " + err);
        } else {
          res.send({ id: this.lastID, filename, filetype, originalName });
        }
      }
    );
  }
);


// ! DELETE -> Delete File and associated responses
router.delete("/media/:id", async (req: Request, res: Response) => {
  const id = req.params.id;

  db.get(`SELECT * FROM media WHERE id = ?`, [id], (err, row: { filename: string, originalname: string }) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Internal Server Error");
    }
    if (!row) {
      return res.status(404).send({ error: "Media not found" });
    }

    const { filename } = row;
    const filePath = path.join(__dirname, `../media/${filename}`);

    fs.unlink(filePath, async (err) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Error deleting file");
      }
      db.run(`DELETE FROM media WHERE id = ?`, [id], async (err) => {
        if (err) {
          console.error(err);
          return res.status(500).send("Internal Server Error");
        }
        try {
          await deleteAssociatedResponses(id);
          res.status(200).send({ message: "Media and associated responses deleted successfully" });
        } catch (err) {
          console.error(err);
          res.status(500).send("Error deleting associated responses");
        }
      });
    });
  });
});
async function deleteAssociatedResponses(mediaId: string) {
  return new Promise<void>((resolve, reject) => {
    db.run(`DELETE FROM responses WHERE answer = ?`, [mediaId], (err) => {
      if (err) {
        console.error(err);
        reject(err);
      } else {
        resolve();
      }
    });
  });
}
// * -> File Info
router.get("/info/media/:id", async (req, res) => {
  const id = req.params.id;

  db.get("SELECT id, filename, originalname FROM media WHERE id = ?", [id], (err, row: {filename: string, originalname: string}) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Internal Server Error");
    }
    if (!row) {
      return res.status(404).send({ error: "Media not found" });
    }

    const { filename, originalname } = row;
    const filePath = path.join(__dirname, `../media/${filename}`);

    fs.stat(filePath, (err, stats) => {
      if (err) {
        if (err.code === 'ENOENT') {
          return res.status(404).send({ error: "Media file not found" });
        } else {
          console.error(err);
          return res.status(500).send("Internal Server Error");
        }
      }

      const fileType = mime.getType(filePath);

      db.all("SELECT id FROM responses WHERE answer = ?", [id], (err: Error, rows: { id: number }[]) => {
        if (err) {
          console.error(err);
          return res.status(500).send("Internal Server Error");
        }

        const responseIds = rows.map(row => row.id);

        const fileInfo = {
          id: id,
          filename: filename,
          originalname: originalname,
          filetype: fileType,
          size: stats.size,
          createdAt: stats.birthtime,
          isInResponse: responseIds.length > 0,
          responseIds: responseIds
        };

        res.json(fileInfo);
      });
    });
  });
});


// ? -> Update existing file
router.put(
  "/media/:id",
  upload.single("file"),
  async (req, res) => {
    const fileId = req.params.id;
    const newFile = req.file;

    if (!newFile) {
      console.log("No se subió ningún archivo.");
      return res.status(400).send("No file uploaded.");
    }

    db.get("SELECT * FROM media WHERE id = ?", [fileId], (err, existingFile) => {
      if (err) {
        console.error("Error al buscar el archivo existente en la base de datos:", err);
        return res.status(500).send("Internal Server Error: " + err);
      }

      if (!existingFile) {
        console.log("Archivo existente no encontrado para el ID:", fileId);
        return res.status(404).send("File not found.");
      }

      const filePath = path.join(__dirname, `../media/${existingFile.filename}`);
      fs.unlinkSync(filePath);
      const filename = newFile.filename;
      const originalName = newFile.originalname;
      const filetype = newFile.mimetype;

      db.run(
        `UPDATE media SET filename = ?, filetype = ?, originalname = ? WHERE id = ?`,
        [filename, filetype, originalName, fileId],
        function (err) {
          if (err) {
            console.error("Error al actualizar la base de datos:", err);
            return res.status(500).send("Internal Server Error: " + err);
          }
          res.send({ id: fileId, filename, filetype, originalName });
        }
      );
    });
  }
);
export default router;