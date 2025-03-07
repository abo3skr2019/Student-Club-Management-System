const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const TicketSchema = new Schema(
    {

    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["open", "closed", "in-progress"],
      default: "open",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "low",
    },
    category: {
      type: String,
      enum: ["bug", "feature", "task"],
      default: "bug",
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
  }},
  { timestamps: true }

);

const Ticket = mongoose.model("Ticket", TicketSchema);

module.exports = Ticket;