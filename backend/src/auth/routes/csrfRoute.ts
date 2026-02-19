import { Router } from 'express';
import { issueCsrfToken } from '../../middleware/csrf';

export const csrfRoute = Router();

csrfRoute.get('/csrf', (req, res) => {
  res.json({ token: issueCsrfToken(req, res) });
});
