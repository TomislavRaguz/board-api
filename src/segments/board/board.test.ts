import { fixtures, mongooseTestConnect } from '../../singletons/mongoTest'
import boardService from './board.service';

describe('boardService', () => {
  let dbCleanup: any;
  beforeAll(async () => {
    dbCleanup = await mongooseTestConnect()
  });
  
  afterAll(async () => {
    dbCleanup()
  });

  it('createBoard', async () => {
    const [user1] = fixtures.users
    const publicBoard = await boardService.createBoard(user1, {
      title: "test public board", 
      publicRead: true, 
      publicWrite: true
    })
    
    expect(publicBoard)
    .toMatchObject({
      title: 'test public board',
      publicRead: true,
      publicWrite: true,
      adminAccessUsers: [ user1._id ],
      readAccessUsers: [],
      columns: []
    })
    expect(publicBoard).toHaveProperty('ID')
  });

  it('deleteBoard', async () => {
    const [user1, user2] = fixtures.users;

    const board = await boardService.createBoard(user1, {
      title: "test public board", 
      publicRead: true, 
      publicWrite: true
    })

    await expect(
      boardService.deleteBoard(user2, board._id)
    ).rejects.toMatchObject({ statusCode: 403 })
    
    const deletedBoard = await boardService.deleteBoard(user1, board._id)
    expect(deletedBoard)
      .toHaveProperty('_id', deletedBoard._id)

    await expect(
      boardService.exposeOne(user1, deletedBoard._id, {})
    ).rejects.toMatchObject({
      type: 'API_ERROR', 
      code: 'GET_ONE:BOARD:404', 
      statusCode: 404
    })
    
  })

  it('patchStrategies', async () => {
    const [user1, user2] = fixtures.users;

    const board = await boardService.createBoard(user1, {
      title: "test public board", 
      publicRead: true, 
      publicWrite: true
    })

    let boardDoc = await boardService.updateBoard(user1, board._id, {
      addUser: { userEmail: user2.email, isAdmin: true }
    })

    expect(boardDoc.adminAccessUsers.length)
      .toBe(2)
    expect(boardDoc.adminAccessUsers[1].equals(user2._id))
      .toBe(true)

    boardDoc = await boardService.updateBoard(user1, board._id, {
      removeUser: { userId: user1._id }
    })
    
    expect(boardDoc.adminAccessUsers.length)
      .toBe(1)
    expect(boardDoc.adminAccessUsers[0].equals(user2._id))
      .toBe(true)

    await expect(
      boardService.updateBoard(user1, board._id, {
        assign: { publicWrite: false }
      })
    ).rejects.toMatchObject({
      statusCode: 403,
      code: "UPDATE_BOARD:NO_ADMIN_ACCESS"
    })

    boardDoc = await boardService.updateBoard(user2, board._id, {
      assign: { publicWrite: false }
    })

    expect(boardDoc.publicWrite)
      .toBe(false)

    boardDoc = await boardService.updateBoard(user2, board._id, {
      addUser: { userEmail: user1.email, isAdmin: false }
    })
    
    expect(boardDoc.readAccessUsers.length)
      .toBe(1)
    
    expect(boardDoc.readAccessUsers[0].equals(user1._id))
      .toBe(true)

    boardDoc = await boardService.updateBoard(user2, board._id, {
      createColumn: { title: "column1" }
    })

    expect(boardDoc.columns!.length)
      .toBe(1)

    boardDoc = await boardService.updateBoard(user2, board._id, {
      createColumn: { title: "column2" }
    })

    expect(boardDoc.columns!.length)
      .toBe(2)

    boardDoc = await boardService.updateBoard(user2, board._id, {
      removeColumn: { columnId: boardDoc.columns![0] }
    })

    const exposedBoard = await boardService.exposeOne(user1, board._id, {})
    expect(exposedBoard).toMatchObject({
      title: 'test public board',
      publicRead: true,
      publicWrite: false,
      columns: [
        {
          title: 'column2',
          rows: []
        }
      ]
    })
    
    expect(exposedBoard.adminAccessUsers.length).toBe(1)
    expect(exposedBoard.adminAccessUsers[0].equals(user2._id)).toBe(true)
    expect(exposedBoard.readAccessUsers.length).toBe(1)
    expect(exposedBoard.readAccessUsers[0].equals(user1._id)).toBe(true)
  })
});