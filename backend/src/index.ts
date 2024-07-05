import express from "express";
import sqlite3 from "sqlite3";
import ip from "ip";
import mediaRoutes from "./routes/media";
import { router as dbRoutes, type ResponseType } from "./routes/db";
import venom, { Message, Whatsapp } from "venom-bot";
import ffmpeg from "fluent-ffmpeg";
import path from "path";
import fs from "fs";
import ShortUniqueId from "short-unique-id";
import axios from "axios";
import cors from "cors";
import sharp from "sharp";

const port = 3100;
const db = new sqlite3.Database("./src/data.sqlite");
const app = express();
let qr: string | boolean = false;
let wspClient: Whatsapp;
// ! -> EXPRESS CONFIG
app.use(cors());
app.use(express.json());
app.listen(port, () => {
  console.clear();
  console.log(`Server running on http://${ip.address()}:${port}`);
  prepareDb();
});

// * Running check
app.get("/", (req, res) => {
  res.statusCode = 200;
  res.send("ok!");
});
// ? API Routes
app.use("/api", mediaRoutes);
app.use("/api/db", dbRoutes);
app.use("/ppic", express.static("./src/profile_pics"));
app.get("/api/qr", (req, res) => {
  res.statusCode = 200;
  res.send(qr);
});

// * DB FUNCTIONS
const prepareDb = (): void => {
  db.serialize(() => {
    db.run(
      "CREATE TABLE IF NOT EXISTS chats (name TEXT NOT NULL, id TEXT PRIMARY KEY, enabled INTEGER NOT NULL DEFAULT 1, notes TEXT)"
    );
    db.run(
      "CREATE TABLE IF NOT EXISTS responses (contains TEXT NOT NULL, id INTEGER PRIMARY KEY AUTOINCREMENT, answer TEXT NOT NULL, type TEXT NOT NULL)"
    );
    db.run(
      "CREATE TABLE IF NOT EXISTS media (filename TEXT NOT NULL, filetype TEXT NOT NULL, originalname TEXT NOT NULL, id INTEGER PRIMARY KEY AUTOINCREMENT)"
    );
  });
};

// * VENOM UTILS
async function checkActive(chatId: string) {
  try {
    const chat = await new Promise((resolve, reject) => {
      db.get(
        "SELECT enabled FROM chats WHERE id = ?",
        [chatId],
        (err, row: { enabled: boolean }) => {
          if (err) {
            reject(err);
          } else {
            resolve(row ? row.enabled : false);
          }
        }
      );
    });
    return chat;
  } catch (error) {
    console.error(error);
    return false;
  }
}
async function saveChat(name: string, id: any) {
  try {
    const stmt = db.prepare(
      "INSERT OR IGNORE INTO chats (name, id, enabled) VALUES (?, ?, ?)"
    );
    await stmt.run(name, id, 1);
    stmt.finalize();
  } catch (error) {
    console.error(error);
  }
}
async function checkResponse(
  text: string
): Promise<{ type: string; answer: string; contains: boolean } | false> {
  try {
    const normalizeText = (str: string) => {
      return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
    };

    const rows = await new Promise<ResponseType[]>((resolve, reject) => {
      db.all(
        "SELECT * FROM responses",
        (err: Error | null, rows: ResponseType[]) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        }
      );
    });

    const receivedMessage = normalizeText(text);
    let matchWords: string[] = [];

    rows.forEach((item) => {
      const receivedPartial = normalizeText(item.contains);
      const partialWords = receivedPartial.split(" ");

      partialWords.forEach((word) => {
        const wordRegex = new RegExp(`\\b${word}\\b`, "i");
        if (wordRegex.test(receivedMessage) && !matchWords.includes(word)) {
          matchWords.push(word);
        }
      });
    });

    if (matchWords.length > 0) {
      const matchedResponse = rows.find((item) => {
        const normalizedContains = normalizeText(item.contains);
        return normalizedContains.includes(matchWords[0]);
      });

      if (matchedResponse) {
        return {
          type: matchedResponse.type,
          answer: matchedResponse.answer,
          contains: true,
        };
      }
    }

    return false;
  } catch (err) {
    console.error("Error fetching responses:", err);
    return false;
  }
}
async function getFile(
  id: string
): Promise<{ file: string; originalname: string }> {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT * FROM media WHERE id = ?`,
      [id],
      (
        err,
        row: {
          filename: string;
          filetype: string;
          id: string;
          originalname: string;
        } | null
      ) => {
        if (err) {
          console.error("Database error:", err);
          reject("Database error occurred");
        } else if (!row) {
          console.warn("Media not found with id:", id);
          reject("Media not found");
        } else {
          resolve({
            file: path.join(__dirname, `/media/${row.filename}`),
            originalname: row.originalname,
          });
        }
      }
    );
  });
}
async function downloadPpic(url: string, chatId: string) {
  try {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    const imageBuffer = Buffer.from(response.data);

    await sharp(imageBuffer)
      .resize(512, 512)
      .webp({ quality: 50 })
      .toFile(`./src/profile_pics/${chatId}.webp`);

    return chatId;
  } catch (error) {
    console.error(error);
    return "default";
  }
}
async function handleMessage(msg: Message) {
  const text = msg.body;
  const name = msg.sender.pushname ?? msg.from;
  await downloadPpic(
    msg.sender.profilePicThumbObj.imgFull,
    msg.from.split("@")[0]
  );
  saveChat(name, msg.from);
  if (!msg.fromMe) {
    if (msg.type === "chat") {
      try {
        const response = await checkResponse(text);
        if (response) {
          let file, originalname;
          switch (response.type) {
            case "image":
              {
                const { file: imgFile, originalname: imgOriginalname } =
                  await getFile(response.answer);
                file = imgFile;
                originalname = imgOriginalname;
                await wspClient.sendImage(msg.from, file, "", "");
              }
              break;
            case "text":
              await wspClient.sendText(msg.from, response.answer);
              break;
            case "doc":
              {
                const { file: docFile, originalname: docOriginalname } =
                  await getFile(response.answer);
                file = docFile;
                originalname = docOriginalname;
                await wspClient.sendFile(msg.from, file, originalname, "");
              }
              break;
            case "audio":
              {
                const { file: audioFile } = await getFile(response.answer);
                file = audioFile;
                await wspClient.sendVoice(msg.from, file);
              }
              break;
            case "sticker":
              {
                const { file: stickerFile } = await getFile(response.answer);
                file = stickerFile;
                await wspClient.sendImageAsSticker(msg.from, file);
              }
              break;
            default:
              await wspClient.sendText(msg.from, "Por favor, dame un momento.");
              break;
          }
        }
      } catch (err) {
        console.error("Error checking response:", err);
      }
    } else {
      try {
        const mediaBuffer = await wspClient.decryptFile(msg);
        const id = new ShortUniqueId({ length: 5 });

        const tmpFilePath = path.join(
          __dirname,
          "tmp",
          `${Date.now()}_${id.rnd()}.${msg.mimetype.split("/")[1]}`
        );
        fs.writeFileSync(tmpFilePath, mediaBuffer);

        const mp3FilePath = path.join(
          __dirname,
          "tmp",
          `${Date.now()}_${id.rnd()}.mp3`
        );
        await new Promise<void>((resolve, reject) => {
          ffmpeg(tmpFilePath)
            .format("mp3")
            .audioCodec("libmp3lame")
            .audioBitrate(128)
            .on("end", () => {
              fs.unlinkSync(tmpFilePath);
              resolve();
            })
            .on("error", (err) => reject(err))
            .save(mp3FilePath);
        });

        const mp3Buffer = fs.readFileSync(mp3FilePath);
        const contentType = "audio/mpeg";

        const axiosConfig = {
          headers: {
            Authorization: `Bearer ${process.env.WIT_TOKEN}`,
            "Content-Type": contentType,
          },
          params: {
            n: 1,
          },
        };

        const response = await axios.post(
          "https://api.wit.ai/speech",
          mp3Buffer,
          axiosConfig
        );

        if (!response.data) {
          throw new Error("Failed to transcribe media");
        }

        const witResponses = response.data
          .split("\r\n")
          .filter(Boolean)
          .map(JSON.parse);
        const lastWitResponse = witResponses[witResponses.length - 1];
        const transcription = lastWitResponse.text || "sdfkfljhsflaksjdhfl";

        try {
          const response = await checkResponse(transcription);
          if (response) {
            let file, originalname;
            await wspClient.markMarkSeenMessage(msg.from);
            switch (response.type) {
              case "image":
                {
                  const { file: imgFile, originalname: imgOriginalname } =
                    await getFile(response.answer);
                  file = imgFile;
                  originalname = imgOriginalname;
                  await wspClient.sendImage(msg.from, file, "", "");
                }
                break;
              case "text":
                await wspClient.sendText(msg.from, response.answer);
                break;
              case "doc":
                {
                  const { file: docFile, originalname: docOriginalname } =
                    await getFile(response.answer);
                  file = docFile;
                  originalname = docOriginalname;
                  await wspClient.sendFile(msg.from, file, originalname, "");
                }
                break;
              case "audio":
                {
                  const { file: audioFile } = await getFile(response.answer);
                  file = audioFile;
                  await wspClient.sendVoice(msg.from, file);
                }
                break;
              case "sticker":
                {
                  const { file: stickerFile } = await getFile(response.answer);
                  file = stickerFile;
                  await wspClient.sendImageAsSticker(msg.from, file);
                }
                break;
              default:
                await wspClient.sendText(
                  msg.from,
                  "Por favor, dame un momento."
                );
                break;
            }
          }
        } catch (err) {
          console.error("Error checking response:", err);
        }
        fs.unlinkSync(mp3FilePath);
      } catch (err) {
        console.error("Error transcribing media:", err);
      }
    }
  }
}

// * VENOM
venom
  .create({ session: "venom-bot", catchQR: (qrCode) => (qr = qrCode) })
  .then((client: Whatsapp) => start(client))
  .catch((erro) => console.log(erro));
async function start(client: Whatsapp) {
  wspClient = client;
  client.onMessage((message: Message) => {
    handleMessage(message);
  });
  const unRead = await client.getUnreadMessages();
  for (const msg of unRead) {
    handleMessage(msg);
  }
}

// ! -> PROCESS EXIT
process.on("exit", () => {
  db.close();
  wspClient.close();
});

process.on("SIGINT", () => {
  db.close();
  wspClient.close();
});
