const { ApolloServer, gql } = require("apollo-server")
const {
  ApolloServerPluginLandingPageGraphQLPlayground,
} = require("apollo-server-core")
const { v1: uuid } = require("uuid")

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

const typeDefs = gql`
  type Book {
    title: String!
    published: Int!
    author: String!
    id: ID!
    genres: [String!]!
  }

  type Author {
    name: String!
    bookCount: Int
    born: String
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
    addBook(book: BookInput): Book
    editAuthor(name: String!, setBornTo: Int!): Author
  }
`
const resolvers = {
  Query: {
    bookCount: () => books.length,
    authorCount: () => {
      return authors.length
    },
    allBooks: (_, args) => {
      let booksCopy = [...books]

      if (args.author) {
        booksCopy = booksCopy.filter((book) => book.author === args.author)
      }

      if (args.genre) {
        booksCopy = booksCopy.filter((book) => book.genres.includes(args.genre))
      }
      return booksCopy
    },
    allAuthors: () => {
      return authors.map((author) => {
        let bookCount = 0
        books.forEach((book) => {
          if (book.author === author.name) {
            bookCount++
          }
        })
        return { ...author, bookCount }
      })
    },
  },

  Mutation: {
    addBook: (_, args) => {
      const { book } = args
      let author = authors.find((author) => author.name === book.author)

      if (!author) {
        author = { name: book.author, born: null, id: uuid() }
        authors = authors.concat(author)
      }

      const newBook = { ...book, id: author.id }
      books = books.concat(newBook)
      return newBook
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
