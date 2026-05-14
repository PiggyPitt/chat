import mongoose from 'mongoose';

export const RoomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    createdBy: { type: String, required: true },
    members: { type: [String], default: [] },
    passwordHash: { type: String }
  },
  { timestamps: true, collection: 'rooms' }
);

export interface RoomDocument extends mongoose.Document {
  name: string;
  createdBy: string;
  members: string[];
  passwordHash?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const RoomModel = mongoose.model<RoomDocument>('Room', RoomSchema);
