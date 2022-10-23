// server engine
const express = require("express");
const router = express.Router();
const rootPath = process.env.ROOT_PATH;

// lib
const runQuery = require(`${rootPath}/lib/dbquery`);
const authorization = require(`${rootPath}/lib/authorization`);

router.post("/", authorization, async (req, res) => {
  try {
    const {
      title,
      subtitle,
      image = "/src/default/books/book.jpg",
      public,
    } = req.body;
    if (req.verifyData.id && title && subtitle && image && public) {
      const sql = `INSERT INTO Book(title, subtitle, image, member_id, public) VALUES("${title}", "${subtitle}", "${image}", ${req.verifyData.id}, ${public});`;
      const postData = await runQuery.fetchData(sql);
      res.json({ msg: "ok", insertId: postData.insertId });
    } else {
      res.status(400).json({ msg: "Please fill in all fields" });
    }
  } catch (e) {
    console.log(e);
    res.status(500).json({ msg: "Internal Server Error" });
  }
});

router.get("/", async (req, res) => {
  const { memberid } = req.query;

  try {
    if (memberid) {
      const bookSql = `SELECT id, title, subtitle, image AS bookimage, created_at AS createdAt, modefied_at AS modifiedAt, public, (SELECT COUNT(*) FROM Diary WHERE book_id=B.id) AS totalDiaryCount FROM Book AS B WHERE member_id=${memberid}`;
      const memberSql = `SELECT id AS memberid, nickname, (SELECT COUNT(*) FROM Book WHERE member_id=M.id) AS totalBookCount FROM Member AS M WHERE id=${memberid}`;
      const getBookData = await runQuery.fetchData(bookSql);
      const getMemberData = await runQuery.fetchData(memberSql);

      res.json([...getMemberData, ...getBookData]);
    } else {
      res.status(404).json({ msg: "Send member ID together" });
    }
  } catch (e) {
    console.log(e);
    res.status(500).json({ msg: "Internal Server Error" });
  }
});

router.get("/all", async (req, res) => {
  const { memberid } = req.query;

  try {
    if (memberid) {
      const bookSql = `SELECT B.id, B.title, B.subtitle, B.image AS bookimage, B.created_at AS createdAt, B.modefied_at AS modifiedAt, public, (SELECT GROUP_CONCAT(id) FROM Diary WHERE book_id=B.id) AS diaryIds FROM Book AS B LEFT JOIN Diary AS D ON B.id=D.book_id WHERE B.member_id=${memberid} GROUP BY B.id`;
      const memberSql = `SELECT id AS memberid, name, nickname, image AS profile, infomation FROM Member AS M WHERE id=${memberid}`;
      const getBookData = await runQuery.fetchData(bookSql);
      const getMemberData = await runQuery.fetchData(memberSql);

      const resData = getBookData.map(async (e) => {
        let data = [];
        if (e.diaryIds) {
          data = e.diaryIds
            .split(",")
            .slice(0, 5)
            .map(async (el, i) => {
              const diarySql = `SELECT id, title, image AS diaryimage FROM Diary WHERE id=${el}`;
              const getDiaryData = await runQuery.fetchData(diarySql);
              return { ...getDiaryData[0] };
            });
        }

        delete e.diaryIds;

        return { ...e, diaries: await Promise.all(data) };
      });

      res.json([...getMemberData, ...(await Promise.all(resData))]);
    } else {
      res.status(404).json({ msg: "Send member ID together" });
    }
  } catch (e) {
    console.log(e);
    res.status(500).json({ msg: "Internal Server Error" });
  }
});

// TODO : isFollow 여부 확인
router.get("/:bookid", async (req, res) => {
  const { bookid } = req.params;

  try {
    const bookSql = `SELECT id, title, subtitle, image AS bookimage, (SELECT COUNT(*) FROM Diary WHERE book_id=B.id) AS totalDiaryCount FROM Book AS B WHERE id=${bookid}`;
    const diarySql = `SELECT D.id, title, D.image AS diaryimage, category, (SELECT COUNT(*) FROM Likes WHERE diary_id=D.id) AS totalLike, (SELECT isLike FROM Likes WHERE diary_id=D.id AND member_id=M.id) AS isLike, D.created_at AS createdAt, D.modefied_at AS modifiedAt, M.id AS memberid, M.image AS memberimage, nickname FROM Diary AS D LEFT JOIN Member AS M ON D.member_id = M.id WHERE D.book_id=${bookid}`;
    const getBookData = await runQuery.fetchData(bookSql);
    const getDiaryData = await runQuery.fetchData(diarySql);

    if (getBookData.length === 0) res.status(404).json({ msg: "Wrong bookid" });
    else res.json([...getBookData, ...getDiaryData]);
  } catch (e) {
    console.log(e);
    res.status(500).json({ msg: "Internal Server Error" });
  }
});

router.patch("/:bookid", authorization, async (req, res) => {
  const { bookid } = req.params;
  const { title, subtitle, image, public } = req.body;

  try {
    const checkOwnerSql = `SELECT title, subtitle, image, public FROM Book WHERE id=${bookid} AND member_id=${req.verifyData.id}`;
    const getOwnerData = await runQuery.fetchData(checkOwnerSql);
    if (getOwnerData[0].count === 0)
      return res.status(403).json({ msg: "User and owner are not the same" });

    const patchData = {
      title: title || getOwnerData[0].title,
      subtitle: subtitle || getOwnerData[0].subtitle,
      image: image || getOwnerData[0].image,
      public: public === undefined ? getOwnerData[0].public : public,
    };

    const patchBookSql = `UPDATE Book SET title="${patchData.title}", subtitle="${patchData.subtitle}", image="${patchData.image}", public=${patchData.public} WHERE id=${bookid} AND member_id=${req.verifyData.id}`;
    const patchBookData = await runQuery.fetchData(patchBookSql);

    if (patchBookData.affectedRows) res.json({ msg: "ok" });
    else res.status(404).json({ msg: "Wrong bookid or memberid" });
  } catch (e) {
    console.log(e);
    res.status(500).json({ msg: "Internal Server Error" });
  }
});

router.delete("/:bookid", authorization, async (req, res) => {
  const { bookid } = req.params;

  try {
    const checkOwnerSql = `SELECT COUNT(*) AS count FROM Book WHERE id=${bookid} AND member_id=${req.verifyData.id}`;
    const getOwnerData = await runQuery.fetchData(checkOwnerSql);
    if (getOwnerData[0].count === 0)
      return res.status(403).json({ msg: "User and owner are not the same" });

    // TODO: conmment delete 추가하기
    const deleteDiarySql = `DELETE FROM Diary WHERE book_id=${bookid} AND member_id=${req.verifyData.id}`;
    const deleteBookSql = `DELETE FROM Book WHERE id=${bookid} AND member_id=${req.verifyData.id}`;

    const deleteDiaryData = await runQuery.fetchData(deleteDiarySql);
    const deleteBookData = await runQuery.fetchData(deleteBookSql);

    if (deleteBookData.affectedRows) res.json({ msg: "ok" });
    else res.status(404).json({ msg: "Wrong bookid or memberid" });
  } catch (e) {
    console.log(e);
    res.status(500).json({ msg: "Internal Server Error" });
  }
});

module.exports = router;
