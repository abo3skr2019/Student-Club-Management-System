const mongoose = require('mongoose');
const { validate: validateUUID } = require('uuid');
const isUUID = (uuid) => {
    return validateUUID(uuid);
}
const isObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
}
const getIdType = (id) => {
    if (isUUID(id)) {
        return "UUID";
    }
    if (isObjectId(id)) {
        return "ObjectId";
    }
    throw new Error("Invalid ID format");
}
module.exports = {
    isUUID,
    isObjectId,
    getIdType
}   