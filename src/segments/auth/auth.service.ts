import bcrypt from 'bcrypt'
import { APIError } from "../../lib";
import { User } from "../user/user.model"

export async function localLogin (params: { email: string, password: string }) {
  const { email, password } = params;
  const userDoc = await User.findOne({ email })
  if(!userDoc) throw APIError({
    statusCode: 404,
    code: "LOGIN:NO_ACCOUNT_WITH_MAIL"
  })
  const passwordMatch = bcrypt.compare(password, userDoc.passwordHash)
  if(!passwordMatch) throw APIError({
    statusCode: 403,
    code: "LOGIN:WRONG_PASSWORD"
  })
  return userDoc.toObject({ virtuals: true })
}
export async function localSignup (params: { email: string, password: string }):Promise<{ email: string, passwordHash: string, ID: string }> {
  const { email, password } = params;
  const existingUserDoc = await User.findOne({ email })
  if(existingUserDoc) throw APIError({
    statusCode: 400,
    code: "SIGNUP:EMAIL_IN_USE",
    userMessage: "There is already an account with this email."
  })
  const passwordHash = await bcrypt.hash(password, 8)
  const userDoc = await User.safeCreate({ email, passwordHash })
  return userDoc.toObject({ virtuals: true });
}

export default {
  localLogin,
  localSignup
}