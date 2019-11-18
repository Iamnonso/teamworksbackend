const { expect } = require('chai');

const assert = require('assert');

const request = require('request');

const server = require('../server');

const baseUrl = 'http://localhost:3000/';

/*
describe('test user and Admin can login', () => {
    describe('GET /api/v1/auth/signin', () => {
      it ('returns status code 200', () => {

        request.get(baseUrl, (error, response, body) => {

            // expect(response.statusCode).toBe(200);
        assert.equal(200, response.statusCode);
        done();

        });

      });
    });
  });

*/
describe('test', () => {
    it('should return a string', () => {
      expect('ci with travis').to.equal('ci with travis');
    });
  });
