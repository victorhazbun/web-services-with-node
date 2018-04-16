/**
 * Provides API endpoints for working with book bundles.
 */
'use strict';
const rp = require('request-promise');

module.exports = (app, elasticsearch) => {

  const url = `http://${elasticsearch.host}:${elasticsearch.port}/${elasticsearch.bundles_index}/bundle`;

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
      res.status(elasticsearchResErr.statusCode || 502).json(elasticsearchResErr.error);
    }
  });

  /**
   * Set the specified bundle's name with the specified name.
   * curl -X PUT http://<host>:<port>/api/bundle/<id>/name/<name>
   */
  app.put('/api/bundle/:id/name/:name', async (req, res) => {
    const bundleUrl = `${url}/${req.params.id}`;

    try {
      const bundle = (await rp({url: bundleUrl, json: true}))._source;

      bundle.name = req.params.name;

      const elasticsearchResBody =
        await rp.put({url: bundleUrl, body: bundle, json: true});
      res.status(200).json(elasticsearchResBody);

    } catch (elasticsearchResErr) {
      res.status(elasticsearchResErr.statusCode || 502).json(elasticsearchResErr.error);
    }
  });


  /**
   * Put a book into a bundle by its id.
   * curl -X PUT http://<host>:<port>/api/bundle/<id>/book/<pgid>
   */
  app.put('/api/bundle/:id/book/:pgid', async (req, res) => {
    const bundleUrl = `${url}/${req.params.id}`;

    const bookUrl =
        `http://${elasticsearch.host}:${elasticsearch.port}` +
        `/${elasticsearch.books_index}/book/${req.params.pgid}`;

    try {

      // Request the bundle and book in parallel.
      /* const [bundleRes, bookRes] = await Promise.all([
        rp({url: bundleUrl, json: true}),
        rp({url: bookUrl, json: true}),
      ]);*/

      const bundleRes = await rp({url: bundleUrl, json: true});
      const bookRes = await rp({url: bookUrl, json: true});


      // Extract bundle and book information from responses.
      const {_source: bundle, _version: version} = bundleRes;
      const {_source: book} = bookRes;

      const idx = bundle.books.findIndex(book => book.id === req.params.pgid);
      if (idx === -1) {
        bundle.books.push({
          id: req.params.pgid,
          title: book.title,
        });
      }

      // Put the updated bundle back in the index.
      const esResBody = await rp.put({
        url: bundleUrl,
        qs: { version },
        body: bundle,
        json: true,
      });
      res.status(200).json(esResBody);

    } catch (esResErr) {
      res.status(esResErr.statusCode || 502).json(esResErr.error);
    }
  });

  /**
   * Remove a book from a bundle.
   * curl -X DELETE http://<host>:<port>/api/bundle/<id>/book/<pgid>
   */
  app.delete('/api/bundle/:id/book/:pgid', async (req, res) => {
    const bundleUrl = `${url}/${req.params.id}`;

    try {

      const {_source: bundle, _version: version} =
        await rp({url: bundleUrl, json: true});

      const idx = bundle.books.findIndex(book => book.id === req.params.pgid);
      if (idx === -1) {
        throw {
          statusCode: 409,
          error: {
            reason: 'Conflict - Bundle does not contain that book.',
          }
        };
      }

      bundle.books.splice(idx, 1);

      const esResBody = await rp.put({
        url: bundleUrl,
        qs: { version },
        body: bundle,
        json: true,
      });
      res.status(200).json(esResBody);
    } catch (esResErr) {
      res.status(esResErr.statusCode || 502).json(esResErr.error);
    }
  });

};