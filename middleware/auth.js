const jwt = require("jsonwebtoken")

const authorizeUser = (req, res, next) => {
  const authHeader = req.header("Authorization")
  if (authHeader) {
    const token = authHeader.split(" ")[1]
    req.user = jwt.verify(token, process.env.JWT_SECRET)
    req.token = token
  }
  next()
}

module.exports = { authorizeUser }
