const  multer = require('multer');
require("dotenv").config();

const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
cloudinary.config({
  cloud_name:process.env.CLOUD_NAME ,
  api_key: process.env.CLOUD_KEY,
  api_secret: process.env.CLOUD_SECRET
});
const storageCloud = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'rankImage',
    allowedFormats: ['jpeg', 'png', 'jpg'],
}     
});

const uploadCloud = multer({ storage:storageCloud });
module.exports.uploadCloud = uploadCloud;
module.exports.cloudinary = cloudinary;