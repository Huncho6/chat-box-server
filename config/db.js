const dotenv = require("dotenv"); //importing dotenv after installation
const mongoose = require("mongoose"); //importing mongoose
dotenv.config(); //importing dotenv because that where our connection string from mongoose is

mongoose.connect(process.env.MONGODB_CONNECTION_STRING); //importing and connecting to mongoose from .env file
const db = mongoose.connection;

module.exports = db;
