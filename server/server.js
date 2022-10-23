// server engine
const express = require("express");
const HTTPS = require("https");
require("dotenv").config({ path: `${__dirname}/../.env` });
const port = process.env.PORT || 3000;
const rootPath = process.env.ROOT_PATH;

// file system
const fs = require("fs");
const path = require("path");
const static = require("serve-static");

// image process
const fileUpload = require("express-fileupload");

// cors
const cors = require("cors");

// lib
const runQuery = require(`${rootPath}/lib/dbquery`);

// cookie
const cookieParser = require("cookie-parser");

// jwt
const { generateToken, verifyToken } = require(`${rootPath}/lib/jwt.js`);

// server start
const app = express();

// midleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: "100mb" }));
app.use(static(__dirname + "/../"));
app.use(cookieParser());
app.use(cors());
app.set("trust proxy", 1);

// router
const authRouter = require("./router/v1/auth");
const diariesRouter = require("./router/v1/diaries");
const booksRouter = require("./router/v1/books");
const imageRouter = require("./router/v1/image");
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/diaries", diariesRouter);
app.use("/api/v1/books", booksRouter);
app.use("/api/v1/image", imageRouter);

const authorization = require(`${rootPath}/lib/authorization`);

app.get("/", authorization, async (req, res) => {
  res.send("hello world");
});

app.listen(port, () => {
  console.log(`[HTTP] Soda Server is started on port ${port}`);
});
