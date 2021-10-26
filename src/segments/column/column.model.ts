import { ObjectId } from 'bson';
import mongoose, { Document, Model } from 'mongoose';
import { EnhancedModel } from '../../lib'
import { IBoardDocument } from '../board/board.model';
const { Schema } = mongoose;

const rowSchema = new Schema({
  content: { type: String, required: true }
}, {
  strict: true
})

const columnSchema = new Schema<IColumn>({
  title: { type: String, required: true },
  board: { type: Schema.Types.ObjectId, ref: 'Board', required: true },
  rows: [rowSchema]
}, {
  strict: true
})

const selectSetMap = {
  default: { select: ["title", "rows"] }
}
export const Column = EnhancedModel<IColumn, IColumnDocument, IColumnModel, typeof selectSetMap>('Column', columnSchema, selectSetMap);

export interface IRow {
  content: string
}
export interface IColumn {
  title: string
  board: IBoardDocument | ObjectId
  rows: Array<IRow>
}
export interface IColumnDocument extends IColumn, Document {}
export interface IColumnModel extends Model<IColumnDocument> {}
