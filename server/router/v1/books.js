// server engine
const express = require('express')
const router = express.Router();
const rootPath = process.env.ROOT_PATH

// lib
const runQuery = require(`${rootPath}/lib/dbquery`)

router.get('/', async (req, res) => {
  const {memberid} = req.query
  if(memberid){
    const bookSql = `SELECT id, title, subtitle, image AS bookimage, created_at AS createdAt, modefied_at AS modifiedAt, public, (SELECT COUNT(*) FROM Diary WHERE book_id=B.id) AS totalDiaryCount FROM Book AS B WHERE member_id=${memberid}`
    const memberSql = `SELECT id AS memberid, nickname, (SELECT COUNT(*) FROM Book WHERE member_id=M.id) AS totalBookCount FROM Member AS M WHERE id=${memberid}`
    const getBookData = await runQuery.fetchData(bookSql)
    const getMemberData = await runQuery.fetchData(memberSql)

    res.json([...getMemberData, ...getBookData])
  } else {
    res.status(404).json({msg: "Send member ID together"})
  }
})

router.get('/all', async (req, res) => {
  const {memberid} = req.query
if(memberid){
    const bookSql = `SELECT B.id, B.title, B.subtitle, B.image AS bookimage, B.created_at AS createdAt, B.modefied_at AS modifiedAt, public, (SELECT GROUP_CONCAT(id) FROM Diary WHERE book_id=B.id) AS diaryIds FROM Book AS B LEFT JOIN Diary AS D ON B.id=D.book_id WHERE B.member_id=${memberid} GROUP BY B.id`
    const memberSql = `SELECT id AS memberid, name, nickname, image AS profile, infomation FROM Member AS M WHERE id=${memberid}`
    const getBookData = await runQuery.fetchData(bookSql)
    const getMemberData = await runQuery.fetchData(memberSql)
    
    const resData = getBookData.map(async e => {
      let data = []
      if(e.diaryIds) {
        data = e.diaryIds.split(',').slice(0, 5).map(async (el, i) => {
          const diarySql = `SELECT id, title, image AS diaryimage FROM Diary WHERE id=${el}`
          const getDiaryData = await runQuery.fetchData(diarySql)
          return {...getDiaryData[0]}
        })
      } 
      
      delete e.diaryIds

      return {...e, diaries: await Promise.all(data)}
    });

    res.json([...getMemberData, ...await Promise.all(resData)])
  } else {
    res.status(404).json({msg: "Send member ID together"})
  }
})

// TODO : isFollow 여부 확인
router.get('/:bookid', async (req, res) => {
  const {bookid} = req.params
  const bookSql = `SELECT id, title, subtitle, image AS bookimage, (SELECT COUNT(*) FROM Diary WHERE book_id=B.id) AS totalDiaryCount FROM Book AS B WHERE id=${bookid}`
  const diarySql = `SELECT D.id, title, D.image AS diaryimage, category, (SELECT COUNT(*) FROM Likes WHERE diary_id=D.id) AS totalLike, (SELECT isLike FROM Likes WHERE diary_id=D.id AND member_id=M.id) AS isLike, D.created_at AS createdAt, D.modefied_at AS modifiedAt, M.id AS memberid, M.image AS memberimage, nickname FROM Diary AS D LEFT JOIN Member AS M ON D.member_id = M.id WHERE D.book_id=${bookid}`
  const getBookData = await runQuery.fetchData(bookSql)
  const getDiaryData = await runQuery.fetchData(diarySql)

  if(getBookData.length === 0) res.status(404).json({msg: "Wrong bookid"})
  else res.json([...getBookData, ...getDiaryData])
})

module.exports = router;