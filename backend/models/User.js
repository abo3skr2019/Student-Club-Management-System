const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { v4: uuidv4 } = require("uuid");

/**
    * @typedef {Object} Provider
    * @property {string} name - Name of the provider
    * @property {string} providerId - ID of the provider
*/
const ProviderSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  providerId: {
    type: String,
    required: true,
    index: true,
  },
});
ProviderSchema.index({ name: 1, providerId: 1 }, { unique: true });

/**
 * @typedef {Object} User
 * @property {string} uuid - UUID of the user
 * @property {string} displayName - Display name of the user
 * @property {string} firstName - First name of the user
 * @property {string} lastName - Last name of the user
 * @property {string} email - Email of the user
 * @property {string} profileImage - URL of the user's profile image
 * @property {Array<string>} clubsJoined - Array of club references
 * @property {Array<string>} clubsManaged - Array of club references
 * @property {Array<string>} eventsJoined - Array of event references
 * @property {Array<Provider>} providers - Array of provider objects
 * @property {string} role - Role of the user
 * @property {Date} createdAt - Date of creation
 * @property {Date} updatedAt - Date of last update
*/
const UserSchema = new Schema(
  {
    uuid: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    displayName: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      match: [/.+\@.+\..+/, "Please fill a valid email address"],
      index: true,
    },
    profileImage: {
      type: String,
      required: true,
    },
    clubsJoined: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Club",
      },
    ],
    clubsManaged: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Club",
      },
    ],
    eventsJoined: [{
      event: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Event',
          required: true
      },
      registrationDate: {
          type: Date,
          default: Date.now
      }
  }],
    /*
    Possible TODO: Add the following fields:
    - eventsManaged: Array of Event references    
    */

    providers: [ProviderSchema],
    role: {
      type: String,
      enum: ["Admin", "ClubAdmin", "Member", "Visitor"],
      default: "Visitor",
      index: true,
    },
  },
  { timestamps: true }
);

UserSchema.pre("save", function (next) {
  if (this.isNew && !this.uuid) {
    this.uuid = uuidv4();
  }
  next();
});


/**
 * @typedef {import('mongoose').Model<User>} 
 */
const User = mongoose.model("User", UserSchema);

module.exports = User;
