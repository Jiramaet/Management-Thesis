// import mongoose, { Schema, model, Document } from 'mongoose';

// // Define an interface for your document
// interface IUser extends Document {
//     name: string;
//     email: string;
//     age?: number;
// }

// // Create a Mongoose Schema
// const userSchema = new Schema<IUser>({
//     name: { type: String, required: true },
//     email: { type: String, required: true, unique: true },
//     age: Number,
// });

// // Create a Mongoose Model
// export const User = mongoose.models.User || mongoose.model('User', userSchema)

import mongoose, { Schema, model, Document } from 'mongoose';

interface IUser extends Document {
  // user_id is optional; we'll rely on MongoDB _id by default unless
  // you specifically need a numeric user_id.
  user_id?: number;
  name: string;
  email: string;
  password: string;
  role?: string;
  department?: string;
  bio?: string;
}

const userSchema = new Schema<IUser>({
  // Keep user_id if you need it, but it's optional here.
  user_id: { type: Number, required: false, unique: true, sparse: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: false, default: 'student' },
  department: { type: String, required: false, default: 'N/A' },
  bio: { type: String },
});

export const User = mongoose.models.User || mongoose.model('User', userSchema)
