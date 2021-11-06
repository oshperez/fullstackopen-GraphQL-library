const { ApolloServer, gql } = require("apollo-server")
const {
  ApolloServerPluginLandingPageGraphQLPlayground,
} = require("apollo-server-core")

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
    bookCount: Int!
  }

  type Query {
    bookCount: Int
    authorCount: Int
    allBooks(author: String): [Book!]
    allAuthors: [Author!]
  }
`
const resolvers = {
  Query: {
    bookCount: () => books.length,
    authorCount: () => {
      const authors = books
        .map((book) => book.author)
        .reduce((prevAuthors, currentAuthor) => {
          let noDuplicateAuthors
          if (prevAuthors.indexOf(currentAuthor) === -1) {
            noDuplicateAuthors = prevAuthors.concat(currentAuthor)
          } else {
            noDuplicateAuthors = [...prevAuthors]
          }
          return noDuplicateAuthors
        }, [])

      return authors.length
    },
    allBooks: (_, args) => {
      if(!args.author) {
        return books
      }
      return books.filter(book => book.author === args.author)
    },
    allAuthors: () => {
      return books
        .map((book) => book.author)
        .reduce((allAuthors, currentAuthor) => {
          let duplicatedAuthor = allAuthors.find(
            (author) => author.name === currentAuthor
          )
          if (duplicatedAuthor) {
            allAuthors = allAuthors.map((author) =>
              author.name === duplicatedAuthor.name
                ? {
                    ...duplicatedAuthor,
                    bookCount: (duplicatedAuthor.bookCount += 1),
                  }
                : author
            )
          } else {
            allAuthors = [...allAuthors, { name: currentAuthor, bookCount: 1 }]
          }
          return allAuthors
        }, [])
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
