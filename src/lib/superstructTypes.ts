import { coerce, define, integer, string, Struct, trimmed, validate } from 'superstruct'
import isEmail from 'isemail'
import { ObjectId } from 'bson'
import { APIError, mongoID, debug } from '.'

export const sStructEmail = define<string>('Email', (value:any) => isEmail.validate(value))
export const sStructMongoId = define<ObjectId>('MongoId', (value: any) => ObjectId.isValid(value))
export const sStructStringMongoId = coerce(sStructMongoId, string(), (value) => {
  if(value) return ObjectId.createFromHexString(value)
})
export const sStringInt = coerce(integer(), string(), value => parseInt(value))
export const sStructID = (typename: string) => {
  return coerce(sStructMongoId, string(), (value) => mongoID(typename, value))
}
export const sStringTrimmed = trimmed(string())

export function ensure<T, S>(target: any, struct: Struct<T, S>) {
  const [err, payload] = validate(target, struct, { coerce: true })
  if(err) throw APIError({
    code: "BAD_PAYLOAD",
    statusCode: 400
  })
  return JSON.parse(JSON.stringify(payload!))
}