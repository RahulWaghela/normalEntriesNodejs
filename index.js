const express = require('express')
const app = express();
const ejs = require('ejs');
app.set('view engine', 'ejs');
const port = 1870;
require('dotenv').config();
require('./database/database');
const { allDetailsofUser, FormData, Telecom } = require('./model/schema');
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.render('addClient');
})

app.get('/addClients', (req, res) => {
  res.render('addClient');
})


// client get Request Starts
const ITEMS_PER_PAGE = 5; // Number of records to display per page

app.get('/clients', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * ITEMS_PER_PAGE;

    const allUsers = await allDetailsofUser
      .find()
      .skip(skip)
      .limit(ITEMS_PER_PAGE);

    res.render('clients', { allUsers, currentPage: page, ITEMS_PER_PAGE }); // Pass 'ITEMS_PER_PAGE' to the 'clients' template
  } catch (error) {
    console.error('Failed to fetch data', error);
    res.status(500).send('Unable to fetch data from the server...');
  }
});

// client get Request Ends







// queue get Request Starts
app.get('/Queuereport', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * ITEMS_PER_PAGE;

    // Query the database to get all records sorted by createdAt
    const allUsersInDB = await FormData.find({}).sort({ createdAt: -1 });

    // Calculate the total count of records
    const totalCount = allUsersInDB.length;

    // Slice the records to get the current page
    const allUsersForPage = allUsersInDB.slice(skip, skip + ITEMS_PER_PAGE);

    res.render('Queuereport', {
      allUsersInDB: allUsersForPage,
      currentPage: page,
      ITEMS_PER_PAGE,
      totalCount, // Pass the total count of records to the template
    });
  } catch (error) {
    console.log(error);
  }
});



// queue get Request Ends




app.get('/sentReport', async (req, res) => {
  try {
    const selectedDate = req.query.date;

    let pipeline = [
      {
        $sort: { lastUpdate: 1 }
      },
      {
        $group: {
          _id: { selectbox: '$selectbox', clientSelect: '$clientSelect' },
          latestEntry: { $last: '$$ROOT' }
        }
      },
      {
        $replaceRoot: { newRoot: '$latestEntry' }
      }
    ];

    if (selectedDate) {
      pipeline = [
        {
          $match: {
            createdAt: {
              $gte: new Date(selectedDate),
              $lt: new Date(new Date(selectedDate).setDate(new Date(selectedDate).getDate() + 1))
            }
          }
        },
        ...pipeline // Include the previous stages for filtering
      ];
    }

    const latestEntries = await FormData.aggregate(pipeline);
    res.render('sentreport', { latestEntries });
  } catch (error) {
    console.log(error);
  }
});







app.get('/QueueData', async (req, res) => {
  const allUsers = await allDetailsofUser.find();
  res.render('QueueData', { allUsers });
})






app.post('/sendInDatabase', async (req, res) => {
  try {
    const { name, data, phone, email } = req.body;
    const saveAllRecordInDB = new allDetailsofUser({
      name, data, phone, email
    })

    await saveAllRecordInDB.save();
    console.log(name);
    res.redirect('/');
  } catch (error) {
    console.error('failed to send', error);
    res.status(500).send('can not send to the server...');
  }
})

// queue Data post Request Starts
app.post('/submit-form', async (req, res) => {
  try {
    // Get the selected client's name
    const selectedClientName = req.body.clientSelect;
    console.log(selectedClientName);

    // Retrieve the "Data" value based on the selected user's name
    const selectedClientData = req.body[`${selectedClientName}_data`];
    console.log(selectedClientData);

    const { sent, queue } = req.body;

    console.log(`sent ${sent} and queue ${queue}`);

    const totalToOfPending = (sent + queue) - selectedClientData;

    const formData = new FormData({
      clientSelect: selectedClientName,
      data: selectedClientData, // Add the "Data" value to your FormData
      sent: req.body.sent,
      queue: req.body.queue,
      selectbox: req.body.selectbox,
      pending: totalToOfPending
    });
    await formData.save();
    res.redirect("/Queuereport");
  } catch (error) {
    console.error(error);
    res.status(500).send('Error saving form data.');
  }
});
// queue Data post Request Ends




// simdata post and get request starts
app.post('/sendNEWDB', async (req, res) => {
  try {
    // Create a new Telecom document with data from the form
    const telecomData = new Telecom({
      airtel_A: req.body.airtel_A,
      airtel_M: req.body.airtel_M,
      BSNL: req.body.BSNL,
    });
    console.log(telecomData);

    await telecomData.save();

    res.redirect('simData');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error saving data.');
  }
});
const ITEMS_PER_PAGEs = 5; // Number of records to display per page

app.get('/simData', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Get the requested page number from query params
    const skip = (page - 1) * ITEMS_PER_PAGEs;

    // Fetch all Telecom documents from the database sorted by createdAt
    const telecomData = await Telecom.find().sort({ createdAt: -1 }).exec();

    // Calculate the total count of records
    const totalCount = telecomData.length;

    // Slice the records to get the current page
    const telecomDataForPage = telecomData.slice(skip, skip + ITEMS_PER_PAGEs);

    res.render('simData', {
      telecomData: telecomDataForPage,
      currentPage: page,
      ITEMS_PER_PAGEs,
      totalCount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching data.');
  }
});

// simdata post and get request Ends

app.listen(port, () => {
  console.log(`Server Running at http://localhost:${port}`);
})