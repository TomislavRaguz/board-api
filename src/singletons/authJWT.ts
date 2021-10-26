import { ObjectId } from 'bson';
import { JWTAuth, authJWTExpress, AuthJWT } from 'auth-jwt-express'
import { mongoID } from '../lib'
import { User } from '../segments/user/user.model';

export const jwtAuth = new JWTAuth<string, UserSession>({
  ////secret generated via > openssl rand -base64 64
  secret: "twUQFMd5BjTbHtkVDjSdfZGHT5CrEZP9iNnoKGtjeeUdgAIkzJUOcJQ+WdbAGbk/gbYkzBLlcUjZOQEgbMPALg==",
  getJWTData: async (userID: string, oiat: number) => {
    const userId = mongoID("User", userID);
    const userDoc = await User.findById(userId)
    if(!userDoc) {
      throw Error(`User ${userID} not found`)
    }
    return userDoc.toObject({ virtuals: true });
  },
  dataRefreshIntervalInSeconds: 15 * 60,
  cookieConfig: {
    useCookie: true,
    CSRFProtection: {
      customHeader: { active: true }
    }
  }
})

export const jwtMiddleware = authJWTExpress(jwtAuth)

declare global {
  namespace Express {
    interface Request {
      authJWT: AuthJWT<string, UserSession>
    }
  }
}

export interface UserSession {
  _id: ObjectId
  email: string
}