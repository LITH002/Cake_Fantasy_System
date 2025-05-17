import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';

/**
 * Uploads a buffer to Cloudinary
 * @param {Buffer} buffer - The image buffer to upload
 * @param {string} folder - The folder in Cloudinary to upload to
 * @returns {Promise} - The Cloudinary upload result
 */
const uploadToCloudinary = (buffer, folder = 'cake-fantasy') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: folder },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

/**
 * Deletes an image from Cloudinary by public ID
 * @param {string} publicId - The public ID of the image to delete
 * @returns {Promise} - The Cloudinary deletion result
 */
const deleteFromCloudinary = (publicId) => {
  return cloudinary.uploader.destroy(publicId);
};

export { uploadToCloudinary, deleteFromCloudinary };