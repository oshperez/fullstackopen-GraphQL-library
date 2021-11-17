const { ApolloServer, UserInputError, gql } = require("apollo-server")
const {
  ApolloServerPluginLandingPageGraphQLPlayground,
} = require("apollo-server-core")
const { v1: uuid } = require("uuid")
require("dotenv").config()
const mongoose = require("mongoose")
const Author = require("./models/author")
const Book = require("./models/book")

console.log("Conntecting to", process.env.MONGODB_URI)

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB")
  })
  .catch((error) => {
    console.log("failed to connect to MongoDB", error.message)
  })

const typeDefs = gql`
  type Book {
    title: String!
    author: Author!
    published: Int!
    genres: [String!]!
    id: ID!
  }

  type Author {
    name: String!
    bookCount: Int
    born: Int
  }

  input BookInput {
    title: String!
    author: String!
    published: Int!
    genres: [String!]!
  }

  type Query {
    bookCount: Int
    authorCount: Int
    allBooks(author: String, genres: [String]): [Book!]
    allAuthors: [Author!]
  }

  type Mutation {
    addBook(bookObj: BookInput!): Book
    editAuthor(name: String!, setBornTo: Int!): Author
  }
`
const resolvers = {
  Author: {
    bookCount: async ({ name }) => {
      const { books } = await Author.findOne({ name }, { _id: 0, books: 1 })
      return books.length
    },
  },
  Query: {
    bookCount: () => Book.collection.countDocuments(),
    authorCount: () => Author.collection.countDocuments(),
    allBooks: async (_, args) => {
      const { author, genres } = args
      let query = {}

      if (author) {
        const authorInDB = await Author.findOne({ name: author })
        if (authorInDB) {
          query["author"] = authorInDB._id
        }
      }

      if (genres.length > 0) {
        query["genres"] = { $in: genres }
      }

      const books = await Book.find(query).populate("author")
      return books
    },
    allAuthors: async () => {
      const authors = await Author.find({})
      return authors
    },
  },

  Mutation: {
    addBook: async (_, { bookObj }) => {
      let authorInDB = await Author.findOne({ name: bookObj.author })

      if (!authorInDB) {
        const author = new Author({ name: bookObj.author })
        authorInDB = await author.save()
      }

      const book = new Book({ ...bookObj, author: authorInDB._id })
      await Author.findByIdAndUpdate(
        { _id: authorInDB._id },
        { books: authorInDB.books.concat(book._id) }
      )
      const savedBook = await book.save()

      return Book.findById(savedBook._id).populate("author")
    },
    editAuthor: async (_, args) => {
      const { name, setBornTo: born } = args
      try {
        const updatedUser = await Author.findOneAndUpdate(
          { name },
          { $set: { born } },
          { new: true }
        )
        if (!updatedUser) {
          throw new UserInputError("Author does not exist")
        }
        return updatedUser
      } catch (error) {
        throw new UserInputError(error.message, {
          args,
        })
      }
    },
  },
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [ApolloServerPluginLandingPageGraphQLPlayground({})],
})

server.listen().then(({ url }) => {
  console.log(`Server ready at ${url}`)
})
