import { ObjectId } from 'bson';
import { ECONNREFUSED } from 'constants';
import express from 'express';
import { object,  string, boolean, optional, validate } from 'superstruct'
import { registeredUserOnly, sStringInt, sStructID, sStructMongoId, sStructStringMongoId, createCollectionExposer, wrapAsync, APIError, sStringTrimmed, ensure, sStructEmail } from '../../lib';
import { UserSession } from '../../singletons/authJWT';
import BoardService from './board.service';

export const boardController = express.Router();

boardController.get('/v1/boards', registeredUserOnly, wrapAsync(async (req, res) => {
  const user = await req.authJWT.getData()
  const boards = await BoardService.exposeList(user, req.query)
  res.json(boards)
}))

boardController.get('/v1/boards/:id', registeredUserOnly, wrapAsync(async (req, res) => {
  const boardId = ensure(req.params.id, sStructStringMongoId)
  const user = await req.authJWT.getData()
  const board = await BoardService.exposeOne(user, boardId, req.query)
  res.json(board)
}))

boardController.post('/v1/boards', registeredUserOnly, wrapAsync(async (req, res) => {
  const payload = ensure(req.body, object({
    title: sStringTrimmed,
    publicRead: boolean(),
    publicWrite: boolean()
  }))
  const user = await req.authJWT.getData() as UserSession
  const board = await BoardService.createBoard(user, payload)
  res.status(201).json(board);
}))

boardController.patch('/v1/boards/:id', registeredUserOnly, wrapAsync(async (req, res) => {
  const payload = ensure(req.body, object({
    assign: optional(object({
      publicWrite: optional(boolean()),
      publicRead: optional(boolean())
    })),
    addUser: optional(object({
       userEmail: sStructEmail,
       isAdmin: boolean()
    })),
    removeUser: optional(object({
      userId: sStructStringMongoId
    })),
    createColumn: optional(object({
      title: sStringTrimmed
    })),
    removeColumn: optional(object({
      columnId: sStructStringMongoId
    })),
    linkColumn: optional(object({
      columnId: sStructStringMongoId
    }))
  }))
  const boardId = ensure(req.params.id, sStructStringMongoId)
  const user = await req.authJWT.getData() as UserSession;
  await BoardService.updateBoard(user, boardId, payload)
  const board = await BoardService.exposeOne(user, boardId, {})
  res.json(board)
}))

boardController.delete('/v1/boards/:id', registeredUserOnly, wrapAsync(async (req, res) => {
  const boardId = ensure(req.params.id, sStructStringMongoId)
  const user = await req.authJWT.getData() as UserSession;
  const board = await BoardService.deleteBoard(user, boardId)
  res.json(board);
}))