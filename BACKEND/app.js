const express = require('express')
const app = express();
// const port = 3000;
// const mongoose = require('mongoose');
// const { MONGO_URI } = require('./config/keys');
// const userRoutes = require('./routes/userRoutes');
const dotenv = require('dotenv');
dotenv.config();
const cors = require('cors');
app.use(cors());


app.get('/', (req,res)=>{
    res.send('Hello world');
})

module.exports = app;