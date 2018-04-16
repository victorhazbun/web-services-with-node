/**
 * Provides API endpoints for searching the books index.
 */
'use strict';
const request = require('request');
const rp = require('request-promise');
module.exports = (app, elasticsearch) => {

  const url = `http://${elasticsearch.host}:${elasticsearch.port}/${elasticsearch.books_index}/book/_search`;

  /**
   * Search for books by matching a particular field value.
   * Example: /api/search/books/authors/Twain
   */
  app.get('/api/search/books/:field/:query', (req, res) => {

    const elasticsearchReqBody = {
      size: 10,
      query: {
        match: {
          [req.params.field]: req.params.query
        }
      },
    };

    const options = {url, json: true, body: elasticsearchReqBody};
    request.get(options, (err, elasticsearchRes, elasticsearchResBody) => {

      if (err) {
        res.status(502).json({
          error: 'bad_gateway',
          reason: err.code,
        });
        return;
      }

      if (elasticsearchRes.statusCode !== 200) {
        res.status(elasticsearchRes.statusCode).json(elasticsearchResBody);
        return;
      }

      res.status(200).json(elasticsearchResBody.hits.hits.map(({_source}) => _source));
    });
  });

  /**
   * Collect suggested terms for a given field based on a given query.
   * Example: /api/suggest/authors/lipman
   */
  app.get('/api/suggest/:field/:query', (req, res) => {
    const elasticsearchReqBody = {
      size: 0,
      suggest: {
        suggestions: {
          text: req.params.query,
          term: {
            field: req.params.field,
            suggest_mode: 'always',
          },
        }
      }
    };

    const options = {url, json: true, body: elasticsearchReqBody};

    /* const promise = new Promise((resolve, reject) => {
      request.get(options, (err, elasticsearchRes, elasticsearchResBody) => {

        if (err) {
          reject({error: err});
          return;
        }

        if (elasticsearchRes.statusCode !== 200) {
          reject({error: elasticsearchResBody});
          return;
        }

        resolve(elasticsearchResBody);
      });
    });*/

    /* promise
      .then(elasticsearchResBody => res.status(200).json(elasticsearchResBody.suggest.suggestions))
      .catch(({error}) => res.status(error.status || 502).json(error));*/

    rp(options)
      .then(elasticsearchResBody => res.status(200).json(elasticsearchResBody.suggest.suggestions))
      .catch(({error}) => res.status(error.status || 502).json(error));

  });

};
