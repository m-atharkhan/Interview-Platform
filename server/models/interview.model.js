import mongoose from "mongoose";

const interviewSchema = new mongoose.Schema(
{
  roomId: {
    type: String,
    required: true,
    unique: true
  },

  interviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  candidates: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  ],

  status: {
    type: String,
    enum: ["scheduled", "active", "completed"],
    default: "scheduled"
  },

  startedAt: {
    type: Date,
    default: Date.now
  }

},
{ timestamps: true }
);

export default mongoose.model("Interview", interviewSchema);