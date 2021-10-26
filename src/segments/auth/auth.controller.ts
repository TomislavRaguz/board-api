import express from 'express';
import { assert, object, number, string, array, is, validate, size } from 'superstruct'
import { APIError, ensure, pick, sStringTrimmed, sStructEmail, wrapAsync } from '../../lib';
import UserService from './auth.service';

export const authController = express.Router();

authController.post('/v1/auth/login', wrapAsync(async (req, res) => {
  const payload = ensure(req.body, object({
    email: sStructEmail,
    password: size(sStringTrimmed, 8, 255)
  }))
  const user = await UserService.localLogin(payload)
  //@ts-ignore
  const { data } = await req.authJWT.generate(user.ID)
  res.json(data)
}))

authController.post('/v1/auth/signup', wrapAsync(async (req, res) => {
  const payload = ensure(req.body, object({
    email: sStructEmail,
    password: size(sStringTrimmed, 8, 255)
  }))
  const newUser = await UserService.localSignup(payload)
  const { data } = await req.authJWT.generate(newUser.ID)
  res.status(201).json(data)
}))

authController.post('/v1/auth/logout', wrapAsync(async (req, res) => {
  req.authJWT.remove();
  res.send(true);
}))

authController.get('/v1/auth/me', wrapAsync(async (req, res) => {
  const userSession = await req.authJWT.getData();
  let user = null;
  if (userSession) user = pick(userSession, ['_id', 'ID', 'email'])
  res.json({ user })
}))