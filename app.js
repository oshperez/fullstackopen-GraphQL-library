const { ApolloServer } = require("apollo-server-express")
const {
  ApolloServerPluginLandingPageGraphQLPlayground,
  ApolloServerPluginDrainHttpServer,
} = require("apollo-server-core")
const { execute, subscribe } = require("graphql")
const { makeExecutableSchema } = require("@graphql-tools/schema")
const { SubscriptionServer } = require("subscriptions-transport-ws")
const http = require("http")
const express = require("express")
const jwt = require("jsonwebtoken")
const schema = require("./graphql/schema/schema")

const User = require("./models/user")

module.exports = async function startApolloServer() {
  const app = express()
  const httpServer = http.createServer(app)
  
  const server = new ApolloServer({
    schema,
    context: async ({ req }) => {
      const auth = req ? req.headers.authorization : null

      if (auth && auth.toLowerCase().startsWith("bearer ")) {
        const decodedToken = jwt.verify(
          auth.substring(7),
          process.env.JWT_SECRET
        )
        const currentUser = await User.findById(decodedToken.id)
        return { currentUser }
      }
    },
    plugins: [
      ApolloServerPluginLandingPageGraphQLPlayground({}),
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        async serverWillStart() {
          return {
            async drainServer() {
              subscriptionServer.close()
            },
          }
        },
      },
    ],
  })

  const subscriptionServer = SubscriptionServer.create(
    {
      schema,
      execute,
      subscribe,
    },
    {
      server: httpServer,
      path: "/graphql",
    }
  )

  await server.start()
  server.applyMiddleware({
    app,
    path: "/",
  })

  await new Promise((resolve) =>
    httpServer.listen({ port: process.env.PORT }, resolve)
  )
  console.log(`Server ready at http://localhost:4000${server.graphqlPath}`)
}
