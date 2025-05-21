import mongoose from "mongoose";

// Enable debug mode for Mongoose
mongoose.set('debug', true);

// Cache the connection to avoid multiple connections
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export const connectDB = async () => {
  // If we have a cached connection, use it
  if (cached.conn) {
    console.log('Using cached database connection');
    return cached.conn;
  }

  // Check if MONGO_URI is set
  if (!process.env.MONGO_URI) {
    console.error('MongoDB connection string (MONGO_URI) is not defined in environment variables');
    throw new Error('MongoDB connection string is not configured');
  }

  console.log('Connecting to MongoDB...');
  console.log('Connection string:', process.env.MONGO_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'));

  try {
    // Create a new connection if one doesn't exist
    if (!cached.promise) {
      const opts = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 10000, // Timeout after 10s instead of 30s
        socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      };

      cached.promise = mongoose.connect(process.env.MONGO_URI, opts).then(mongoose => {
        console.log('MongoDB connected successfully');
        return mongoose;
      });
    }

    // Wait for the connection to be established
    cached.conn = await cached.promise;
    
    // Log connection status
    const conn = mongoose.connection;
    
    conn.on('connected', () => {
      console.log('Mongoose connected to DB');
    });
    
    conn.on('error', (err) => {
      console.error('Mongoose connection error:', err);
    });
    
    conn.on('disconnected', () => {
      console.log('Mongoose disconnected');
    });
    
    return cached.conn;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    console.error('Connection string used:', process.env.MONGO_URI);
    
    // Log specific error details
    if (error.name === 'MongoParseError') {
      console.error('MongoDB connection string is malformed');
    } else if (error.name === 'MongoNetworkError') {
      console.error('Could not connect to MongoDB server. Make sure MongoDB is running');
    } else if (error.name === 'MongoServerSelectionError') {
      console.error('MongoDB server selection error. Check if MongoDB is running and accessible');
    }
    
    // Exit with error code
    process.exit(1);
  }
};

// Handle application termination
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed through app termination');
    process.exit(0);
  } catch (err) {
    console.error('Error closing MongoDB connection:', err);
    process.exit(1);
  }
});
