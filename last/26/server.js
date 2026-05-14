import { ApolloServer } from '@apollo/server'
import { startStandaloneServer } from '@apollo/server/standalone'

// --- Данные в памяти ---
const authors = [
  { id: '1', name: 'Лев Толстой', birthYear: 1828 },
  { id: '2', name: 'Фёдор Достоевский', birthYear: 1821 },
  { id: '3', name: 'Джордж Оруэлл', birthYear: 1903 },
]

const books = [
  { id: '101', title: 'Война и мир', year: 1869, authorId: '1' },
  { id: '102', title: 'Анна Каренина', year: 1877, authorId: '1' },
  { id: '103', title: 'Преступление и наказание', year: 1866, authorId: '2' },
  { id: '104', title: 'Братья Карамазовы', year: 1880, authorId: '2' },
  { id: '105', title: '1984', year: 1949, authorId: '3' },
]

// --- GraphQL схема (SDL) ---
const typeDefs = `#graphql
  type Author {
    id: ID!
    name: String!
    birthYear: Int
    books: [Book!]!
  }

  type Book {
    id: ID!
    title: String!
    year: Int!
    author: Author!
  }

  type Query {
    allBooks: [Book!]!
    book(id: ID!): Book
    allAuthors: [Author!]!
  }

  type Mutation {
    createBook(title: String!, year: Int!, authorId: ID!): Book!
    createAuthor(name: String!, birthYear: Int): Author!
  }
`

// --- Резолверы ---
const resolvers = {
  Query: {
    allBooks: () => books,
    book: (_, { id }) => books.find(b => b.id === id),
    allAuthors: () => authors,
  },
  Mutation: {
    createBook: (_, { title, year, authorId }) => {
      const newBook = {
        id: String(books.length + 101),
        title,
        year,
        authorId,
      }
      books.push(newBook)
      return newBook
    },
    createAuthor: (_, { name, birthYear }) => {
      const newAuthor = {
        id: String(authors.length + 1),
        name,
        birthYear: birthYear || null,
      }
      authors.push(newAuthor)
      return newAuthor
    },
  },
  Book: {
    author: (parent) => authors.find(a => a.id === parent.authorId),
  },
  Author: {
    books: (parent) => books.filter(b => b.authorId === parent.id),
  },
}

// --- Запуск сервера ---
const server = new ApolloServer({ typeDefs, resolvers })
const { url } = await startStandaloneServer(server, { listen: { port: 4000 } })
console.log(`🚀 GraphQL сервер готов по адресу: ${url}`)