import * as express from 'express';
import { get } from "./issues"

const router = express.Router();

router.get('/api/issues', get);

export default router;
