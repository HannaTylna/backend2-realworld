const express = require("express")
const path = require("path")
const mongoose = require("mongoose")
const { User } = require("./models/user")
const dotenv = require("dotenv")
const articlesRouter = require("./routers/articles")
const tagsRouter = require("./routers/tags")
const bcrypt = require("bcrypt")

dotenv.config()

const app = express()
const PORT = 3000

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

app.use(express.static("dist"))
app.use(express.json())
app.use(authorizeUser)

app.use("/api/articles", articlesRouter)
app.use("/api/tags", tagsRouter)

app.post("/api/users", async (req, res) => {
  const { username, email, password } = req.body.user
  const user = new User({ username, email, password })
  const createdUser = await user.save()
  const token = createUserToken(createdUser)

  res.json({
    user: {
      username: createdUser.username,
      email: createdUser.email,
      token,
      bio: createdUser.bio,
      image: createdUser.image,
    },
  })
})

const createUserToken = (user) => {
  const userId = user._id.toString()
  return (token = jwt.sign(
    { userId, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "24 h", subject: userId }
  ))
}

app.post("/api/users/login", async (req, res) => {
  const { email, password } = req.body.user
  const user = await User.login(email, password)
  if (user) {
    const token = createUserToken(user)
    return res.json({
      user: {
        token,
        email: user.email,
        username: user.username,
        bio: user.bio,
        image: user.image,
      },
    })
  } else {
    res.sendStatus(401)
  }
})

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"))
})

app.get("/api/user", async (req, res) => {
  const user = req.user
  const { userId } = user
  const databaseUser = await User.findOne({ _id: userId })
  res.json({
    user: {
      email: user.email,
      token: req.token,
      username: databaseUser.username,
      bio: databaseUser.bio,
      image: databaseUser.image,
    },
  })
})

console.log("this is a test");

app.get("/api/profiles/:username", async (req, res) => {
  const user = await User.findOne({ username: req.params.username })
  res.json({
    profile: {
      username: user.username,
      image: user.image,
      bio: user.bio,
    },
  })
})

app.put("/api/user", async (req, res) => {
  const { email, username, image, bio, password } = req.body.user
  const user = req.user

  const updatedUser = await User.findOneAndUpdate(
    {
      _id: user.userId,
    },
    {
      email,
      password,
      bio,
      username,
      image,
    },
    { returnDocument: "after" }
  )

  res.json({
    user: {
      email: updatedUser.email,
      username: updatedUser.username,
      bio: updatedUser.bio,
      image: updatedUser.image,
      token: createUserToken(updatedUser),
    },
  })
})

mongoose.connect(`mongodb://localhost/realworld`)

app.listen(PORT, () => {
  console.log(`Started Express server on port ${PORT}`)
})
