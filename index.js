const { ApolloServer, UserInputError, gql } = require("apollo-server")
const {
  ApolloServerPluginLandingPageGraphQLPlayground,
} = require("apollo-server-core")
const { v1: uuid } = require("uuid")
require("dotenv").config()
const jwt = require("jsonwebtoken")
const mongoose = require("mongoose")
const Author = require("./models/author")
const Book = require("./models/book")
const User = require("./models/user")

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

  type User {
    username: String!
    favoriteGenre: String!
    id: ID!
  }

  type Token {
    value: String!
  }

  input BookInput {
    title: String!
    author: String!
    published: Int!
    genres: [String!]!
  }

  input UserInput {
    username: String!
    favoriteGenre: String!
  }

  input CredentialsInput {
    username: String!
    password: String!
  }

  type Query {
    bookCount: Int
    authorCount: Int
    allBooks(author: String, genres: [String]): [Book!]
    allAuthors: [Author!]
    loggedinUser: User
  }

  type Mutation {
    addBook(bookObj: BookInput!): Book
    editAuthor(name: String!, setBornTo: Int!): Author
    createUser(user: UserInput!): User
    login(credentials: CredentialsInput!): Token
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

      if (genres?.length > 0) {
        query["genres"] = { $in: genres }
      }

      const books = await Book.find(query).populate("author")
      return books
    },
    allAuthors: async () => {
      const authors = await Author.find({})
      return authors
    },
    loggedinUser: (_, __, context) => context.currentUser,
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

        // Find the newly-created book, populate its field author and return it
        return Book.findById(savedBook._id).populate("author")
      } catch (error) {
        return new UserInputError(error.message, { args })
      }
    },
    editAuthor: async (_, args, context) => {
      const { name, setBornTo: born } = args
      const { currentUser } = context

      if (!currentUser) {
        throw new UserInputError("user not authenticated")
      }

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
    createUser: async (_, { user }) => {
      const { username, favoriteGenre } = user
      const newUser = new User({ username, favoriteGenre })
      try {
        return newUser.save()
      } catch (error) {
        return new UserInputError(error.message, { user })
      }
    },
    login: async (_, { credentials }) => {
      const { username, password } = credentials
      const user = await User.findOne({ username })

      if (!user || password !== "c") {
        throw new UserInputError("Wrong credentials", {
          invalidArgs: credentials,
        })
      }
      const userToBeSigned = { username: user.username, id: user._id }
      const token = jwt.sign(userToBeSigned, process.env.JWT_SECRET)
      return { value: token }
    },
  },
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({ req }) => {
    const auth = req ? req.headers.authorization : null

    if (auth && auth.toLowerCase().startsWith("bearer ")) {
      const decodedToken = jwt.verify(auth.substring(7), process.env.JWT_SECRET)
      const currentUser = await User.findById(decodedToken.id)
      return { currentUser }
    }
  },
  plugins: [ApolloServerPluginLandingPageGraphQLPlayground({})],
})

server.listen().then(({ url }) => {
  console.log(`Server ready at ${url}`)
})
