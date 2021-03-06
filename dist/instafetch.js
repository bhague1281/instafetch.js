(function (global, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['exports', 'module'], factory);
  } else if (typeof exports !== 'undefined' && typeof module !== 'undefined') {
    factory(exports, module);
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, mod);
    global.fetchJsonp = mod.exports;
  }
})(this, function (exports, module) {
  'use strict';

  var defaultOptions = {
    timeout: 5000,
    jsonpCallback: 'callback',
    jsonpCallbackFunction: null
  };

  function generateCallbackFunction() {
    return 'jsonp_' + Date.now() + '_' + Math.ceil(Math.random() * 100000);
  }

  function clearFunction(functionName) {
    try {
      delete window[functionName];
    } catch (e) {
      window[functionName] = undefined;
    }
  }

  function removeScript(scriptId) {
    var script = document.getElementById(scriptId);
    document.getElementsByTagName('head')[0].removeChild(script);
  }

  function fetchJsonp(_url) {
    var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    var url = _url;
    var timeout = options.timeout || defaultOptions.timeout;
    var jsonpCallback = options.jsonpCallback || defaultOptions.jsonpCallback;

    var timeoutId = undefined;

    return new Promise(function (resolve, reject) {
      var callbackFunction = options.jsonpCallbackFunction || generateCallbackFunction();
      var scriptId = jsonpCallback + '_' + callbackFunction;

      window[callbackFunction] = function (response) {
        resolve({
          ok: true,
          json: function json() {
            return Promise.resolve(response);
          }
        });

        if (timeoutId) clearTimeout(timeoutId);

        removeScript(scriptId);

        clearFunction(callbackFunction);
      };

      url += url.indexOf('?') === -1 ? '?' : '&';

      var jsonpScript = document.createElement('script');
      jsonpScript.setAttribute('src', '' + url + jsonpCallback + '=' + callbackFunction);
      jsonpScript.id = scriptId;
      document.getElementsByTagName('head')[0].appendChild(jsonpScript);

      timeoutId = setTimeout(function () {
        reject(new Error('JSONP request to ' + url + ' timed out'));

        clearFunction(callbackFunction);
        removeScript(scriptId);
      }, timeout);
    });
  }


  module.exports = fetchJsonp;
});
(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory(root));
  } else if (typeof exports === 'object') {
    module.exports = factory(root);
  } else {
    root.instafetch = factory(root);
  }
})(typeof global !== 'undefined' ? global : this.window || this.global, function (root) {

  'use strict';


  var instafetch = {};
  var supports = !!document.querySelector && !!root.addEventListener;
  var settings, checked, url, targetEl, article, a, figure, img, div, p;
  var baseUrl = 'https://api.instagram.com/v1/users/self/media/recent/?access_token=';

  var defaults = {
    accessToken: null,
    target: 'instafetch',
    numOfPics: 20,
    caption: false
  };


  var forEach = function(collection, callback, scope) {
    if (Object.prototype.toString.call(collection) === '[object Object]') {
      for (var prop in collection) {
        if (Object.prototype.hasOwnProperty.call(collection, prop)) {
          callback.call(scope, collection[prop], prop, collection);
        }
      }
    } else {
      for (var i = 0, len = collection.length; i < len; i++) {
        callback.call(scope, collection[i], i, collection);
      }
    }
  };

  var extend = function(defaults, options) {
    var extended = {};
    forEach(defaults, function(value, prop) {
      extended[prop] = defaults[prop];
    });
    forEach(options, function(value, prop) {
      extended[prop] = options[prop];
    });
    return extended;
  };

  var checkSettings = function(options) {
    if (typeof options.accessToken !== 'string') {
      console.log('accessToken must be a string.');
      return false;
    }
    if (typeof options.target !== 'string') {
      console.log('target must be a string.');
      return false;
    }
    if (typeof options.numOfPics !== 'number') {
      console.log('numOfPics must be a number.');
      return false;
    }
    if (typeof options.caption !== 'boolean') {
      console.log('caption must be a boolean.');
      return false;
    }

    return true;
  };

  var fetchFeed = function(options) {
    url = baseUrl + options.accessToken + '&count=' + options.numOfPics + '&callback=?';

    fetchJsonp(url).then(function(response) {
      return response.json();
    }).then(function(json) {
      if (json.meta.code === 200) {
        displayFeed(json, options);
      } else {
        console.log(json.meta.error_message);
      }
    }).catch(function(error) {
      console.log(error);
    });
  };

  var displayFeed = function(json, options) {
    targetEl = document.getElementById(options.target);
    if (!targetEl) {
      console.log('No element with id="' + options.target + '" was found on the page.');
      return;
    }

    json.data.forEach(function(data) {
      article = document.createElement('article');
      a = document.createElement('a');
      a.href = data.link;
      a.target = '_blank';
      figure = document.createElement('figure');
      img = document.createElement('img');
      img.src = data.images.standard_resolution.url;
      figure.appendChild(img);
      a.appendChild(figure);
      article.appendChild(a);

      if (options.caption) {
        div = document.createElement('div');
        p = document.createElement('p');
        p.innerHTML = data.caption.text;
        div.appendChild(p);
        a.appendChild(div);
      }

      targetEl.appendChild(article);
    });
  };

  instafetch.destroy = function() {
    if (!settings) {
      return;
    }

    settings = null;
    checked = null;
    url = null;
    targetEl = null;
    article = null;
    a = null;
    figure = null;
    img = null;
    div = null;
    p = null;
  };

  instafetch.init = function(options) {
    if (!supports) {
      return;
    }

    instafetch.destroy();

    settings = extend(defaults, options || {});

    checked = checkSettings(settings);

    if (checked) {
      fetchFeed(settings);
    }
  };


  return instafetch;
});
