const rootPath = process.env.ROOT_PATH

// jwt
const { verifyToken } = require(`${rootPath}/lib/jwt.js`);

module.exports = authorization = async (req, res, next) => {
  console.log(req.headers.authorization.slice(7))
  if(req.headers.authorization.slice(7) === 'null'){
    res.status(401).json({msg: 'The token does not exist or has expired.'})
  } else {
    const verifyData = await verifyToken('access', req.headers.authorization.slice(7))
    if(verifyData){
      next()
    } else {
      res.status(401).json({msg: 'The token does not exist or has expired.'})
    }
  }
}