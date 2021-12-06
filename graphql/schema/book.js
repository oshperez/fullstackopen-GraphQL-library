const { gql, UserInputError } = require("apollo-server-express")
const { PubSub } = require("graphql-subscriptions")

const Author = require("../../models/author")
const Book = require("../../models/book")

const pubsub = new PubSub()

const typeDef = gql`
  type Book {
    title: String!
    author: Author!
    published: Int!
    genres: [String!]!
    id: ID!
  }

  input BookInput {
    title: String!
    author: String!
    published: Int!
    genres: [String!]!
  }

  extend type Query {
    bookCount: Int
    allBooks(author: String, genres: [String]): [Book!]
  }

  extend type Mutation {
    addBook(bookObj: BookInput!): Book
  }

  extend type Subscription {
    bookAdded: Book
  }
`

const bookResolvers = {
  Query: {
    bookCount: () => Book.collection.countDocuments(),
    allBooks: async (_, args) => {
      const { author, genres } = args
      let query = {}

      if (author) {
        const authorInDB = await Author.findOne({ name: author })
        if (authorInDB) {
          query["author"] = authorInDB._id
        }
      }

      if (genres?.length > 0) {
        query["genres"] = { $in: genres }
      }

      const books = await Book.find(query).populate("author")
      return books
    },
  },
  Mutation: {
    addBook: async (_, args, context) => {
      const { bookObj } = args
      const { currentUser } = context

      // Check user's authentication
      if (!currentUser) {
        throw new UserInputError("user not authenticated")
      }

      // Find author in the database
      let authorInDB = await Author.findOne({ name: bookObj.author })

      // If there is not author with that name, create one and save it to the database
      if (!authorInDB) {
        const author = new Author({ name: bookObj.author })
        try {
          authorInDB = await author.save()
        } catch (error) {
          return new UserInputError(error.message, { args })
        }
      }

      // Create new book
      const book = new Book({ ...bookObj, author: authorInDB._id })

      // Add new book id to its author in the database
      await Author.findByIdAndUpdate(
        { _id: authorInDB._id },
        { books: authorInDB.books.concat(book._id) }
      )

      // Save the new book to the database
      try {
        const savedBook = await book.save()

        // Find the newly-created book and populate its field author
        const bookAdded = await Book.findById(savedBook._id).populate("author")

        // Publish event
        pubsub.publish("BOOK_ADDED", { bookAdded })

        return bookAdded
      } catch (error) {
        return new UserInputError(error.message, { args })
      }
    },
  },
  Subscription: {
    bookAdded: {
      subscribe: () => pubsub.asyncIterator(["BOOK_ADDED"]),
    },
  },
}

module.exports = { Book: typeDef, bookResolvers }
