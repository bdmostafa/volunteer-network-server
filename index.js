const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');
require('dotenv').config();
const ObjectID = require('mongodb').ObjectID;
const uploadFile = require('express-fileupload');

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(uploadFile());
app.use(express.static('uploads'))

const port = process.env.PORT || 4000;

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.efifc.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

const client = new MongoClient(
    uri,
    {
        useUnifiedTopology: true,
        useNewUrlParser: true
    });

client.connect(err => {
    const eventsCollection = client.db(process.env.DB_NAME).collection(process.env.EVENT_COLLECTION);
    const registeredEventsCollection = client.db(process.env.DB_NAME).collection(process.env.REG_COLLECTION);

    // Add new event through POST method
    app.post('/add-event', (req, res) => {
        const file = req.files.file;
        const fileName = file.name;
        file.mv(`./uploads/${fileName}`)

        const push = JSON.parse(req.body.total)
        push.image = fileName;

        eventsCollection.insertOne(push)
        .then(result => {
            res.send(result.insertedCount > 0)
        })
    })

    // Get all events through GET method
    app.get('/events', (req, res) => {
        // const allEvents = req.body;
        eventsCollection.find({})
            .toArray((err, documents) => {
                res.send(documents);
            })

    })

    // Register an event
    app.post('/register-event', (req, res) => {
        const registeredEvent = req.body;
        registeredEventsCollection.insertOne(registeredEvent)
            .then(result => {
                res.send(result.insertedCount > 0);
            })
    })

    // Get a specific users events through email
    app.get('/view-my-events', (req, res) => {
        // console.log(req.headers.email)
        registeredEventsCollection.find({ email: req.headers.email })
            .toArray((error, documents) => {
                res.send(documents)
            })
    })

    // Get all registered events API
    app.get('/all-registered-events', (req, res) => {
        registeredEventsCollection.find({})
            .toArray((error, documents) => {
                  res.send(documents)
            })
    })

    // Delete an event API
    app.delete('/delete-event/',(req,res)=>{
        // console.log(req.params.id)
        registeredEventsCollection.deleteOne({_id: req.headers.id})
        .then(result=>{
          console.log(result)
          res.send(result.deletedCount>0)
        })
    })
});

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(process.env.PORT || port)