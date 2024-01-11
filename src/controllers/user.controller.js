import jwt from 'jsonwebtoken';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { User } from '../models/user.model.js';
import { destroyOnCloudinary, uploadOnCloudinary } from '../utils/cloudinary.js';
import { generateAccessAndRefereshTokens } from '../utils/functions.js';
import mongoose from 'mongoose';

const cookieOptions = {
  httpOnly: true,
  secure: true
};

const getUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "User get successfully"));
});

const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  // validation - not empty
  // check if user already exist: username, email

  const { fullName, email, username, password } = req.body;

  if (!fullName || !email || !username || !password) {
    throw new ApiError(400, "All fields are required");
  }

  const existingUser = await User.findOne({
    $or: [{ username }, { email }]
  });

  if (existingUser) {
    throw new ApiError(409, "User with email or username already exist");
  }

  const avatarLocalPath = req.files?.avatar && req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.length > 0 ? req.files?.coverImage[0]?.path : undefined;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar is required");
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || '',
    email,
    password,
    username: username.toLowerCase(),
  });

  const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id);

  return res.status(201).json(new ApiResponse(200, {
    user,
    accessToken,
    refreshToken,
  }))
});

const loginUser = asyncHandler(async (req, res) => {
  const { username, password } = req.body

  const user = await User.findOne({
    $or: [{ username: username }, { email: username }]
  })

  if (!user) {
    throw new ApiError(400, "User does not exist")
  }

  const isPasswordValid = await user.isPasswordCorrect(password)

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials")
  }

  const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id);

  const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged In Successfully"
      )
    )

})

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1 // this remove the field from document
      }
    },
    {
      new: true
    }
  )

  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, {}, "User logged Out"))
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const userRefreshToken = req.body.refreshToken;

  if (!userRefreshToken) {
    throw new ApiError(401, 'Invalid refresh token');
  }

  try {
    const decodedToken = jwt.verify(userRefreshToken, process.env.REFRESH_TOKEN_SECRET);

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (userRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user?._id);

    return res
      .status(200)
      .cookie('accessToken', accessToken, cookieOptions)
      .cookie('refreshToken', refreshToken, cookieOptions)
      .json(new ApiResponse(200, { accessToken, refreshToken }, 'Access Token Refreshed'));
  } catch (e) {
    throw new ApiError(500, "Something went wrong while generate token");
  }
});

const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, 'Invalid old password');
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password Changed Successfully"));
});

const updateUser = asyncHandler(async (req, res) => {
  const { fullName, email, username } = req.body;

  const user = req.user;

  const updatedInfo = {};

  if (fullName !== user?.fullName) {
    updatedInfo.fullName = fullName
  }
  if (email !== user?.email) {
    updatedInfo.email = email
  }
  if (username !== user?.username) {
    updatedInfo.username = username
  }

  const avatarLocalPath = req.files?.avatar?.length > 0 ? req.files?.avatar[0]?.path : undefined;
  if (avatarLocalPath) {
    await destroyOnCloudinary(user?.avatar);
    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if (avatar.url) {
      updatedInfo.avatar = avatar.url;
    }
  }

  const coverImageLocalPath = req.files?.coverImage?.length > 0 ? req.files?.coverImage[0]?.path : undefined;
  if (coverImageLocalPath) {
    await destroyOnCloudinary(user?.coverImage);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (coverImage.url) {
      updatedInfo.coverImage = coverImage.url;
    }
  }


  const updatedUser = await User.findByIdAndUpdate(
    user?._id,
    {
      $set: updatedInfo,
    },
    { new: true }
  ).select('-password -refreshToken');

  return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "User updated Successfully"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username?.trim()) {
    throw new ApiError(400, "Username is missing");
  }

  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers"
      }
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo"
      }
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers"
        },
        channelsSubscribedToCount: {
          $size: "$subscribedTo"
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          }
        }
      }
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
      }
    }
  ]);

  if (!channel?.length) {
    throw new ApiError(404, "Channel does not exist");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, channel[0]));
});

const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user?._id),
      }
    },
    {
      $lookup: {
        from: 'videos',
        localField: 'watchHistory',
        foreignField: '_id',
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: 'users',
              localField: 'owner',
              foreignField: '_id',
              as: 'owner',
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                  }
                }
              ]
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner"
              }
            }
          }
        ]
      }
    }
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, user[0]?.watchHistory, "Watch history fetched successfully"))
});

export {
  getUser,
  loginUser,
  logoutUser,
  updateUser,
  registerUser,
  changePassword,
  getWatchHistory,
  refreshAccessToken,
  getUserChannelProfile,
}