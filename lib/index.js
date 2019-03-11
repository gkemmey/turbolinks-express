// call modes we need to support:
//
// redirect(status, path, options)
// redirect(status, path) -- from express
// redirect(path, options)
// redirect(path) -- from express
//
function redirect(req, res, next) {
  const _original_redirect = res.redirect

  res.redirect = function(_path, _options = {}) {
    let path = null
    let status = null
    let options = null

    if (arguments.length === 3) { // redirect(status, path, options)
      status = arguments[0]
      path = arguments[1]
      options = arguments[2]
    }
    else if (arguments.length === 2 && typeof arguments[0] === 'number') { // redirect(status, path)
      status = arguments[0]
      path = arguments[1]
      options = {}
    }
    else if (arguments.length === 2) { // redirect(path, options)
      status = 302
      path = arguments[0]
      options = arguments[1]
    }
    else { // redirect(path)
      status = 302
      path = arguments[0]
      options = {}
    }

    if (options.turbolinks !== false && req.xhr && req.method !== "GET") {
      let mode = options.turbolinks === "advance" ? "advance" : "replace"

      res.header('Content-Type', 'text/javascript');
      res.header('X-Xhr-Redirect', path);

      res.send([
        "Turbolinks.clearCache();",
        `Turbolinks.visit("${path}", { action: "${mode}" });`
      ].join("\n"));
    }
    else {
      if (req.session && req.get("Turbolinks-Referrer")) {
        req.session.turbolinksLocation = path
      }

      _original_redirect.apply(this, [status, path])
    }
  };

  next();
};

function location(req, res, next) {
  if (req.session && req.session.turbolinksLocation) {
    res.header("Turbolinks-Location", req.session.turbolinksLocation);
    delete req.session.turbolinksLocation;
  }

  next();
};

exports = module.exports = {
  redirect: redirect,
  location: location
}
