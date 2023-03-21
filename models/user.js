const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const passportlocalmongoose = require("passport-local-mongoose");

// creating and exporting user schema with mongoose:

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true
  }
});

// First you need to plugin "passport-local-mongoose" into your User schema.

// With help of "passport-local-mongoose" npm package,
// You're free to define your User how you like.
// passport-local-mongoose will add a username, hash and salt field to store the username, the hashed password and the salt value.
// Passport hides all the implementation details from you and that is why its very convenient.
// Additionally passport-local-mongoose adds some methods to your Schema.
// See the API Documentation section for more details.

// npm docs: https://www.npmjs.com/package/passport-local-mongoose
// API docs: https://github.com/saintedlama/passport-local-mongoose#api-documentation

userSchema.plugin(passportlocalmongoose);

// exporting schema:
module.exports = mongoose.model("User", userSchema);
