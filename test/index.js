var assert = require('assert');
var express = require('express');
var request = require('supertest');

var turbolinks = require('../lib');

const mockSession = () => {
  let session = {}
  return session
}

const createApp = ({ defaultRoute = true, session = false } = {}) => {
  var app = express();

  if (session) {
    app.use(function(req, res, next) {
      req.session = session
      next()
    })
  }

  app.use(turbolinks.redirect)
  app.use(turbolinks.location)

  if (defaultRoute) {
    app.use(function(req, res) {
      res.redirect('http://google.com');
    });
  }

  return app
}

describe("turbolinks-express.redirect", function() {
  it("is a function", function() {
    assert.equal(typeof turbolinks.redirect, "function");
  })


  describe("the original redirect still works", function() {
    it('should default to a 302 redirect', function(done) {
      let app = createApp()

      request(app).get('/').
                   expect('location', 'http://google.com').
                   expect(302, done)
    })

    it('should set the response status', function(done) {
      let app = createApp({ defaultRoute: false })

      app.use(function(req, res) {
        res.redirect(303, 'http://google.com');
      });

      request(app).get('/').
                   expect('Location', 'http://google.com').
                   expect(303, done)
    })
  })


  describe("handling form submission requets (xhr and !GET)", function() {
    it("returns javascript", function(done) {
      let app = createApp()

      request(app).post('/').
                   set('Accept', 'text/javascript').
                   set("X-Requested-With", "XMLHttpRequest").
                   expect('Content-Type', 'text/javascript; charset=utf-8').
                   expect(200, done)
    })

    it("can be skipped by passing { turbolinks: false }", function(done) {
      let app = createApp({ defaultRoute: false })

      app.use(function(req, res) {
        res.redirect('http://google.com', { turbolinks: false });
      });

      request(app).get('/').
                   set('Accept', 'text/javascript').
                   set("X-Requested-With", "XMLHttpRequest").
                   expect('Location', 'http://google.com').
                   expect(302, done)
    })

    it("by default tells Turbolinks to replace", function(done) {
      let app = createApp()

      request(app).post('/').
                   set('Accept', 'text/javascript').
                   set("X-Requested-With", "XMLHttpRequest").
                   expect('Content-Type', 'text/javascript; charset=utf-8').
                   expect(200).
                   expect((res) => {
                     assert(res.text.includes('Turbolinks.visit("http://google.com", { action: "replace" })'))
                   }).
                   end(done)
    })

    it("will allow you to tell it to advance", function(done) {
      let app = createApp({ defaultRoute: false })

      app.use(function(req, res) {
        res.redirect('http://google.com', { turbolinks: "advance" });
      });

      request(app).post('/').
                   set('Accept', 'text/javascript').
                   set("X-Requested-With", "XMLHttpRequest").
                   expect('Content-Type', 'text/javascript; charset=utf-8').
                   expect(200).
                   expect(function(res) {
                     assert(res.text.includes('Turbolinks.visit("http://google.com", { action: "advance" })'))
                   }).
                   end(done)
    })
  })


  describe("handling non-form submission (!xhr or GET xhr) requests", function() {
    describe("with session middleware configured", function() {
      it("stores the turbolinksLocation", function(done) {
        let session = mockSession()
        let app = createApp({ session: session })

        request(app).get('/').
                     set("Turbolinks-Referrer", "/").
                     expect('location', 'http://google.com').
                     expect(302).
                     expect(function(res) {
                       assert.equal(session.turbolinksLocation, 'http://google.com')
                     }).
                     end(done)
      })
    })


    describe("without session middleware configured", function() {
      it("skips storing the turbolinksLocation", function(done) {
        let app = createApp()

        // i think just testing it doesn't break is sufficient
        request(app).get('/').
                     set("Turbolinks-Referrer", "/").
                     expect('location', 'http://google.com').
                     expect(302, done)
      })
    })
  })
})


describe("turbolinks-express.location", function() {
  it("is a function", function() {
    assert.equal(typeof turbolinks.location, "function");
  })


  describe("with session middleware configured", function() {
    it("skips sets the Tubolinks-Location header and clears the session value", function(done) {
      let session = mockSession()
      session.turbolinksLocation = "http://apple.com"

      let app = createApp({ session: session })

      request(app).get('/').
                   expect('location', 'http://google.com').
                   expect("Turbolinks-Location", "http://apple.com").
                   expect(302).
                   expect(function(res) {
                     assert.equal(session.turbolinksLocation, undefined)
                   }).
                   end(done)
    })
  })


  describe("without session middleware configured", function() {
    it("skips setting the Tubolinks-Location header", function(done) {
      let app = createApp()

      // i think just testing it doesn't break is sufficient
      request(app).get('/').
                   set("Turbolinks-Referrer", "/").
                   expect('location', 'http://google.com').
                   expect(302, done)
    })
  })
})
