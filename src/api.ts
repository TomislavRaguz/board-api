require('dotenv').config()

const { NODE_ENV, PORT } = process.env;
if(!NODE_ENV) throw Error('Required env variable NODE_ENV not defined. Please check .env file')
if(!PORT) throw Error('Required env variable PORT not defined. Please check .env file')

import express, { NextFunction, Request, Response } from 'express'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import morgan from 'morgan'
import mongoose from 'mongoose';

import { jwtMiddleware } from './singletons/authJWT'
import './singletons/mongo'

import { APIError } from './lib'
import { mongooseConnect } from './singletons/mongo'

import { authController } from './segments/auth/auth.controller'
import { boardController } from './segments/board/board.controller'
import { columnController } from './segments/column/column.controller'

const API = express();
//we disable helmet CSP in dev so it wont interfere with tools
API.use(helmet({ contentSecurityPolicy: NODE_ENV === 'production' ? undefined : false }));
API.use(express.json());
API.use(cookieParser());
if(NODE_ENV === 'development') {
  API.use(morgan('dev'));
}
API.use(jwtMiddleware)

API.use('/api', authController)
API.use('/api', boardController)
API.use('/api', columnController)

API.use(function (err: Error | APIError, req: Request, res: Response, next: NextFunction) {
  console.log('err', err)
  if("type" in err && err.type === 'API_ERROR') {
    res.status(err.statusCode).json(err)
  } else {
    res.status(500).json({
      type: 'API_ERROR',
      code: 'GENERIC',
      statusCode: 500,
      userMessage: 'Something went wrong'
    })
  }
})

const server = API.listen(PORT, async () => {
  await mongooseConnect()
  console.log(`
API started
PORT: ${PORT}
NODE_ENV: ${NODE_ENV}
  `)
  //this line tells the pm2 that server is ready
  if(process.send) process.send('ready')
})

function gracefullShutdown () {
  console.log('Gracefull shutdown initiated')
  server.close(() => {
    console.log('HTTP server closed')
    mongoose.connection.close()
    process.exit(0);
  })
}
process.on('SIGINT', gracefullShutdown);
process.on('SIGTERM', gracefullShutdown);