import { ObjectId } from 'bson';
import mongoose, { Document, Model, ClientSession } from 'mongoose';
import { EnhancedModel } from '../../lib'
import { Column } from '../column/column.model';
import { User } from '../user/user.model';
const { Schema } = mongoose;

const boardSchema = new Schema<IBoard>({
  title: { type: String, required: true },
  publicRead: { type: Boolean, required: true },
  publicWrite: { type: Boolean, required: true },
  adminAccessUsers: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
  readAccessUsers: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
  columns: [{ type: Schema.Types.ObjectId, ref: 'Column' }]
}, {
  strict: true
})
boardSchema.methods.userHasWriteAccess = function (this: IBoardDocument, userId?: string) {
  if(this.publicWrite) return true
  let hasWriteAccess = false;
  if(userId) {
    for(let i = 0; i < this.adminAccessUsers.length; i++) {
      if(this.adminAccessUsers[i].toString() === userId.toString()) {
        hasWriteAccess = true
        break;
      }
    }
  }
  return hasWriteAccess
}
boardSchema.methods.userHasReadAccess = function (this: IBoardDocument, userId?: string) {
  if(this.publicRead) return true
  let hasReadAccess = false;
  if(userId) {
    for(let i = 0; i < this.adminAccessUsers.length; i++) {
      if(this.adminAccessUsers[i].toString() === userId.toString()) {
        hasReadAccess = true
        break;
      }
    }
    for(let i = 0; i < this.readAccessUsers.length; i++) {
      if(this.readAccessUsers[i].toString() === userId.toString()) {
        hasReadAccess = true
        break;
      }
    }
  }
  return hasReadAccess
}
boardSchema.methods.isAdmin = function (this: IBoardDocument, userId?: string) {
  if(!userId) return false
  for(let i = 0; i < this.adminAccessUsers.length; i++) {
    if(this.adminAccessUsers[i].toString() === userId.toString()) {
      return true
    }
  }
  return false
}

const selectSetMap = {
  default: { 
    select: ["title", "columns", "adminAccessUsers", "publicRead", "publicWrite"], 
    populate: [{ path: "columns", ...Column.getSelectSet("default") }] 
  },
  admin: {
    select: ["title", "columns", "publicRead", "publicWrite", "adminAccessUsers", "readAccessUsers"], 
    populate: [
      { path: "columns", ...Column.getSelectSet("default") },
      { path: "adminAccessUsers", ...User.getSelectSet("default") },
      { path: "readAccessUsers", ...User.getSelectSet("default") }
    ] 
  }
}
export const Board = EnhancedModel<IBoard, IBoardDocument, IBoardModel, typeof selectSetMap>('Board', boardSchema, selectSetMap);

export interface IBoard {
  title: string
  publicRead: boolean,
  publicWrite: boolean,
  adminAccessUsers: Array<ObjectId>
  readAccessUsers: Array<ObjectId>
  columns?: Array<ObjectId>
}
export interface IBoardDocument extends IBoard, Document {
  userHasWriteAccess: (userId?: ObjectId) => boolean
  isAdmin: (userId?: ObjectId) => boolean
}
export interface IBoardModel extends Model<IBoardDocument> {}
