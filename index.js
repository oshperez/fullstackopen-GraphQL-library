const { ApolloServer, gql } = require("apollo-server")
const {
  ApolloServerPluginLandingPageGraphQLPlayground,
} = require("apollo-server-core")
const { v1: uuid } = require("uuid")
require("dotenv").config()
const mongoose = require("mongoose")
const Author = require("./models/author")
const Book = require("./models/book")

let authors = [
  {
    name: "Robert Martin",
    id: "afa51ab0-344d-11e9-a414-719c6709cf3e",
    born: 1952,
  },
  {
    name: "Martin Fowler",
    id: "afa5b6f0-344d-11e9-a414-719c6709cf3e",
    born: 1963,
  },
  {
    name: "Fyodor Dostoevsky",
    id: "afa5b6f1-344d-11e9-a414-719c6709cf3e",
    born: 1821,
  },
  {
    name: "Joshua Kerievsky", // birthyear not known
    id: "afa5b6f2-344d-11e9-a414-719c6709cf3e",
  },
  {
    name: "Sandi Metz", // birthyear not known
    id: "afa5b6f3-344d-11e9-a414-719c6709cf3e",
  },
]

let books = [
  {
    title: "Clean Code",
    published: 2008,
    author: "Robert Martin",
    id: "afa5b6f4-344d-11e9-a414-719c6709cf3e",
    genres: ["refactoring"],
  },
  {
    title: "Agile software development",
    published: 2002,
    author: "Robert Martin",
    id: "afa5b6f5-344d-11e9-a414-719c6709cf3e",
    genres: ["agile", "patterns", "design"],
  },
  {
    title: "Refactoring, edition 2",
    published: 2018,
    author: "Martin Fowler",
    id: "afa5de00-344d-11e9-a414-719c6709cf3e",
    genres: ["refactoring"],
  },
  {
    title: "Refactoring to patterns",
    published: 2008,
    author: "Joshua Kerievsky",
    id: "afa5de01-344d-11e9-a414-719c6709cf3e",
    genres: ["refactoring", "patterns"],
  },
  {
    title: "Practical Object-Oriented Design, An Agile Primer Using Ruby",
    published: 2012,
    author: "Sandi Metz",
    id: "afa5de02-344d-11e9-a414-719c6709cf3e",
    genres: ["refactoring", "design"],
  },
  {
    title: "Crime and punishment",
    published: 1866,
    author: "Fyodor Dostoevsky",
    id: "afa5de03-344d-11e9-a414-719c6709cf3e",
    genres: ["classic", "crime"],
  },
  {
    title: "The Demon ",
    published: 1872,
    author: "Fyodor Dostoevsky",
    id: "afa5de04-344d-11e9-a414-719c6709cf3e",
    genres: ["classic", "revolution"],
  },
]

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
    allBooks(author: String, genre: String): [Book!]
    allAuthors: [Author!]
  }

  type Mutation {
    addBook(bookObj: BookInput!): Book
    editAuthor(name: String!, setBornTo: Int!): Author
  }
`
const resolvers = {
  Query: {
    bookCount: () => Book.collection.countDocuments(),
    authorCount: () => Author.collection.countDocuments(),
    allBooks: async (_, args) => {
      const books = await Book.find({}).populate("author")
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
        const author = new Author({ name: bookObj.author, born: null })
        authorInDB = await author.save()
      }

      const book = new Book({ ...bookObj, author: authorInDB._id })
      const savedBook = await book.save()

      return Book.findById(savedBook._id).populate("author")
    },
    editAuthor: (_, args) => {
      targetAuthor = authors.find((author) => author.name === args.name)
      if (!targetAuthor) return null
      const editedAuthor = { ...targetAuthor, born: args.setBornTo }
      authors = authors.map((author) =>
        author.name === targetAuthor.name ? editedAuthor : author
      )
      return editedAuthor
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
