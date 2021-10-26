import { ObjectId } from "bson";
import { Board, IBoard, IBoardDocument } from "./board.model";
import { UserSession } from "../../singletons/authJWT";
import { ClientSession } from "mongoose/node_modules/mongodb";
import { MutationCtx, APIError, createCollectionExposer } from "../../lib";
import { Column } from "../column/column.model";
import { _AllowStringsForIds } from "mongoose";
import { User } from "../user/user.model";
import { assign } from "superstruct";

const { exposeListBase, exposeOneBase } = createCollectionExposer({
  EnhancedModel: Board,
  limit: { max: 50, default: 10 },
  allowedSelectSets: ['default']
})
const { exposeListBase: exposeListAdmin, exposeOneBase: exposeOneAdmin } = createCollectionExposer({
  EnhancedModel: Board,
  limit: { max: 50, default: 10 },
  allowedSelectSets: ['default', 'admin']
})

const exposeList = (user: UserSession | null, queryParams: { private?: boolean, limit?: string, [key:string]: any }) => {
  if(queryParams.private) {
    if(!user) {
      throw APIError({
        statusCode: 401,
        code: "PRIVATE_BOARDS:NOT_LOGGED_IN"
      })
    }
    return exposeListAdmin(queryParams, { queryCb: query => query.where({
      $or: [{ adminAccessUser: user._id }, { readAccessUser: user._id }]
    }) })
  } else {
    return exposeListBase(queryParams, { queryCb: query => query.where({ publicRead: true }) })
  }
}
const exposeOne = async (user: UserSession | null, id: ObjectId, queryParams: any) => {
  //TODO: exposure system
  let board;
  if(queryParams.private) {
    board = await exposeOneAdmin(id, queryParams, { returnDocuments: true })
  } else {
    board = await exposeOneBase(id, queryParams, { returnDocuments: true })
  }
  if(!board.userHasReadAccess(user?._id)) {
    throw APIError({
      statusCode: user ? 403 : 401,
      code: "No read access to board"
    })
  }
  return board.toObject({ virtuals: true });
}

export async function createBoard(user: UserSession | null, params: Omit<IBoard, "adminAccessUsers" | "readAccessUsers">) {
  if(!user) throw APIError({
    code: "createBoard:noUser",
    statusCode: 401
  })
  const boardDoc = await Board.safeCreate({ ...params, adminAccessUsers: [user._id], readAccessUsers: [] })
  return boardDoc.toObject({ virtuals: true })
}

interface patchStrategies {
  assign?: Parameters<typeof assignProperties>[2]
  addUser?: Parameters<typeof addUser>[2]
  removeUser?: Parameters<typeof removeUser>[2]
  createColumn?: Parameters<typeof createColumn>[2]
  removeColumn?: Parameters<typeof removeColumn>[2]
  linkColumn?: Parameters<typeof linkColumn>[2]
}

export async function updateBoard(user: UserSession | null, boardId: ObjectId, patchStrategy: patchStrategies) {
  const boardDoc = await Board.findById(boardId)
  if(!boardDoc) throw APIError({ 
    statusCode: 404,
    code: "UPDATE_BOARD:NO_BOARD",
    userMessage: "Cannot find the requested board."
  })
  if(!boardDoc.userHasWriteAccess(user?._id)) throw APIError({
    statusCode: 403,
    code: "UPDATE_BOARD: NO_WRITE_ACCESS",
    userMessage: `You dont have write access for board ${boardId}`
  })
  if(patchStrategy.assign || patchStrategy.addUser || patchStrategy.removeUser) {
    if(!boardDoc.isAdmin(user?._id)) throw APIError({
      statusCode: 403,
      code: "UPDATE_BOARD:NO_ADMIN_ACCESS",
      userMessage: `You dont have admin access for board ${boardId}`
    })
  }

  /*
  const session = await Board.startSession() //Disable transaction because mongo needs replica set for it to work
  */
  const ctx = { user, session: null }
  //await session.withTransaction(async () => {
    if(patchStrategy.assign) await assignProperties(ctx, boardDoc, patchStrategy.assign)
    if(patchStrategy.addUser) await addUser(ctx, boardDoc, patchStrategy.addUser)
    if(patchStrategy.removeUser) await removeUser(ctx, boardDoc, patchStrategy.removeUser)

    if(patchStrategy.createColumn) await createColumn(ctx, boardDoc, patchStrategy.createColumn)
    if(patchStrategy.removeColumn) await removeColumn(ctx, boardDoc, patchStrategy.removeColumn)
    if(patchStrategy.linkColumn) await linkColumn(ctx, boardDoc, patchStrategy.linkColumn)
  //})
  
  await boardDoc.save()
  //await session.endSession();
  return boardDoc//.toObject({ virtuals: true })
}

async function deleteBoard(user: UserSession | null, boardId: ObjectId) {
  const boardDoc = await Board.findById(boardId)
  if(!boardDoc) throw APIError({ 
    statusCode: 404,
    code: "UPDATE_BOARD:NO_BOARD",
    userMessage: "Cannot find the requested board."
  })
  if(!boardDoc.isAdmin(user?._id)) throw APIError({
    statusCode: 403,
    code: "UPDATE_BOARD:NOT_ADMIN",
    userMessage: `You dont have write access for board ${boardId}`
  })
  const board = boardDoc.toObject({ virtuals: true })
  await Board.findByIdAndDelete(boardId)
  return board;
}

async function assignProperties(ctx: MutationCtx, boardDoc: IBoardDocument, params: { publicRead?: boolean, publicWrite?: boolean }) {
  Object.assign(boardDoc, params)
}

async function addUser(ctx: MutationCtx, boardDoc: IBoardDocument, params: { userEmail: string, isAdmin: boolean }) {
  const userDoc = await User.findOne({ email: params.userEmail })
  if(!userDoc) throw APIError({ 
    statusCode: 404,
    code: "ADD_USER:NO_USER_WITH_MAIL"
  })
  if(params.isAdmin) {
    boardDoc.adminAccessUsers.push(userDoc._id)
  } else {
    if(boardDoc.readAccessUsers) {
      boardDoc.readAccessUsers.push(userDoc._id)
    } else {
      boardDoc.readAccessUsers = [userDoc._id]
    }
    
  }  
}
function removeUser(ctx: MutationCtx, boardDoc: IBoardDocument, params: { userId: ObjectId }) {
  boardDoc.adminAccessUsers = boardDoc.adminAccessUsers.filter(userIdI => !userIdI.equals(params.userId))
  boardDoc.readAccessUsers = boardDoc.readAccessUsers.filter(userIdI => !userIdI.equals(params.userId))
}
async function createColumn(ctx: MutationCtx, boardDoc: IBoardDocument, params: { title: string }) {
  const columnDoc = await Column.safeCreate({ title: params.title, board: boardDoc._id, rows: [] }, { session: ctx.session })
  const columnId = columnDoc._id;
  if(boardDoc.columns) {
    boardDoc.columns.push(columnId)
  } else {
    boardDoc.columns = [columnId]
  }
}
function removeColumn(ctx: MutationCtx, boardDoc: IBoardDocument, params: { columnId: ObjectId }) {
  if(!boardDoc.columns) throw APIError({
    statusCode: 400,
    code: "REMOVE_COLUMN:NO_COLUMNS",
    userMessage: "Board has no columns to remove"
  })
  boardDoc.columns = boardDoc.columns.filter(column => !column.equals(params.columnId));
}
async function linkColumn(ctx: MutationCtx, boardDoc: IBoardDocument, params: { columnId: ObjectId }) {
  const { columnId } = params;
  const columnDoc = await Column.findById(columnId).populate('board')
  if(!columnDoc) throw APIError({
    statusCode: 404,
    code: "LINK_COLUMN:COLUMN_NOT_FOUND"
  })
  //@ts-ignore
  if(!columnDoc.board.userHasWriteAccess(ctx.user?._id)) throw APIError({
    statusCode: 403,
    code: "UPDATE_BOARD:NO_WRITE_ACCESS"
  })
  if (!boardDoc.columns) {
    boardDoc.columns = [columnId]
  } else {
    boardDoc.columns.push(columnId)
  }
  
}

export default {
  exposeList,
  exposeOne,
  createBoard,
  updateBoard,
  deleteBoard
}
