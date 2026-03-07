import express from 'express';
import globalpair from './globalpair.js';

const app = express();
const PORT = process.env.PORT || 9000;

app.use('/', globalpair);

app.listen(PORT, () => {
});
