const express = require('express')
const app = express();
const ejs = require('ejs');
app.set('view engine', 'ejs');
const port = 9872;
require('dotenv').config();
require('./database/database');
const { allDetailsofUser, FormData, Telecom, DataSchedul } = require('./model/schema');
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
const ITEMS_PER_PAGE = 10; // Number of records to display per page

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
    let sortOrder = 1;

    // Check the 'sort' query parameter to determine the sorting order
    if (req.query.sort === '-username') {
      sortOrder = -1; // Descending order
    }
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * ITEMS_PER_PAGE;

    // Retrieve the start and end date from the request query
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    // Build a query object to filter by date range
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    // Query the database to get records that match the date range
    // const allUsersInDB = await FormData.find(dateFilter).sort({ createdAt: -1, clientSelect : sortOrder  });
    const allUsersInDB = await FormData.find(dateFilter);
    // console.log(allUsersInDB);
    // Calculate the total count of filtered records
    // const totalCount = allUsersInDB.length;
    // Sort the data based on the clientSelect field when 'sort' is provided
    if (req.query.sort === 'username' || req.query.sort === '-username') {
      allUsersInDB.sort((a, b) => {
        const clientA = a.clientSelect.toLowerCase();
        const clientB = b.clientSelect.toLowerCase();
        if (clientA < clientB) return -sortOrder;
        if (clientA > clientB) return sortOrder;
        return 0;
      });
    }
    // Slice the records to get the current page
    const allUsersForPage = allUsersInDB.slice(skip, skip + ITEMS_PER_PAGE);

    res.render('Queuereport', {
      allUsersInDB: allUsersForPage,
      currentPage: page,
      ITEMS_PER_PAGE,
      // totalCount, // Pass the total count of records to the template
      sort: req.query.sort || 'createdAt',
    });

  } catch (error) {
    console.log(error);
  }
});
// queue get Request Ends


app.get('/sentReport', async (req, res) => {
  try {


    const getSimData = await Telecom.find();
    const airtel_A_100 = getSimData.map(entry => entry.airtel_A * 100);
    const airtel_M_100 = getSimData.map(entry => entry.airtel_M * 100);
    const BSNL_100 = getSimData.map(entry => entry.BSNL * 100);


    const lastAirtel_A_100 = airtel_A_100[airtel_A_100.length - 1];
    const lastAirtel_M_100 = airtel_A_100[airtel_M_100.length - 1];
    // console.log('Last Airtel_A*100:', lastAirtel_A_100);

    const lastBSNL_100 = airtel_A_100[BSNL_100.length - 1];




    const selectedDate = req.query.date;

    const selectedOperator = req.query.operator;

    let pipeline = [
      {
        $group: {
          _id: {
            clientSelect: '$clientSelect',
            selectbox: '$selectbox',
          },
          latestEntry: { $last: '$$ROOT' },
        },
      },
      {
        $replaceRoot: { newRoot: '$latestEntry' },
      },
      {
        $group: {
          _id: '$clientSelect',
          latestEntries: { $push: { selectbox: '$selectbox', sent: '$sent', lastUpdate: '$lastUpdate' } },
        },
      },
    ];

    if (selectedDate) {
      startDate = new Date(selectedDate);
      console.log("namaste");
      pipeline = [
        {
          $match: {
            createdAt: {
              $gte: new Date(selectedDate),
              $lt: new Date(new Date(selectedDate).setDate(new Date(selectedDate).getDate() + 1)),
            },
          },
        },
        ...pipeline,
      ];
    }

    if (selectedOperator) {
      pipeline = [
        {
          $match: {
            'latestEntries.selectbox': selectedOperator,
          },
          ...pipeline,
        },
      ];
    }
// Add a $sort stage to sort the results by clientSelect
// const sortValue = req.query.sort === '-clientSelect' ? -1 : 1; // Toggle between ascending and descending
// pipeline.push({
//   $sort: { clientSelect: sortValue }
// });

    const latestEntries = await FormData.aggregate(pipeline);

    // Calculate totals
    let totalAirtel_A = 0;
    let totalAirtel_M = 0;
    let totalBSNL = 0;

    latestEntries.forEach((entry) => {
      entry.latestEntries.forEach((selectboxEntry) => {
        if (selectboxEntry.sent !== undefined && selectboxEntry.sent !== null) {
          if (selectboxEntry.selectbox === 'A_airtel') {
            totalAirtel_A += selectboxEntry.sent;
          } else if (selectboxEntry.selectbox === 'M_airtel') {
            totalAirtel_M += selectboxEntry.sent;
          } else if (selectboxEntry.selectbox === 'BSNL') {
            totalBSNL += selectboxEntry.sent;
          }
        }
      });
    });
    const TotalOfALl = totalAirtel_A + totalAirtel_M + totalBSNL;
    // Console log totals
    console.log('Total A_airtel:', totalAirtel_A);
    // console.log('Total M_airtel:', totalAirtel_M);
    // console.log('Total BSNL:', totalBSNL);

    const subtractedVAl1 = totalAirtel_A - lastAirtel_A_100;
    const subtractedVAl2 = totalAirtel_M - lastAirtel_M_100;
    const subtractedVAl3 = totalBSNL - lastBSNL_100;
    const total = subtractedVAl1 + subtractedVAl2 + subtractedVAl3;
    const lastTotal = lastAirtel_A_100 + lastAirtel_M_100 + lastBSNL_100;
    // Now, process the latestEntries to fill in empty values with new entries
    const processedEntries = latestEntries.map((entry) => {
      const filledEntry = { ...entry }; // Create a copy of the entry to avoid modifying the original
      filledEntry.latestEntries.forEach((selectboxEntry) => {
        if (selectboxEntry.sent !== undefined && selectboxEntry.sent !== null) {
          filledEntry[selectboxEntry.selectbox] = selectboxEntry.sent;
        }
      });
      return filledEntry;
    });

    // Render a new view with the total values
    res.render('sentreport', { latestEntries: processedEntries, selectedDate, lastTotal, lastAirtel_A_100, lastAirtel_M_100, lastBSNL_100, total, subtractedVAl1, subtractedVAl2, subtractedVAl3, totalAirtel_A, totalAirtel_M, totalBSNL, selectedOperator, TotalOfALl });
  } catch (error) {
    console.log(error);
  }
});







app.get('/QueueData', async (req, res) => {
  const allUsers = await allDetailsofUser.find();
  console.log(allDetailsofUser);
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
  const allUsers = await allDetailsofUser.find();
  try {
    // Get the selected client's name
    const selectedClientName = req.body.clientSelect;
    console.log(selectedClientName);

    // console.log(typeof(req.body.selectbox));
    // Retrieve the "Data" value based on the selected user's name
    // const selectedClientData = req.body[`${selectedClientName}_data`];
    // console.log(selectedClientData);

    const { sent, queue } = req.body;
    if (!sent && !queue) {
      res.render('QueueData', { allUsers, error: "please filled sent or queue filed" });
    } else if (req.body.selectbox === 'default') {
      res.render('QueueData', { allUsers, error: "Please select an option from the dropdown." });
    } else {
      const formData = new FormData({
        clientSelect: selectedClientName,
        sent,
        queue,
        selectbox: req.body.selectbox,

      });
      await formData.save();
      res.redirect("/Queuereport");

    }
    //const totalToOfPending = (Number(sent) + Number(queue)) - selectedClientData


  } catch (error) {
    console.error(error);
    // res.status(500).send('Error saving form data.');
    // res.render('QueueData', { allUsers, error: "please filled all fields" });
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




// DataSchedule starts
app.post('/sendDetailsToServer', async (req, res) => {
  try {
    const { client, operator, data, date } = req.body;

    // Create a new Data document
    const newData = new DataSchedul({
      client,
      operator,
      data,
      date
    });


    console.log(`here is our all data ..${newData}`);

    // Save the data to the MongoDB database
    await newData.save();

    // Redirect to a success page or do any additional processing as needed
    res.redirect('/DataSchedule');
  } catch (error) {
    // Handle errors
    console.error(error);
    res.status(500).send('Error');
  }
});


app.get('/DataSchedule', async (req, res) => {
  try {
    const allUsers = await allDetailsofUser.find();
    const dataSchedul = await DataSchedul.find();

    // Format the date and remove the time and timezone information
    const formattedDataSchedul = dataSchedul.map(data => ({
      client: data.client,
      operator: data.operator,
      data: data.data,
      date: data.date ? data.date.toISOString().slice(0, 10) : null
    }));


    res.render('DataSchedule', { allUsers, dataSchedul: formattedDataSchedul });
  } catch (error) {
    console.log(error);
  }
});
// DataSchedule Ends


// total of all operator
app.get('/TofallSim', async (req, res) => {
  try {
    const selectedDate = req.query.date;

    if (!selectedDate) {
      // Handle case when no date is selected
      return res.render('TofallSim', { totalSentAirtelA: 0, totalSentAirtelM: 0, totalSentBsnl: 0 });
    }

    const formattedDate = new Date(selectedDate);
    const endDate = new Date(formattedDate);
    endDate.setDate(endDate.getDate() + 1); // Set the end date to the next day

    const pipeline = [
      {
        $match: {
          createdAt: {
            $gte: formattedDate,
            $lt: endDate,
          },
        },
      },
      {
        $group: {
          _id: null,
          totalSentAirtelA: { $sum: { $cond: [{ $eq: ['$selectbox', 'A_airtel'] }, '$sent', 0] } },
          totalSentAirtelM: { $sum: { $cond: [{ $eq: ['$selectbox', 'M_airtel'] }, '$sent', 0] } },
          totalSentBsnl: { $sum: { $cond: [{ $eq: ['$selectbox', 'BSNL'] }, '$sent', 0] } },
        },
      },
    ];

    const result = await FormData.aggregate(pipeline);

    // Extract the totals from the result
    const {
      totalSentAirtelA = 0,
      totalSentAirtelM = 0,
      totalSentBsnl = 0,
    } = result[0] || {};
    console.log(selectedDate);
    res.render('TofallSim', { totalSentAirtelA, totalSentAirtelM, totalSentBsnl, selectedDate });
  } catch (error) {
    console.log('Error:', error);
    res.status(500).send('An error occurred');
  }
});





// total of all operator


app.listen(port, () => {
  console.log(`Server Running at http://localhost:${port}`);
})