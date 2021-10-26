import { mongooseTestConnect } from "../../singletons/mongoTest";
/*
check out board.test.ts to see testing
dont feel like testing everything in a test app lol
*/
describe('columnService', () => {
  let dbCleanup: any;
  beforeAll(async () => {
    dbCleanup = await mongooseTestConnect()
  });
  
  afterAll(async () => {
    dbCleanup()
  });

  it('expose column', async () => {

  })
  it('expose column list', async () => {

  })
})