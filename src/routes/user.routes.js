import { Router } from "express";
import { body, param } from 'express-validator';

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from '../middlewares/multer.middleware.js';
import validate from '../utils/validate.util.js';
import {
  loginUser,
  logoutUser,
  updateUser,
  registerUser,
  changePassword,
  getWatchHistory,
  refreshAccessToken,
  getUserChannelProfile,
} from "../controllers/user.controller.js";

const router = Router();

router.route("/register").post(
  validate([
    body('email', 'Invalid parameter "email"')
      .trim()
      .isEmail(),
    body('password', 'Password must be at least 8 characters long and contains at least one number and one letter')
      .isStrongPassword({
        minLength: 8,
        minNumbers: 1,
        minSymbols: 0,
        minLowercase: 0,
        minUppercase: 0,
      }),
    body('fullName', 'Invalid parameter "fullName"')
      .trim()
      .notEmpty(),
    body('username', 'Invalid parameter "username"')
      .isLowercase()
      .trim()
      .notEmpty(),
    body('avatar', 'Invalid parameter "avatar"')
      .notEmpty(),
  ]),
  upload.fields([
    {
      name: 'avatar',
      maxCount: 1,
    },
    {
      name: 'coverImage',
      maxCount: 1,
    }
  ]), registerUser);

router.route("/login").post(
  validate([
    body('username', 'Invalid parameter "username"')
      .trim()
      .notEmpty(),
    body('password', 'Password must be at least 8 characters long and contains at least one number and one letter')
      .isStrongPassword({
        minLength: 8,
        minNumbers: 1,
        minSymbols: 0,
        minLowercase: 0,
        minUppercase: 0,
      }),
  ]),
  loginUser);

//secured routes
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);

router.route("/update").put(verifyJWT,
  validate([
    body('email', 'Invalid parameter "email"')
      .trim()
      .isEmail(),
    body('fullName', 'Invalid parameter "fullName"')
      .trim()
      .notEmpty(),
    body('username', 'Invalid parameter "username"')
      .isLowercase()
      .trim()
      .notEmpty(),
  ]),
  upload.fields([
    {
      name: 'avatar',
      maxCount: 1,
    },
    {
      name: 'coverImage',
      maxCount: 1,
    }
  ]),
  updateUser
);

router.route("/change-password").put(
  verifyJWT,
  validate([
    body('oldPassword', 'Old Password must be at least 8 characters long and contains at least one number and one letter')
      .isStrongPassword({
        minLength: 8,
        minNumbers: 1,
        minSymbols: 0,
        minLowercase: 0,
        minUppercase: 0,
      }),
    body('newPassword', 'New Password must be at least 8 characters long and contains at least one number and one letter')
      .isStrongPassword({
        minLength: 8,
        minNumbers: 1,
        minSymbols: 0,
        minLowercase: 0,
        minUppercase: 0,
      }),
  ]),
  changePassword
);

router.route("/channel/:username").get(
  verifyJWT,
  validate([
    param('username', 'Invalid parameter "username"')
      .isLowercase()
      .trim()
      .notEmpty(),
  ]),
  getUserChannelProfile
);

router.route("/history").get(verifyJWT, getWatchHistory);

export default router;