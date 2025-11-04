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
  user_id?: number;
  email: string;
  password: string;
  role: string;
  department: string;
  firstName: string;
  lastName: string;
  bio: string;
}

const userSchema = new Schema<IUser>({
  user_id: { type: Number, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true },
  department: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  bio: { type: String },
});

export const User = mongoose.models.User || mongoose.model('User', userSchema)
