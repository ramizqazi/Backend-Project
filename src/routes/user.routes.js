import { Router } from "express";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from '../middlewares/multer.middleware.js';
import {
  loginUser,
  logoutUser,
  registerUser,
  changePassword,
  refreshAccessToken,
  updateUser,
  getUserChannelProfile,
} from "../controllers/user.controller.js";

const router = Router();

router.route("/register").post(upload.fields([
  {
    name: 'avatar',
    maxCount: 1,
  },
  {
    name: 'coverImage',
    maxCount: 1,
  }
]), registerUser);

router.route("/login").post(loginUser);

//secured routes
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);

router.route("/update").put(verifyJWT, upload.fields([
  {
    name: 'avatar',
    maxCount: 1,
  },
  {
    name: 'coverImage',
    maxCount: 1,
  }
]), updateUser);
router.route("/change-password").put(verifyJWT, changePassword);

router.route("/get-channel").get(verifyJWT, getUserChannelProfile);

export default router;