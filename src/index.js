import dotenv from 'dotenv';
import mongoose from 'mongoose';

import { app } from './App.js';

dotenv.config({ path: './.env' })

mongoose.connect(`${process.env.MONGODB_URI}/test`)
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is running at port: ${process.env.PORT}`)
    })
  })
  .catch((err) => {
    console.log('MONGO db connection failed !!!', err)
  });
