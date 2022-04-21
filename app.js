const express = require("express")
const path = require("path")
const mongoose = require("mongoose")
const dotenv = require("dotenv")
const articlesRouter = require("./routers/articles")
const tagsRouter = require("./routers/tags")
const profilesRouter = require("./routers/profiles")
const usersRouter = require("./routers/users")
const userRouter = require("./routers/user")
const { authorizeUser } = require("./middleware/auth")

dotenv.config()

const app = express()

const PORT = process.env.PORT
const MONGODB_URL = process.env.MONGODB_URL

app.use(express.static("dist"))
app.use(express.json())
app.use(authorizeUser)

app.use("/api/articles", articlesRouter)
app.use("/api/tags", tagsRouter)
app.use("/api/profiles", profilesRouter)
app.use("/api/users", usersRouter)
app.use("/api/user", userRouter)

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"))
})

mongoose.connect(MONGODB_URL)

app.listen(PORT, () => {
  console.log(`Started Express server on port ${PORT}`)
})
