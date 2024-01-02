import fs from 'fs';
import { ApiError } from './ApiError.js';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    // upload file to cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, { resource_type: 'auto' });

    // file has been uploaded successfully
    // console.log('file is uploaded successfully', response.url)

    return response;

  } catch (error) {
    throw new ApiError(500, 'File Upload Error');
  } finally {
    if(localFilePath) {
      fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation got failed
    }
  }
};

const destroyOnCloudinary = async (url) => {
  try {
    if (!url) return null;
    const regex = /\/v(\d+)\/(\w+)\.\w+$/;
    var match = url.match(regex);
    var id = match[2];

    console.log(id)
    // remove file from cloudinary
    const response = await cloudinary.uploader.destroy(id, { resource_type: 'image' });
    return response;
  } catch (error) {
    console.log(error)
    throw new ApiError(500, 'File Upload Error');
  }
};

export { uploadOnCloudinary, destroyOnCloudinary };