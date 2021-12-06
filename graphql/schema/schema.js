const { gql } = require("apollo-server-express")
const { makeExecutableSchema } = require("@graphql-tools/schema")
const { merge } = require("lodash")

const { Book, bookResolvers } = require("./book")
const { Author, authorResolvers } = require("./author")
const { User, userResolvers } = require("./user")

const Query = gql`
  type Query {
    _empty: String
  }
`

const Mutation = gql`
  type Mutation {
    _empty: String
  }
`
const Subscription = gql`
  type Subscription {
    _empty: String
  }
`

const resolvers = {}

module.exports = makeExecutableSchema({
  typeDefs: [Query, Mutation, Subscription, Book, Author, User],
  resolvers: merge(resolvers, bookResolvers, authorResolvers, userResolvers),
})
