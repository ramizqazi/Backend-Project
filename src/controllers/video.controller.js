import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Video } from '../models/video.model.js';

const uploadVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  const { user } = req;

  const videoLocalPath = req.file?.path;

  if (!videoLocalPath) {
    throw new ApiError(400, "Video file is required");
  }

  const uploadedVideo = await uploadOnCloudinary(videoLocalPath);

  if (!uploadedVideo) {
    throw new ApiError(400, "Video is required");
  }
  const thumbnail = uploadedVideo.url?.replace('.mp4', '.jpg');

  const video = await Video.create({
    title,
    views: 0,
    thumbnail,
    duration: 2,
    description,
    owner: user?._id,
    isPublished: true,
    videoFile: uploadedVideo.url,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, { video })
    )
});

export { uploadVideo }