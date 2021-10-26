import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { User } from '../segments/user/user.model';
import { ObjectId } from 'bson';

export async function mongooseTestConnect() {
  const mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri(), { 
    dbName: "verifyMASTER" 
  });
  await seedMongo()
  return () => {
    mongoServer.stop()
    mongoose.disconnect()
  }
}

export const fixtures = {
  users: [
    {
      _id: new ObjectId("617481bbee031be4f76b41d9"),
      email: "marina.basic@gmail.com",
      passwordHash: "$2b$08$jQAsaXOe.OgKeJf.X3Uufeo0Xz3bdGJ3Jv7axWlzFVydLYRThOULm"
    }, {
      _id: new ObjectId("61770938f79afdfcae018221"),
      email:"tomislav.raguz@outlook.com",
      passwordHash:"$2b$08$k1FXDskYxvpnsiQWPSbPTOFh67SMIhfIdnvi3zxgTY6BuzdvzX/3O"
    }
  ]
}

async function seedMongo() {
  await User.safeCreate(fixtures.users)
}