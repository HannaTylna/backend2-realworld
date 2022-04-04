const { Router } = require("express")
const { User } = require("../models/user")

const router = Router()

router.post("/login", async (req, res) => {
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

router.post("/", async (req, res) => {
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

module.exports = router
