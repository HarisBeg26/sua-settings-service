const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const { GraphQLScalarType, Kind } = require('graphql');

const app = express();
const port = process.env.PORT || 3001;

// In-memory store for settings
let userSettings = {
  languageSettings: {
    language: 'en',
  },
  notificationSettings: {
    sms_notifications: true,
    email_notifications: false,
  },
  theme: 'light',
  lastUpdated: new Date()
};

// -- GraphQL Setup --

// Custom Scalar for Date
const dateScalar = new GraphQLScalarType({
    name: 'Date',
    description: 'Date custom scalar type',
    serialize(value) { // value sent to the client
        if (value instanceof Date) {
            return value.toISOString();
        }
        throw Error('GraphQL Date Scalar serializer expected a `Date` object');
    },
    parseValue(value) { // value from the client
        if (typeof value === 'string') {
            return new Date(value);
        }
        throw new Error('GraphQL Date Scalar parser expected a `string`');
    },
    parseLiteral(ast) {
        if (ast.kind === Kind.STRING) {
            return new Date(ast.value);
        }
        return null;
    },
});

// GraphQL Schema Definition
const typeDefs = `#graphql
  scalar Date

  type LanguageSettings {
    language: String
  }

  type NotificationSettings {
    sms_notifications: Boolean
    email_notifications: Boolean
  }

  type UserSettings {
    languageSettings: LanguageSettings
    notificationSettings: NotificationSettings
    theme: String
    lastUpdated: Date
  }

  type Query {
    settings: UserSettings
    theme: String
  }
`;

// GraphQL Resolvers
const resolvers = {
    Date: dateScalar,
    Query: {
        settings: () => userSettings,
        theme: () => userSettings.theme,
    },
};

const server = new ApolloServer({
    typeDefs,
    resolvers,
});

// We must call `start()` on the ApolloServer instance before passing it to `expressMiddleware`
server.start().then(() => {
    app.use(cors());
    // We are using separate body parsers for REST and GraphQL
    // REST routes will use the standard body parser
    app.use('/settings', bodyParser.json());

    // GraphQL endpoint
    app.use('/graphql', cors(), bodyParser.json(), expressMiddleware(server));

    // -- REST API Endpoints --

    // GET endpoint to retrieve all settings
    app.get('/settings', (req, res) => {
        res.json(userSettings);
    });

    // POST endpoint to update settings
    app.post('/settings', (req, res) => {
        const { languageSettings, notificationSettings, theme } = req.body;

        if (languageSettings) {
            userSettings.languageSettings = { ...userSettings.languageSettings, ...languageSettings };
        }
        if (notificationSettings) {
            userSettings.notificationSettings = { ...userSettings.notificationSettings, ...notificationSettings };
        }
        if (theme) {
            userSettings.theme = theme;
        }
        userSettings.lastUpdated = new Date(); // Update timestamp

        res.json({ message: 'Settings updated successfully', settings: userSettings });
    });

    app.listen(port, () => {
        console.log(`Settings service listening at http://localhost:${port}`);
        console.log(`GraphQL endpoint available at http://localhost:${port}/graphql`);
    });
});
