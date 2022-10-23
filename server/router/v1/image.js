// server engine
const express = require("express");
const router = express.Router();
const rootPath = process.env.ROOT_PATH;

// file system
const fs = require("fs");

// lib
const authorization = require(`${rootPath}/lib/authorization`);

// image process
const fileUpload = require("express-fileupload");

const promiseMkdir = (dirname) => {
  return new Promise((resolve, rejects) => {
    fs.mkdir(`${rootPath}/src/${dirname}/`, (msg) => rejects(msg));
    resolve(true);
  });
};

const saveFile = (dirname, file, fileName) => {
  return new Promise((resolve, rejects) => {
    setTimeout(() => {
      file.mv(`${rootPath}/src/${dirname}/${fileName}`, (err) => {
        if (err) rejects(err);
        else {
          resolve(`${rootPath}/src/${dirname}/${fileName}`);
        }
      });
    }, 500);
  });
};

router.post("/", authorization, fileUpload(), async (req, res) => {
  const name = Object.keys(req.files)[0];
  const file = req.files[name];
  const dirname = req.verifyData.id;
  file.name = dirname + Date.now() + ".png";

  let dataUrl = "";

  try {
    await promiseReaddir(dirname);
  } catch (e) {
    await promiseMkdir(dirname);
  }

  dataUrl = await saveFile(dirname, file, file.name);
  res.send(dataUrl.slice(27));
});

module.exports = router;
