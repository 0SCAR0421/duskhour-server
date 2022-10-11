// server engine
const express = require('express')
const router = express.Router();
const rootPath = process.env.ROOT_PATH

// jwt
const { generateToken, verifyToken } = require(`${rootPath}/lib/jwt.js`);

// lib
const runQuery = require(`${rootPath}/lib/dbquery`)

router.post('/signup', async (req, res) => {
  const body = req.body
  const postSql = `INSERT INTO Member(email, password, nickname, name) VALUES('${body.email}', SHA2('${body.password}', 256), '${body.nickname}', '${body.name}')`
  const checkEmailSql = `SELECT COUNT(email) AS checkEmail FROM Member WHERE email='${body.email}'`
  const checkEmailData = await runQuery.fetchData(checkEmailSql)
  let resData = {}
  console.log("signup")
  console.log(body)

  if(checkEmailData[0]['checkEmail']) {
    resData = {
      ...resData,
      state: false,
      errEmailMsg: 'Overlap User_Email'
    }
  } else {
    console.log(body)
    await runQuery.fetchData(postSql)
    resData = {
      ...resData,
      state: true,
      msg: 'OK'
    }
  }

  res.json(resData)
})

router.post('/signin', async (req, res) => {
  const body = req.body
  const sql = `SELECT * FROM Member WHERE email='${body.email}' AND password=SHA2('${body.password}', 256)`
  const checkLoginData = await runQuery.fetchData(sql)
  console.log("signin")
  console.log(body)

  if(checkLoginData.length === 0){
    res.json({state: false, msg: 'No Match ID or Password'})
  } else {
    const payload = {
      id: checkLoginData[0].id,
      nickname: checkLoginData[0].nickname,
      name: checkLoginData[0].name
    }
    
    const { accessToken, refreshToken } = await generateToken(payload, false)

    const userData = {
      state: true,
      msg: 'OK',
      ...payload,
      accessToken,
      refreshToken
    }

    res.json(userData)
  }
})

router.get('/checkRefresh', async (req, res) => {
  if(req.headers.authorization.slice(7) === 'null'){
    res.status(401).json({msg: 'The token does not exist or has expired.'})
  } else {
    const verifyData = await verifyToken('refresh', req.headers.authorization.slice(7))
    if(verifyData){
      const accessToken = await generateToken({
        id: verifyData.id,
        nickname: verifyData.nickname,
        name: verifyData.name,
      }, true)
      res.json(accessToken)
    } else {
      res.status(401).json({msg: 'The token does not exist or has expired.'})
    }
  }
})

router.get('/logout', async (req, res) => {
  res.clearCookie('access_jwt', cookieOptions).send()
})

module.exports = router;