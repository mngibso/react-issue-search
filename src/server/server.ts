import * as express from 'express';
import apiRouter from './routes';

// @ts-ignore
const app = express.default();

app.use(express.static('public'));
app.use(apiRouter);

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server listening on port: ${port}`));
