const mongoose = require("mongoose")
const uniqueValidator = require("mongoose-unique-validator")

const schema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, "Must be provided"],
    unique: true,
    minlength: [3, "Must contain at 3 characters, got {VALUE}"],
  },
  favoriteGenre: {
    type: String,
    required: [true, "is required"]
  }
})

schema.plugin(uniqueValidator)
module.exports = mongoose.model("User", schema)
