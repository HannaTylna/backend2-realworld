const mongoose = require("mongoose")
const bcrypt = require("bcrypt")

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true, select: false },
  bio: { type: String, default: " " },
  image: { type: String, default: "https://i.stack.imgur.com/34AD2.jpg" },
  followedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  follows: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
})

userSchema.pre("save", async function (next) {
  console.log("pre save")
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10)
  }
  next()
})

userSchema.pre("findOneAndUpdate", async function (next) {
  const valuesToUpdate = this.getUpdate()

  if (valuesToUpdate.password) {
    valuesToUpdate.password = await bcrypt.hash(valuesToUpdate.password, 10)
  } else {
    delete valuesToUpdate.password
  }
  next()
})

userSchema.statics.login = async function (email, password) {
  const user = await this.findOne({ email: email }).select("+password")
  if (user && (await bcrypt.compare(password, user.password))) {
    return user
  } else {
    return null
  }
}

const User = mongoose.model("User", userSchema)

module.exports = { User }
