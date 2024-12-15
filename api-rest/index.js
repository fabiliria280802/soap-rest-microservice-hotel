const express = require('express');
const bodyParser = require('body-parser');
const reservationRoutes = require('./routes/reservations');

const app = express();
app.use(bodyParser.json());
app.use('/reservations', reservationRoutes);

app.listen(3000, () => console.log('REST API running on http://localhost:3000'));
