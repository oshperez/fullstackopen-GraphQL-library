const mongoose = require("mongoose")
const uniqueValidator = require("mongoose-unique-validator")

const schema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Book title required"],
    unique: true,
    minlength: [2, "Must contain at least 2 characters, got {VALUE}"],
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Author",
  },
  published: {
    type: Number,
  },
  genres: [{ type: String }],
})

schema.plugin(uniqueValidator)

module.exports = mongoose.model("Book", schema)
