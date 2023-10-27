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

// app.get('/', (req, res) => {
//   res.render('clients');
// })

// app.get('/addClients', (req, res) => {
//   res.render('addClient');
// })


// client get Request Starts
const ITEMS_PER_PAGE = 10; // Number of records to display per page

app.get('/', async (req, res) => {
  try {
    let sortOrder = 1;

    // Check the 'sort' query parameter to determine the sorting order
    if (req.query.sort === '-username') {
      sortOrder = -1; // Descending order
    }
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * ITEMS_PER_PAGE;

    const allUsers = await allDetailsofUser
      .find()
      .sort({ createdAt: -1 })  // Sort by createdAt in descending order
      .skip(skip)
      .limit(ITEMS_PER_PAGE);


    if (req.query.sort === 'username' || req.query.sort === '-username') {
      allUsers.sort((a, b) => {
        const clientA = a.name.toLowerCase();
        const clientB = b.name.toLowerCase();
        if (clientA < clientB) return -sortOrder;
        if (clientA > clientB) return sortOrder;
        return 0;
      });
    }
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


    let sortorder = 1;

    // Check the 'sort' query parameter to determine the sorting order
    if (req.query.sort === '-selectbox') {
      sortorder = -1; // Descending order
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
    const allUsersInDB = await FormData.find(dateFilter).sort({ createdAt: -1 });;
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
    if (req.query.sort === 'selectbox' || req.query.sort === '-selectbox') {
      allUsersInDB.sort((a, b) => {
        const clientA = a.selectbox.toLowerCase();
        const clientB = b.selectbox.toLowerCase();
        if (clientA < clientB) return -sortorder;
        if (clientA > clientB) return sortorder;
        return 0;
      });
    }

    if (req.query.sort === 'sent' || req.query.sort === '-sent') {
      allUsersInDB.sort((a, b) => {
        const dataA = a.sent;
        const dataB = b.sent;
        if (req.query.sort === 'sent') {
          return dataA - dataB; // Sort by data ascending
        } else if (req.query.sort === '-sent') {
          return dataB - dataA; // Sort by data descending
        }
      });
    }
    if (req.query.sort === 'queue' || req.query.sort === '-queue') {
      allUsersInDB.sort((a, b) => {
        const dataA = a.queue;
        const dataB = b.queue;
        if (req.query.sort === 'queue') {
          return dataA - dataB; // Sort by data ascending
        } else if (req.query.sort === '-queue') {
          return dataB - dataA; // Sort by data descending
        }
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
    // console.log("1st : ",airtel_A_100);
    const airtel_M_100 = getSimData.map(entry => entry.airtel_M * 100);
    // console.log("2st : ",airtel_M_100);
    const BSNL_100 = getSimData.map(entry => entry.BSNL * 100);
    // console.log("3st : ",BSNL_100);


    const lastAirtel_A_100 = airtel_A_100[airtel_A_100.length - 1];
    const lastAirtel_M_100 = airtel_M_100[airtel_M_100.length - 1];
    // console.log('Last Airtel_A*100:', lastAirtel_A_100);

    const lastBSNL_100 = BSNL_100[BSNL_100.length - 1];




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
    // console.log('Total A_airtel:', totalAirtel_A);
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



//render the popup model for editing name and mobile individually with existing name and mobile
app.get('/getUserRole/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    // console.log(userId);
    // Fetch the user's role from MongoDB
    const user = await allDetailsofUser.findById(userId);
    console.log(user);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Return the user's role as a response
    return res.status(200).json({ name: user.name, phone: user.phone });
  } catch (error) {
    console.error('Error fetching user role:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});
// handle the route for updating the user's name and mobile
app.post('/updateRole/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const newname = req.body.newname;
    const newmobile = req.body.newmobile;
    console.log(newname);
    console.log(newmobile);
    //update users name and mobile in mongodb
    const user = await allDetailsofUser.findOneAndUpdate(
      { _id: userId },
      { name: newname, phone: newmobile },

      { new: true }
    );
    console.log(user);
    // Check if the user was found and updated
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Send a success response
    return res.status(200).json({ message: 'User role updated successfully', user });
  } catch (error) {
    console.error('Error updating user role:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});















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


    // Fetch the latest Telecom document from the database sorted by createdAt
    const latestTelecomData = await Telecom.findOne().sort({ createdAt: -1 }).exec();

    // Create an array with the latest entry
    const telecomData = latestTelecomData ? [latestTelecomData] : [];

    if (req.query.sort === 'airtel_A' || req.query.sort === '-airtel_A') {
      telecomData.sort((a, b) => {
        const dataA = a.airtel_A;
        const dataB = b.airtel_A;

        if (req.query.sort === 'airtel_A') {
          return dataA - dataB; // Sort by data ascending
        } else if (req.query.sort === '-airtel_A') {
          return dataB - dataA; // Sort by data descending
        }
      });
    }
    if (req.query.sort === 'airtel_M' || req.query.sort === '-airtel_M') {
      telecomData.sort((a, b) => {
        const dataA = a.airtel_M;
        const dataB = b.airtel_M;

        if (req.query.sort === 'airtel_M') {
          return dataA - dataB; // Sort by data ascending
        } else if (req.query.sort === '-airtel_M') {
          return dataB - dataA; // Sort by data descending
        }
      });
    }
    if (req.query.sort === 'BSNL' || req.query.sort === '-BSNL') {
      telecomData.sort((a, b) => {
        const dataA = a.BSNL;
        const dataB = b.BSNL;

        if (req.query.sort === 'BSNL') {
          return dataA - dataB; // Sort by data ascending
        } else if (req.query.sort === '-BSNL') {
          return dataB - dataA; // Sort by data descending
        }
      });
    }
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
    let sortOrder = 1;

    // Check the 'sort' query parameter to determine the sorting order
    if (req.query.sort === '-username') {
      sortOrder = -1; // Descending order
    }
    let sortorder = 1;

    // Check the 'sort' query parameter to determine the sorting order
    if (req.query.sort === '-operator') {
      sortorder = -1; // Descending order
    }
    const allUsers = await allDetailsofUser.find();
    const dataSchedul = await DataSchedul.find();
    if (req.query.sort === 'username' || req.query.sort === '-username') {
      dataSchedul.sort((a, b) => {
        const clientA = a.client.toLowerCase();
        const clientB = b.client.toLowerCase();
        if (clientA < clientB) return -sortOrder;
        if (clientA > clientB) return sortOrder;
        return 0;
      });
    }

    if (req.query.sort === 'operator' || req.query.sort === '-operator') {
      dataSchedul.sort((a, b) => {
        const clientA = a.operator.toLowerCase();
        const clientB = b.operator.toLowerCase();
        if (clientA < clientB) return -sortorder;
        if (clientA > clientB) return sortorder;
        return 0;
      });
    }


    if (req.query.sort === 'data' || req.query.sort === '-data') {
      dataSchedul.sort((a, b) => {
        const dataA = a.data;
        const dataB = b.data;

        if (req.query.sort === 'data') {
          return dataA - dataB; // Sort by data ascending
        } else if (req.query.sort === '-data') {
          return dataB - dataA; // Sort by data descending
        }
      });
    }

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


app.get("/clientData", async (req, res) => {

  // const clientData = await FormData.find({},'clientSelect sent selectbox');
  const allUsers = await allDetailsofUser.find({}, 'name');

  //  console.log(allUsers);
  //  console.log(clientData);
  // Create an array to store the calculated total data for each client
  const clientData = [];

  // Sorting parameters for each column
  const sortOptions = {
    'username': 'client',
    '-username': '-client',
    'sim1': 'totalAirtelAData',
    '-sim1': '-totalAirtelAData',
    'sim2': 'totalAirtelMData',
    '-sim2': '-totalAirtelMData',
    'sim3': 'totalBsnlData',
    '-sim3': '-totalBsnlData'
  };
  const sortParam = req.query.sort || 'username'; // Default sorting by client name
  // console.log(sortParam);
  // Iterate through each client and calculate the total data from the FormData collection
  for (const user of allUsers) {
    const client = user.name;
    // console.log(client);
    const airtelAData = await FormData.aggregate([
      { $match: { clientSelect: client, selectbox: 'A_airtel' } },
      { $group: { _id: null, total: { $sum: '$sent' } } }
    ]);
    // console.log(airtelAData);
    const airtelMData = await FormData.aggregate([
      { $match: { clientSelect: client, selectbox: 'M_airtel' } },
      { $group: { _id: null, total: { $sum: '$sent' } } }
    ]);
    // console.log(airtelMData);
    const bsnlData = await FormData.aggregate([
      { $match: { clientSelect: client, selectbox: 'BSNL' } },
      { $group: { _id: null, total: { $sum: '$sent' } } }
    ]);
    // console.log(bsnlData);

    const totalAirtelAData = airtelAData.length > 0 ? airtelAData[0].total : 0;
    // console.log(totalAirtelAData);
    const totalAirtelMData = airtelMData.length > 0 ? airtelMData[0].total : 0;
    // console.log(totalAirtelMData);
    const totalBsnlData = bsnlData.length > 0 ? bsnlData[0].total : 0;
    // console.log(totalBsnlData);
    clientData.push({
      client: client,
      totalAirtelAData: totalAirtelAData,
      totalAirtelMData: totalAirtelMData,
      totalBsnlData: totalBsnlData
    });
    // console.log(clientData);
  }
  // Sort the clientData array based on the selected sorting parameter
  //  if (sortOptions[sortParam]) {
  //   clientData.sort((a, b) => {
  //     if (sortParam.startsWith('-')) {
  //       return b[sortOptions[sortParam].substring(1)] - a[sortOptions[sortParam].substring(1)];
  //     } else {
  //       return a[sortOptions[sortParam]] - b[sortOptions[sortParam]];
  //     }
  //   });
  // }
  // Sort the clientData array based on the selected sorting parameter
  // if (sortOptions[sortParam]) {
  //   if (sortParam.startsWith('-')) {
  //     clientData.sort((a, b) =>
  //       b[sortOptions[sortParam].substring(1)].localeCompare(a[sortOptions[sortParam].substring(1)], undefined, { sensitivity: 'base' })
  //     );
  //   } else {
  //     clientData.sort((a, b) =>
  //       a[sortOptions[sortParam]].localeCompare(b[sortOptions[sortParam]], undefined, { sensitivity: 'base' })
  //     );
  //   }
  // }

  // Sort the clientData array based on the selected sorting parameter
  if (sortParam === 'username') {
    clientData.sort((a, b) => a.client.localeCompare(b.client, undefined, { sensitivity: 'base' }));
  } else if (sortParam === '-username') {
    clientData.sort((a, b) => b.client.localeCompare(a.client, undefined, { sensitivity: 'base' }));
  } else if (sortParam === 'sim1') {
    clientData.sort((a, b) => a.totalAirtelAData - b.totalAirtelAData);
  } else if (sortParam === '-sim1') {
    clientData.sort((a, b) => b.totalAirtelAData - a.totalAirtelAData);
  } else if (sortParam === 'sim2') {
    clientData.sort((a, b) => a.totalAirtelMData - b.totalAirtelMData);
  } else if (sortParam === '-sim2') {
    clientData.sort((a, b) => b.totalAirtelMData - a.totalAirtelMData);
  } else if (sortParam === 'sim3') {
    clientData.sort((a, b) => a.totalBsnlData - b.totalBsnlData);
  } else if (sortParam === '-sim3') {
    clientData.sort((a, b) => b.totalBsnlData - a.totalBsnlData);
  }
  // console.log(clientData);
  res.render("clientData", { clientData, allUsers });
});


// total of all operator

// app.get("/dateData", async (req, res) => {

//   try {

//     // const data = await FormData.find({}, 'createdAt selectbox sent');

//     const data = await FormData.find();
//     // Calculate date-wise total data
//     const dateWiseData = data.reduce(async(acc, entry) => {
//       const date = entry.createdAt.toISOString().slice(0, 10); // Extract the date part
//      console.log(date);

//       const selectbox = entry.selectbox; // Airtel A, Airtel M, BSNL, etc.
//       const sent = entry.sent;
//       let pipeline = [
//         {
//           $group: {
//             _id: {
//               clientSelect: '$clientSelect',
//               selectbox: '$selectbox',
//             },
//             latestEntry: { $last: '$$ROOT' },
//           },
//         },
//         {
//           $replaceRoot: { newRoot: '$latestEntry' },
//         },
//         {
//           $group: {
//             _id: '$clientSelect',
//             latestEntries: { $push: { selectbox: '$selectbox', sent: '$sent', lastUpdate: '$lastUpdate' } },
//           },
//         },
//       ];
//    if (date) {
//         startDate = new Date(date);

//         pipeline = [
//           {
//             $match: {
//               createdAt: {
//                 $gte: new Date(date),
//                 $lt: new Date(new Date(date).setDate(new Date(date).getDate() + 1)),
//               },
//             },
//           },
//           ...pipeline,
//         ];
//       }
//       const latestEntries = await FormData.aggregate(pipeline);

//       // Calculate totals
//       let totalAirtel_A = 0;
//       let totalAirtel_M = 0;
//       let totalBSNL = 0;

//       latestEntries.forEach((entry) => {
//         entry.latestEntries.forEach((selectboxEntry) => {
//           if (selectboxEntry.sent !== undefined && selectboxEntry.sent !== null) {
//             if (selectboxEntry.selectbox === 'A_airtel') {
//               totalAirtel_A += selectboxEntry.sent;
//             } else if (selectboxEntry.selectbox === 'M_airtel') {
//               totalAirtel_M += selectboxEntry.sent;
//             } else if (selectboxEntry.selectbox === 'BSNL') {
//               totalBSNL += selectboxEntry.sent;
//             }
//           }
//         });
//       });
//       const TotalOfALl = totalAirtel_A + totalAirtel_M + totalBSNL;
//       console.log("x : ",TotalOfALl);
//       console.log("y : ",totalAirtel_A);
//       console.log("z : ",totalAirtel_M);
//       console.log("p : ",totalBSNL);

//       if (!acc[date]) {
//         acc[date] = { date };
//       }
//       if (!acc[date][selectbox]) {
//         acc[date][selectbox] = 0;
//       }

//       acc[date][selectbox] += sent;
//       // Calculate the Total Data for each date
//       acc[date].TotalData = (acc[date]['A_airtel'] || 0) + (acc[date]['M_airtel'] || 0) + (acc[date]['BSNL'] || 0);
//       return acc;
//     }, {});


















//     // Fetch the latest Telecom document from the database sorted by createdAt
//     const latestTelecomData = await Telecom.findOne().sort({ createdAt: -1 }).exec();

//     // Create an array with the latest entry
//     const telecomDatas = latestTelecomData ? [latestTelecomData] : [];

//     // Calculate the latest sum of Airtel A, Airtel M, and BSNL data
//     const latestTotalAirtel_A = latestTelecomData ? latestTelecomData.airtel_A : 0;
//     const latestTotalAirtel_M = latestTelecomData ? latestTelecomData.airtel_M : 0;
//     const latestTotalBSNL = latestTelecomData ? latestTelecomData.BSNL : 0;

//     // Add the latest total data to the date-wise data
//     if (telecomDatas.length === 1) {
//       const latestEntry = telecomDatas[0];
//       const date = latestEntry.createdAt.toISOString().slice(0, 10);
//       if (!dateWiseData[date]) {
//         dateWiseData[date] = { date };
//       }
//       dateWiseData[date].latestTotalAirtel_A = latestTotalAirtel_A;
//       dateWiseData[date].latestTotalAirtel_M = latestTotalAirtel_M;
//       dateWiseData[date].latestTotalBSNL = latestTotalBSNL;
//     }


//     let totalLatestDataSum = 0;
//     for (const date in dateWiseData) {
//       if (dateWiseData[date].latestTotalAirtel_A && dateWiseData[date].latestTotalAirtel_M && dateWiseData[date].latestTotalBSNL) {
//         totalLatestDataSum += dateWiseData[date].latestTotalAirtel_A + dateWiseData[date].latestTotalAirtel_M + dateWiseData[date].latestTotalBSNL;
//       }
//     }

//     // Multiply the total by 100
//     totalLatestDataSum *= 100;

//     // console.log(totalLatestDataSum);
//     const sortedDateWiseData = Object.values(dateWiseData)
//       .sort((a, b) => new Date(b.date) - new Date(a.date));
//     //  console.log(sortedTelecomData);
//     res.render('dateData', { dateWiseData: sortedDateWiseData, totalLatestDataSum });
//   } catch (error) {
//     console.error(error);
//   }
// })

app.get("/dateData", async (req, res) => {

  try {

    // let pipeline = [
    //   {
    //     $group: {
    //       _id: {
    //         clientSelect: '$clientSelect',
    //         selectbox: '$selectbox',
    //       },
    //       latestEntry: { $last: '$$ROOT' },
    //     },
    //   },
    //   {
    //     $replaceRoot: { newRoot: '$latestEntry' },
    //   },
    //   {
    //     $group: {
    //       _id: '$clientSelect',
    //       latestEntries: { $push: { selectbox: '$selectbox', sent: '$sent', lastUpdate: '$lastUpdate' } },
    //     },
    //   },
    // ];

    const datePipeline = [
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
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
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            _id: '$clientSelect',
          },
          latestEntries: {
            $push: {
              selectbox: '$selectbox',
              sent: '$sent',
            },
          },
          Airtel_A: {
            $sum: {
              $cond: { if: { $eq: ['$selectbox', 'A_airtel'] }, then: '$sent', else: 0 }
            },
          },
          Airtel_M: {
            $sum: {
              $cond: { if: { $eq: ['$selectbox', 'M_airtel'] }, then: '$sent', else: 0 }
            },
          },
          BSNL: {
            $sum: {
              $cond: { if: { $eq: ['$selectbox', 'BSNL'] }, then: '$sent', else: 0 }
            },
          },
        },
      },
      {
        $sort: { '_id.date': -1 }
      }
    ];





    const latestEntries = await FormData.aggregate(datePipeline);
    console.log(latestEntries);
    const airtelASum = {};
    const airtelMSum = {};
    const bsnlSum = {};

    latestEntries.forEach(entry => {
      const date = entry._id.date;
      const airtelA = entry.Airtel_A;
      const airtelM = entry.Airtel_M;
      const bsnl = entry.BSNL;

      if (!airtelASum[date]) {
        airtelASum[date] = 0;
      }
      if (!airtelMSum[date]) {
        airtelMSum[date] = 0;
      }
      if (!bsnlSum[date]) {
        bsnlSum[date] = 0;
      }

      airtelASum[date] += airtelA;
      airtelMSum[date] += airtelM;
      bsnlSum[date] += bsnl;
    });

    // console.log("Airtel A Sum:", airtelASum);
    // console.log("Airtel M Sum:", airtelMSum);
    // console.log("BSNL Sum:", bsnlSum);


    const latestTelecomData = await Telecom.aggregate([
      {
        $sort: { createdAt: -1 } // Sort Telecom entries by createdAt in descending order
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          },
          latestEntry: { $first: '$$ROOT' }, // Find the latest Telecom entry for each date
        },
      },
      {
        $project: {
          _id: 0, // Exclude _id field
          date: '$_id.date',
          total: { $multiply: [{ $sum: ['$latestEntry.airtel_A', '$latestEntry.airtel_M', '$latestEntry.BSNL'] }, 100] },
        },
      },
    ]);

    //  console.log(latestTelecomData);

    res.render('dateData', {
      airtelASum,
      airtelMSum,
      bsnlSum,
      latestTelecomData: latestTelecomData,
    });


  } catch (error) {
    console.error(error);
  }
})


app.listen(port, () => {
  console.log(`Server Running at http://localhost:${port}`);
})