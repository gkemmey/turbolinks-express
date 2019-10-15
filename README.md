# Turbolinks-Express

Express middleware for Turbolinks 5 support. Aims to provide similar functionality as the [turbolinks-rails](https://github.com/turbolinks/turbolinks-rails) gem, but for [Express](https://expressjs.com/).

## Why, tho?

I wrote a lot about that here: ["Making a (Long-Winded) Case for Turbolinks"](http://blog.graykemmey.com/2019/03/11/making-a-case-for-turbolinks/). The short version is, I think Turbolinks is a better paradigm than any of the SPA frameworks of today for lots of web applications.

## Are you maintaining this?

Nah, I don't actually work with Express all that often.

## So, you built an Express app, wrote that blog post, and published this middleware to...what? Prove a point?

Yeah 😬 And (hopefully) to show that it's not too difficult to use Turbolinks in any tech stack!

## Getting Started

1. `yarn add turbolinks-express`
2. Use the middlewares after your session middleware. For example:

    ```js
    // app.js

    var express = require('express');

    var session = require('express-session');
    var turbolinks = require('turbolinks-express');

    var app = express();
    app.set('port', (process.env.PORT || 5000));

    app.use(session({
      secret: 'secret_key_base',
      resave: false,
      saveUninitialized: true
    }))

    // turbolinks
    app.use(turbolinks.redirect)
    app.use(turbolinks.location)

    app.listen(app.get('port'), function() {
      console.log('Node app is running on port', app.get('port'));
      console.log('Running in '+ app.settings.env)
    });
    ```

## Details

I won't rehash what [Turbolinks](https://github.com/turbolinks/turbolinks) is, but when using it you have to make two server side changes:

1. You have to tell Turbolinks how to update the address bar after chained redirects. The XHR requests will silently follow the redirects, but then your address bar will be out of date. [Official docs](https://github.com/turbolinks/turbolinks#following-redirects)

2. After remote form submissions that would normally redirect, we return JavaScript that performs a `Turbolinks.visit`. [Official docs](https://github.com/turbolinks/turbolinks#redirecting-after-a-form-submission)

Adding these middlewares allows you to use Express's `res.redirect("/users")` as you always have while performing those optimizations for you ☝️

## License

MIT
