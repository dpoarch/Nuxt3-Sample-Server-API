import { ApolloServer, gql } from 'apollo-server-fastify';
import { ApolloServerPluginDrainHttpServer } from 'apollo-server-core';
import { ApolloServerPlugin } from 'apollo-server-plugin-base';
import fastify, { FastifyInstance } from 'fastify';
import type { IncomingMessage, ServerResponse } from 'http';

const typeDefs = gql`
  type Book {
    title: String
    author: String
  }


  type Query {
    books: [Book]
  }
`;

const books = [
  {
    title: 'The Awakening',
    author: 'Kate Chopin',
  },
  {
    title: 'City of Glass',
    author: 'Paul Auster',
  },
];

const resolvers = {
  Query: {
    books: () => books,
  },
};

function fastifyAppClosePlugin(app: FastifyInstance): ApolloServerPlugin {
  return {
    async serverWillStart() {
      return {
        async drainServer() {
          await app.close();
        },
      };
    },
  };
}

export default async ( req: IncomingMessage, res: ServerResponse ) => {
    const app = fastify({
      logger: true,
    });
    const server = new ApolloServer({
        typeDefs,
        resolvers,
        plugins: [
        fastifyAppClosePlugin(app),
        ApolloServerPluginDrainHttpServer({ httpServer: app.server }),
        ],
    });
    await server.start();
    app.register(server.createHandler({
      path: '/'
    }));
    await app.ready();
    app.server.emit('request', req, res);
} 