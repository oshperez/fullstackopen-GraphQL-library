const mongoose = require("mongoose")
const uniqueValidator = require("mongoose-unique-validator")

const schema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Author name required"],
    unique: true,
    minlength: [4, "Must contain at least 4 characters, got {VALUE}"],
  },
  books: [{ type: mongoose.Schema.Types.ObjectId, ref: "Book" }],
  born: {
    type: Number,
  },
})

schema.plugin(uniqueValidator)

module.exports = mongoose.model("Author", schema)
