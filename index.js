const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const port = process.env.PORT || 5000
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');



// middleware
const corsOptions = {
  origin: '*',
  credentials: true,
  optionSuccessStatus: 200,
}
app.use(cors(corsOptions))
app.use(express.json())

// verifyJWT
const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if(!authorization){
    return res.status(401).send({error: true, message: 'unauthorized access'});
  }

  // bearer token
  const token = authorization.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if(err){
      return res.status(403).send({error: true, message: 'unauthorized access'})
    }
    req.decoded = decoded;
    next();
  })
}


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.4hywmoi.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {

    const usersCollection = client.db('danceDb').collection('users')
    const classesCollection = client.db('danceDb').collection('classes')
    const enrollCollection = client.db('danceDb').collection('bookings')


    app.post('/jwt', (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '1h'
      })
      res.send({token})
    })

    // get all users
    app.get('/users', async(req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    })
    

    app.post('/users', async(req, res) => {
      const user = req.body;
      console.log(user);

      const query = {email: user.email};

      const existingUser = await usersCollection.findOne(query);
      console.log('existing user:', existingUser)

      if(existingUser) {
        return res.send({message: 'user already exists'});
      }

      const result = await usersCollection.insertOne(user);
      res.send(result);
    })


     app.patch('/users/admin/:id', async(req, res) => {
      const id = req.params.id;
      console.log(id)
      const filter = {_id: new ObjectId(id)};
      const updateDoc = {
        $set: {
          role: 'admin'
        },
      };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);
    })

     app.patch('/users/instructor/:id', async(req, res) => {
      const id = req.params.id;
      console.log(id)
      const filter = {_id: new ObjectId(id)};
      const updateDoc = {
        $set: {
          role: 'instructor'
        },
      };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);
    })

    

    // get all classes
    app.get('/classes', async(req, res) => {
      const result = await classesCollection.find().toArray()
      res.send(result)
    })

  

    // save class data in database
    app.post('/classes', async (req, res) => {
      const classes = req.body;
      console.log(classes)
      const result = classesCollection.insertOne(classes)
      res.send(result)
    })




    // enrol collection

    app.get('/enroll', async(req, res) => {
      const email = req.query.email;
      console.log(email)
      if(!email){
        res.send([])
      }
      const query = {email: email}
      const result = await enrollCollection.find(query).toArray();
      res.send(result);
    })


    app.post('/enroll', async(req, res) => {
      const item = req.body;
      const result = await enrollCollection.insertOne(item)
      res.send(result)
    })

    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Dance school Server is running..')
})

app.listen(port, () => {
  console.log(`Dance school is running on port ${port}`)
})