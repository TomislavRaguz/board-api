import { ObjectId } from "bson";
import { APIError, MutationCtx } from "../../lib";
import { UserSession } from "../../singletons/authJWT";
import { Board } from "../board/board.model";
import { Column, IColumnDocument } from "./column.model";

async function deleteColumn(user: UserSession | null, columnId: ObjectId) {
  const columnDoc = await Column.findById(columnId)
  if(!columnDoc) throw APIError({
    code: "UPDATE_COLUMN:NO_COLUMN",
    statusCode: 404
  })
  const originalBoardDoc = await Board.findById(columnDoc.board)
  if(!originalBoardDoc) throw APIError({
    code: "UPDATE_COLUMN:NO_BOARD",
    statusCode: 404
  })
  if(!originalBoardDoc.userHasWriteAccess(user?._id)) throw APIError({
    code: "UDPATE_COLUMN:NO_WRITE_ACCESS",
    statusCode: 403
  })
  const column = columnDoc.toObject({ virtuals: true })
  await Column.findByIdAndDelete(columnId)
  return column;
}

interface ColumnPatchStrategies {
  setRows?: Parameters<typeof setRows>[2]
}
//column.rows
async function updateColumn (user: UserSession | null, columnId: ObjectId, patchStrategy: ColumnPatchStrategies) {
  const columnDoc = await Column.findById(columnId)
  if(!columnDoc) throw APIError({
    code: "UPDATE_COLUMN:NO_COLUMN",
    statusCode: 404
  })
  const originalBoardDoc = await Board.findById(columnDoc.board)
  if(!originalBoardDoc) throw APIError({
    code: "UPDATE_COLUMN:NO_BOARD",
    statusCode: 404
  })
  if(!originalBoardDoc.userHasWriteAccess(user?._id)) throw APIError({
    code: "UDPATE_COLUMN:NO_WRITE_ACCESS",
    statusCode: 403
  })

  /*
  const session = await Column.startSession()  //Disable transaction because mongo needs replica set for it to work
  */
  const ctx = { user, session: null }
  //await session.withTransaction(async () => {
    if(patchStrategy.setRows) setRows(ctx, columnDoc, patchStrategy.setRows)
  //})
  
  await columnDoc.save()
  //await session.endSession();
  return columnDoc.toObject({ virtuals: true })
}

function setRows(ctx: MutationCtx, columnDoc: IColumnDocument, params: { rows: Array<{content: string }> }) {
  columnDoc.rows = params.rows
}

export default {
  updateColumn,
  deleteColumn
}