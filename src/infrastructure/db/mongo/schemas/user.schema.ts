import mongoose from 'mongoose';

export const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true }
  },
  { timestamps: true, collection: 'users' }
);

export interface UserDocument extends mongoose.Document {
  username: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

export const UserModel = mongoose.model<UserDocument>('User', UserSchema);
