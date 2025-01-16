const mongoose = require('mongoose');
const { validate: validateUUID } = require('uuid');
const isUUID = (uuid) => {
    return validateUUID(uuid);
}
const isObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
}
const getIdType = (id) => {
    let clubIdType
    if (isUUID(id))
      clubIdType = "UUID";
    if (isObjectId(id))
      clubIdType = "ObjectId";
    return clubIdType;
}
module.exports = {
    isUUID,
    isObjectId,
    getIdType
}   