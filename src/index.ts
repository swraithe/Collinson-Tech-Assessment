import { createSchema, createYoga } from "graphql-yoga";
import { loadConfig } from "./config.js";
import { resolvers, typeDefs } from "./graphql/schema.js";
import { logger } from "./observability/logger.js";

const config = loadConfig();

const schema = createSchema({ typeDefs, resolvers });

export const yoga = createYoga({
  schema,
  graphqlEndpoint: "/graphql",
  landingPage: true,
  logging: {
    debug: (...args) => logger.debug(args),
    info: (...args) => logger.info(args),
    warn: (...args) => logger.warn(args),
    error: (...args) => logger.error(args),
  },
});

async function main() {
  const { createServer } = await import("node:http");
  const server = createServer(yoga);

  server.listen(config.PORT, () => {
    logger.info(`GraphQL server ready at http://localhost:${config.PORT}/graphql`);
  });
}

main().catch((err) => {
  logger.error(err, "Failed to start server");
  process.exit(1);
});
