import { ObjectId } from 'bson';
import mongoose, { Document, Model, ClientSession } from 'mongoose';
import { debug } from '.';
import { UserSession } from "../singletons/authJWT"

export interface MutationCtx {
  user: UserSession | null,
  session?: ClientSession | null
}
interface SelectSet {
  select: Array<string>, 
  populate?: Array<{ path: string, select: Array<string>, populate?: any}>
}
interface SelectSetMap {
  [key:string]: SelectSet 
}
export function EnhancedModel<BaseObject, DocumentType, ModelType extends Model<any>, T  extends SelectSetMap>(name: string, schema: mongoose.Schema<unknown, mongoose.Model<unknown, any, any, any>, {}> | mongoose.Schema<mongoose.Document<any, any, any>, mongoose.Model<mongoose.Document<any, any, any>, any, any, any>, {}> | undefined, selectSetMap: T, collection?: string | undefined, skipInit?: boolean | undefined) {
  type ExtendedDocument = DocumentType & { ID: string }
  
  function safeCreate (docs: BaseObject & { _id?: ObjectId | string }, options?: mongoose.SaveOptions): Promise<ExtendedDocument>
  function safeCreate (docs: Array<BaseObject & { _id?: ObjectId | string }>, options?: mongoose.SaveOptions): Promise<Array<ExtendedDocument>>
  async function safeCreate (this: ModelType, docs: any, options?: mongoose.SaveOptions)  {
    debug('safeCreate:', name, docs)
    if(Array.isArray(docs)) {
      return this.create(docs, options)
    } else {
      const arr = await this.create([docs], options)
      return arr[0]
    }
  }
  schema!.statics.safeCreate = safeCreate
  schema!.virtual('ID').get(function() {
    return name + ':' + this._id
  });
  function getSelectSet (this: ModelType, key: keyof T) {
    return selectSetMap[key]
  }
  schema!.statics.getSelectSet = getSelectSet
  const model = mongoose.model<ExtendedDocument, ModelType & { safeCreate: typeof safeCreate, getSelectSet: typeof getSelectSet }>(name, schema as any, collection, skipInit)
  return model
}