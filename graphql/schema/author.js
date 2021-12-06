const { gql, UserInputError } = require("apollo-server-express")

const Author = require("../../models/author")

const typeDef = gql`
  type Author {
    name: String!
    books: [Book!]!
    bookCount: Int
    born: Int
    id: ID!
  }

  extend type Query {
    authorCount: Int
    allAuthors: [Author!]
  }

  extend type Mutation {
    editAuthor(name: String!, setBornTo: Int!): Author
  }
`
const authorResolvers = {
  Author: {
    bookCount: async ({ books }) => {
      return books.length
    },
  },
  Query: {
    authorCount: () => Author.collection.countDocuments(),
    allAuthors: async () => {
      const authors = await Author.find({}).populate("books")
      return authors
    },
  },
  Mutation: {
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
  },
}

module.exports = { Author: typeDef, authorResolvers }
