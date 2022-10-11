// server engine
const express = require('express')
const router = express.Router();
const rootPath = process.env.ROOT_PATH

// lib
const runQuery = require(`${rootPath}/lib/dbquery`)

// TODO : isFollow 여부 확인
router.get('/', async (req, res) => {
  const sql = "SELECT D.id AS diaryId, title, subtitle, D.image AS diaryimage, category, (SELECT COUNT(*) FROM Comment WHERE diary_id=D.id) AS totalComment, (SELECT COUNT(*) FROM Likes WHERE diary_id=D.id) AS totalLike, D.created_at AS createdAt, M.id AS memberId, name, nickname, M.image AS profile, book_id AS bookId FROM Diary AS D LEFT JOIN Member AS M ON D.member_id = M.id"
  const resData = await runQuery.fetchData(sql)

  res.json(resData)
})

module.exports = router;