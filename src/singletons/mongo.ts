import mongoose from 'mongoose';

export async function mongooseConnect () {
  try {
    await mongoose.connect('mongodb://localhost:27017', {
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