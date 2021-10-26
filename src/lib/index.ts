import { ObjectId } from "bson"
import { Request, Response, NextFunction, RequestHandler } from "express"

const { NODE_ENV } = process.env;

export function pick(obj: Record<string, any>, keys: Array<string>){
  return  Object.assign({}, ...keys.map(key => ({ [key]: obj[key] })))
}

export function wrapAsync(fn: RequestHandler) {
  return function(req: Request, res: Response, next: NextFunction) {
    //@ts-ignore
    fn(req, res, next).catch(next);
  };
}

export function debug(...args: Array<any>) {
  if(NODE_ENV === "development") {
    console.log(...args)
  }
}

export function mongoID(typename: string, ID: string) {
  if(ID.substring(0, typename.length) !== typename) {
    throw Error(`Expected ID of type ${typename}, instead got ${ID}`)
  }
  return new ObjectId(ID.substring(typename.length+1))
}

export async function registeredUserOnly(req: Request, res: Response, next: NextFunction) {
  const user = await req.authJWT.getData();
  if(!user) return res.sendStatus(401)
  next()
}

export * from './superstructTypes'
export * from './createExposer'
export * from './APIError'
export * from './EnhancedModel'
