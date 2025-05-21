const imgService = require('../services/imgService');

/**
 * Upload an image
 * @param {Request} req - Express request object with multer file
 * @param {Response} res - Express response object
 * @returns {void}
 */
const uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No image file provided'
            });
        }

        // Extract user ID from authenticated request
        const userId = req.user.id;
        
        // Get the purpose from query params (profile, club, event, etc.)
        const { purpose = 'general' } = req.query;

        const result = await imgService.saveImage(req.file, userId, purpose);
        
        res.status(201).json({
            success: true,
            message: 'Image uploaded successfully',
            data: result
        });
    } catch (error) {
        console.error('Error in uploadImage:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to upload image'
        });
    }
};

/**
 * Get image by ID
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {void}
 */
const getImageById = async (req, res) => {
    try {
        const { imageId } = req.params;
        const image = await imgService.getImage(imageId);
        
        if (!image) {
            return res.status(404).json({
                success: false,
                error: 'Image not found'
            });
        }
        
        // Set appropriate content type
        res.set('Content-Type', image.mimeType);
        
        // Set cache control headers for better performance
        res.set('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
        
        // Send the image data
        res.send(image.data);
    } catch (error) {
        console.error('Error in getImageById:', error);
        
        if (error.message === 'Invalid image ID') {
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve image'
        });
    }
};

/**
 * Delete an image
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {void}
 */
const deleteImage = async (req, res) => {
    try {
        const { imageId } = req.params;
        const userId = req.user.id;
        
        await imgService.deleteImage(imageId, userId);
        
        res.status(200).json({
            success: true,
            message: 'Image deleted successfully'
        });
    } catch (error) {
        console.error('Error in deleteImage:', error);
        
        if (error.message === 'Image not found') {
            return res.status(404).json({
                success: false,
                error: error.message
            });
        }
        
        if (error.message === 'Unauthorized') {
            return res.status(403).json({
                success: false,
                error: 'You do not have permission to delete this image'
            });
        }
        
        res.status(500).json({
            success: false,
            error: 'Failed to delete image'
        });
    }
};

module.exports = {
    uploadImage,
    getImageById,
    deleteImage
}; 