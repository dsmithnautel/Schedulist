import { MongoClient, ServerApiVersion } from 'mongodb';

const URI = process.env.MONGO_URI || '';

const client = new MongoClient(URI, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

let db;

async function connectToDatabase() {
    try {
        await client.connect();
        await client.db('admin').command({ ping: 1 });
        console.log('Pinged your deployment. You successfully connected to MongoDB!');

        db = client.db('schedulist');
    } catch (err) {
        console.error('Failed to connect to MongoDB:', err);
    }
}

connectToDatabase();

export default db;

