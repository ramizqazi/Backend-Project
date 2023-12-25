import dotenv from 'dotenv';
import connectDb from './db/index.js';
import { app } from './App.js';

dotenv.config({ path: './.env' })

connectDb()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is running at port: ${process.env.PORT}`)
    })
  })
  .catch((err) => {
    console.log('MONGO db connection failed !!!', err)
  });
