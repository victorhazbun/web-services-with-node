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

};
