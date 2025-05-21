const express = require('express');
const router = express.Router();
const imgController = require('../controllers/imgController');
const multer = require('multer');
const { isAuthenticated } = require('../middleware/CheckAuth');

// Configure multer for image uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max file size
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    },
});

// Upload image route
router.post(
    '/upload',
    isAuthenticated,
    upload.single('image'),
    imgController.uploadImage
);

// Get image by ID
router.get('/:imageId', imgController.getImageById);

// Delete image
router.delete(
    '/:imageId',
    isAuthenticated,
    imgController.deleteImage
);

module.exports = router;

