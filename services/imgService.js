const { db } = require('../dist/db');
const { image } = require('../dist/db/schema');
const { eq } = require('drizzle-orm');
const crypto = require('crypto');

// Helper function for UUID validation
const isValidUUID = (uuid) => {
    const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
};

// Helper function to generate a UUID
const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

/**
 * Save an image to the database
 * @param {Object} file - Multer file object
 * @param {number} userId - User ID of the uploader
 * @param {string} purpose - Purpose of the image (profile, club, event, etc.)
 * @returns {Promise<Object>} Saved image metadata
 */
const saveImage = async (file, userId, purpose = 'general') => {
    try {
        // Generate a hash of the image data for deduplication
        const hash = crypto
            .createHash('sha256')
            .update(file.buffer)
            .digest('hex');

        // Check if the exact same image already exists
        const existingImage = await db.query.image.findFirst({
            where: eq(image.hash, hash),
        });

        if (existingImage) {
            // Return the existing image reference instead of storing a duplicate
            return {
                id: existingImage.uuid,
                fileName: existingImage.fileName,
                mimeType: existingImage.mimeType,
                size: existingImage.size,
                purpose: existingImage.purpose,
                url: `/images/${existingImage.uuid}`
            };
        }

        // Generate a UUID for the new image
        const uuid = generateUUID();

        // Insert the new image
        const [savedImage] = await db
            .insert(image)
            .values({
                uuid: uuid,
                fileName: file.originalname,
                mimeType: file.mimetype,
                size: file.size,
                data: file.buffer,
                purpose: purpose,
                hash: hash,
                createdBy: userId,
                updatedBy: userId
            })
            .returning({
                id: image.id,
                uuid: image.uuid,
                fileName: image.fileName,
                mimeType: image.mimeType,
                size: image.size,
                purpose: image.purpose,
                createdAt: image.createdAt
            });

        // Return image metadata (not the binary data)
        return {
            id: savedImage.uuid,
            fileName: savedImage.fileName,
            mimeType: savedImage.mimeType,
            size: savedImage.size,
            purpose: savedImage.purpose,
            url: `/images/${savedImage.uuid}`,
            createdAt: savedImage.createdAt
        };
    } catch (error) {
        console.error('Error in saveImage:', error);
        throw error;
    }
};

/**
 * Get an image by UUID or filename
 * @param {string} imageId - UUID or filename of the image
 * @returns {Promise<Object>} Image with binary data
 */
const getImage = async (imageId) => {
    try {
        // Check if the input is a valid UUID
        const isUuid = isValidUUID(imageId);
        
        // Query based on either UUID or filename
        const imageData = await db.query.image.findFirst({
            where: isUuid ? eq(image.uuid, imageId) : eq(image.fileName, imageId),
            columns: {
                id: true,
                uuid: true,
                fileName: true,
                mimeType: true,
                data: true,
                size: true,
                purpose: true
            }
        });

        if (!imageData) {
            return null;
        }

        return imageData;
    } catch (error) {
        console.error('Error in getImage:', error);
        throw error;
    }
};

/**
 * Delete an image by UUID
 * @param {string} imageId - UUID of the image to delete
 * @param {number} userId - User ID attempting to delete
 * @returns {Promise<void>}
 */
const deleteImage = async (imageId, userId) => {
    try {
        if (!isValidUUID(imageId)) {
            throw new Error('Invalid image ID');
        }

        // Get the image to check ownership
        const imageData = await db.query.image.findFirst({
            where: eq(image.uuid, imageId),
            columns: {
                id: true,
                createdBy: true
            }
        });

        if (!imageData) {
            throw new Error('Image not found');
        }

        // Check if user is authorized to delete the image
        // Allow image creator or admin to delete images
        // TODO: Add admin check if needed
        if (imageData.createdBy !== userId) {
            throw new Error('Unauthorized');
        }

        // Delete the image
        await db.delete(image).where(eq(image.id, imageData.id));
    } catch (error) {
        console.error('Error in deleteImage:', error);
        throw error;
    }
};

module.exports = {
    saveImage,
    getImage,
    deleteImage
}; 