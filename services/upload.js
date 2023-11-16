const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_KEY,
  api_secret: process.env.CLOUD_SECRET,
});
const storageCloud = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'rankImage',
    allowedFormats: ['jpeg', 'png', 'jpg'],
}     
});
const uploadCloud = function (image_name) {


  const upload = multer({ storage: storageCloud,  }); // Use a temporary folder for Multer

  return (req, res, next) => {
    upload.single(image_name)(req, res, async (error) => {
      if (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error uploading images' });
      }

      if (!req.file) {
        console.error('Input file is missing in the request.');
        return res.status(400).json({ error: 'Input file is missing' });
      }

      // Use Cloudinary transformations to create a smaller image with reduced quality, public_id: 'small_' + public id of the original image
      const smallImageResult = await cloudinary.uploader.upload(req.file.path, {
        quality: 'auto:low', // Adjust the quality as needed
        public_id: req.file.filename + '_small', 
      });

      req.body[image_name] = req.file.path; // Use the original image path
      req.body['small_' + image_name] = smallImageResult.secure_url;

      // Cleanup: remove the temporary file created by Multer
      // fs.unlinkSync(req.file.path);

      next();
    });
  };
};

module.exports.uploadCloud = uploadCloud;
module.exports.cloudinary = cloudinary;
