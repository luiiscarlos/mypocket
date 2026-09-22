import { createSchema, createYoga } from "graphql-yoga";
import { createServer } from "node:http";

const schema = createSchema({
  typeDefs: /* GraphQL */ `
    type Query {
      health: String!
    }
  `,
  resolvers: {
    Query: {
      health: () => "ok",
    },
  },
});

const yoga = createYoga({ schema });
const server = createServer(yoga);

const port = Number(process.env.PORT) || 4000;
server.listen(port, () => {
  console.log(`GraphQL Yoga listening on http://localhost:${port}/graphql`);
});
