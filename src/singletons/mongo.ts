import mongoose from 'mongoose';

const { MONGO_CONNECTION_STRING } = process.env;

if(!MONGO_CONNECTION_STRING) throw Error('Required env variable MONGO_CONNECTION_STRING not defined. Please check .env file')

export async function mongooseConnect () {
  try {
    await mongoose.connect(MONGO_CONNECTION_STRING as string, {
      dbName: 'collab',
      serverSelectionTimeoutMS: 5000
    })
    mongoose.connection.on('error', console.error.bind(console, 'MongoDB connection error:'));
    const res = await mongoose.connection.db.admin().ping()
    if(!res.ok) {
      throw Error('Mongo connection err')
    }
  } catch(e) {
    console.log(e)
    throw e
  }
}