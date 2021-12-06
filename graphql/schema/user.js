const { gql, UserInputError } = require("apollo-server-express")
const jwt = require("jsonwebtoken")

const User = require("../../models/user")

const typeDef = gql`
  type User {
    username: String!
    favoriteGenre: String!
    id: ID!
  }
  input UserInput {
    username: String!
    favoriteGenre: String!
  }

  input CredentialsInput {
    username: String!
    password: String!
  }

  type Token {
    value: String!
  }

  extend type Query {
    loggedinUser: User
  }

  extend type Mutation {
    createUser(user: UserInput!): User
    login(credentials: CredentialsInput!): Token
  }
`

const userResolvers = {
  Query: {
    loggedinUser: (_, __, context) => context.currentUser,
  },
  Mutation: {
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
module.exports = { User: typeDef, userResolvers }
