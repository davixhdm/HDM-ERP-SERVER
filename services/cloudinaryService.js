const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

const uploadFile = (buffer, folder, publicId) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, public_id: publicId, resource_type: 'auto' },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

const deleteFile = (publicId) => {
  return cloudinary.uploader.destroy(publicId);
};

module.exports = { uploadFile, deleteFile };