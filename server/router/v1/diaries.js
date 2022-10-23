// server engine
const express = require("express");
const router = express.Router();
const rootPath = process.env.ROOT_PATH;

// lib
const runQuery = require(`${rootPath}/lib/dbquery`);
const authorization = require(`${rootPath}/lib/authorization`);

// TODO : isFollow 여부 확인
// TODO : limit offset 설정
router.get("/", async (req, res) => {
  const sql =
    "SELECT D.id AS diaryId, title, subtitle, D.image AS diaryimage, category, (SELECT COUNT(*) FROM Comment WHERE diary_id=D.id) AS totalComment, (SELECT COUNT(*) FROM Likes WHERE diary_id=D.id) AS totalLike, D.created_at AS createdAt, M.id AS memberId, name, nickname, M.image AS profile, book_id AS bookId FROM Diary AS D LEFT JOIN Member AS M ON D.member_id = M.id";
  const resData = await runQuery.fetchData(sql);

  res.json(resData);
});

router.post("/", authorization, async (req, res) => {
  try {
    const {
      title,
      subtitle,
      content,
      image = "/src/default/diaries/city.png",
      category,
      bookId,
    } = req.body;
    const memberId = req.verifyData.id;
    const sql = `INSERT INTO Diary(title, subtitle, content, image, category, member_id, book_id) values('${title}', '${subtitle}', '${content}', '${image}', ${category}, ${memberId}, ${bookId})`;
    const resData = await runQuery.fetchData(sql);

    res.json(resData);
  } catch (e) {
    res.status(400).send();
  }
});

module.exports = router;
