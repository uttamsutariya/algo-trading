import mongoose from "mongoose";
import bcrypt from "bcryptjs";

interface IUser {
  email: string;
  password: string;
  name: string;
  createdAt: Date;
  lastPasswordUpdate: Date;
}

interface UserModel extends mongoose.Model<IUser> {
  login(email: string, password: string): Promise<IUser>;
}

const userSchema = new mongoose.Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastPasswordUpdate: {
    type: Date,
    default: Date.now
  }
});

// Static login method
userSchema.statics.login = async function (email: string, password: string) {
  const user = await this.findOne({ email });

  if (!user) {
    throw new Error("Invalid credentials");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Invalid credentials");
  }

  return user;
};

// Update the auth route to use this model
export const User = mongoose.model<IUser, UserModel>("User", userSchema);
