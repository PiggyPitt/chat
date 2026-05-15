import mongoose from 'mongoose';

export const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'banned'], default: 'pending' },
    role: { type: String, enum: ['user', 'admin'], default: 'user' }
  },
  { timestamps: true, collection: 'users' }
);

export interface UserDocument extends mongoose.Document {
  username: string;
  passwordHash: string;
  status: 'pending' | 'approved' | 'rejected' | 'banned';
  role: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

export const UserModel = mongoose.model<UserDocument>('User', UserSchema);
