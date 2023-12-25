import bcrypt from 'bcrypt';
import jwt from "jsonwebtoken";
import { Schema, model } from "mongoose";

const userSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  fullName: {
    type: String,
    required: true,
    index: true,
  },
  avatar: {
    type: String, // cloudinary url
    required: true,
  },
  coverImage: {
    type: String, // cloudinary url
  },
  watchHistory: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Video'
    }
  ],
  password: {
    type: String,
    required: [true, 'Password is required']
  },
  refreshToken: {
    type: String,
  }
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  // only run this pre function if password modified
  if (!this.isModified("password")) return

  this.password = bcrypt.hash(this.password, 10)
  next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
  jwt.sign({
    _id: this._id,
    email: this.email,
    username: this.username,
    fullName: this.fullName,
  }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRY
  })
};
userSchema.methods.generateRefreshToken = function () {
  jwt.sign({
    _id: this._id,
  }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY
  })
}

export const User = model('User', userSchema);