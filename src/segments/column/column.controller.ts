import { ObjectId } from 'bson';
import express from 'express';
import { object,  string, boolean, optional, validate, array } from 'superstruct'
import { registeredUserOnly, sStringInt, sStructID, sStructMongoId, sStructStringMongoId, createCollectionExposer, wrapAsync, APIError, sStringTrimmed, ensure } from '../../lib';
import { UserSession } from '../../singletons/authJWT';
import ColumnService from './column.service';

export const columnController = express.Router();

columnController.patch('/v1/columns/:id', registeredUserOnly, wrapAsync(async (req, res) => {
  const payload = ensure(req.body, object({
    setRows: optional(object({
      rows: array(object({ content: sStringTrimmed, _id: optional(sStructStringMongoId) }))
    }))
  }))
  const boardId = ensure(req.params.id, sStructStringMongoId)
  const user = await req.authJWT.getData() as UserSession;
  const board = await ColumnService.updateColumn(user, boardId, payload)
  res.json(board);
}))

columnController.delete('/v1/columns/:id', registeredUserOnly, wrapAsync(async (req, res) => {
  const boardId = ensure(req.params.id, sStructStringMongoId)
  const user = await req.authJWT.getData() as UserSession;
  const board = await ColumnService.deleteColumn(user, boardId)
  res.json(board);
}))