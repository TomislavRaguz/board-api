import mongoose, { Document, Model } from 'mongoose';
import { EnhancedModel } from '../../lib';
const { Schema } = mongoose;

const userSchema = new Schema<IUser>({
  email: String,
  passwordHash: String
}, {
  strict: true
})

const selectSetMap = {
  default: { select: ['ID', 'email'] }
}
export const User = EnhancedModel<IUser, IUserDocument, IUserModel, typeof selectSetMap>('User', userSchema, selectSetMap);

export interface IUser {
  email: string
  passwordHash: string
}
export interface IUserDocument extends IUser, Document {}
export interface IUserModel extends Model<IUserDocument> {}