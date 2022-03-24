const mongoose = require("mongoose")
const bcrypt = require("bcrypt");
const { use } = require("bcrypt/promises");

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true, select: false },
})

userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10)
  }
  next()
});

userSchema.statics.login=async function(email,password){
  const user= await this.findOne({email:email}).select('+password');
  if(user && await bcrypt.compare(password,user.password)){
    return user
  } else{
    return null
  }
};

const User = mongoose.model("User", userSchema)

module.exports = { User }
