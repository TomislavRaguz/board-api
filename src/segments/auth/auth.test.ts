import { mongooseTestConnect } from "../../singletons/mongoTest";
/*
check out board.test.ts to see testing
dont feel like testing everything in a test app
*/
describe('authService', () => {
  let dbCleanup: any;
  beforeAll(async () => {
    dbCleanup = await mongooseTestConnect()
  });
  
  afterAll(async () => {
    dbCleanup()
  });

  it('local login', async () => {

  })
  it('local signup', async () => {

  })
})