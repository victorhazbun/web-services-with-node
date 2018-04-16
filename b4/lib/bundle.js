/**
 * Provides API endpoints for working with book bundles.
 */
'use strict';
const rp = require('request-promise');

module.exports = (app, es) => {

  const url = `http://${es.host}:${es.port}/${es.bundles_index}/bundle`;

  /**
   * Create a new bundle with the specified name.
   * curl -X POST http://<host>:<port>/api/bundle?name=<name>
   */
  app.post('/api/bundle', (req, res) => {
    const bundle = {
      name: req.query.name || '',
      books: [],
    };

    rp.post({url, body: bundle, json: true})
      .then(elasticsearchResBody => res.status(201).json(elasticsearchResBody))
      .catch(({error}) => res.status(error.status || 502).json(error));
  });

  /**
   * Retrieve a given bundle.
   * curl http://<host>:<port>/api/bundle/<id>
   */
  app.get('/api/bundle/:id', async (req, res) => {
    const options = {
      url: `${url}/${req.params.id}`,
      json: true,
    };

    try {
      const elasticsearchResBody = await rp(options);
      res.status(200).json(elasticsearchResBody);
    } catch (elasticsearchResErr) {
      console.log(elasticsearchResErr.StatusCodeError)
      res.status(elasticsearchResErr.statusCode || 502).json(elasticsearchResErr.error);
    }
  });
};