import cors from 'cors';
import express from "express";
import cookieParser from "cookie-parser";

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true,
}));

// limiting json data to 16kb only 
app.use(express.json({ limit: '16kb' }));
// encoded the url prameters
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
// will add assets to public 
app.use(express.static('public'))
// to recieve cookies
app.use(cookieParser())

export { app };