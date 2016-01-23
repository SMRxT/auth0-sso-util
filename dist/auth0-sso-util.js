(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define("auth0-sso-util", [], factory);
	else if(typeof exports === 'object')
		exports["auth0-sso-util"] = factory();
	else
		root["auth0-sso-util"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports) {

	'use strict';

	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

	var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.decodeToken = decodeToken;
	exports.isTokenExpired = isTokenExpired;
	exports.verifyAuth = verifyAuth;
	exports.turnOnSSOSessionCheck = turnOnSSOSessionCheck;
	/* global Auth0Lock */

	var tokenStorageKey = 'userToken';

	function getQueryParameter(name) {
	  var sanitizedName = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
	  var regex = new RegExp('[\\?&]' + sanitizedName + '=([^&]*)');
	  var results = regex.exec(location.search);
	  return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
	}

	function urlBase64Decode(str) {
	  var output = str.replace(/-/g, '+').replace(/_/g, '/');
	  switch (output.length % 4) {
	    case 0:
	      {
	        break;
	      }
	    case 2:
	      {
	        output += '==';break;
	      }
	    case 3:
	      {
	        output += '=';break;
	      }
	    default:
	      throw new Error('Illegal base64url string!');
	  }
	  return window.decodeURIComponent(escape(window.atob(output))); // polyfill https://github.com/davidchambers/Base64.js
	}

	function decodeToken(token) {
	  var parts = token.split('.');

	  if (parts.length !== 3) {
	    throw new Error('JWT must have 3 parts');
	  }

	  var decoded = urlBase64Decode(parts[1]);
	  if (!decoded) {
	    throw new Error('Cannot decode the token');
	  }

	  return JSON.parse(decoded);
	}

	function getTokenExpirationDate(token) {
	  var decoded = decodeToken(token);

	  if (typeof decoded.exp === 'undefined') {
	    return null;
	  }

	  var d = new Date(0); // The 0 here is the key, which sets the date to the epoch
	  d.setUTCSeconds(decoded.exp);

	  return d;
	}

	function isTokenExpired(token) {
	  var offsetSeconds = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];

	  var d = getTokenExpirationDate(token);

	  if (d === null) {
	    return false;
	  }

	  // Token expired?
	  return !(d.valueOf() > new Date().valueOf() + offsetSeconds * 1000);
	}

	function hideBody() {
	  document.body.style.display = 'none';
	}

	function showBody() {
	  document.body.style.display = 'inline';
	}

	function verifyAuth(_ref) {
	  var auth0ClientId = _ref.auth0ClientId;
	  var auth0Domain = _ref.auth0Domain;
	  var _ref$defaultHref = _ref.defaultHref;
	  var defaultHref = _ref$defaultHref === undefined ? '/' : _ref$defaultHref;
	  var _ref$callbackURL = _ref.callbackURL;
	  var callbackURL = _ref$callbackURL === undefined ? window.location.pathname : _ref$callbackURL;
	  var _ref$scope = _ref.scope;
	  var scope = _ref$scope === undefined ? 'openid name email app_metadata user_metadata roles' : _ref$scope;
	  var _ref$lockOptions = _ref.lockOptions;
	  var lockOptions = _ref$lockOptions === undefined ? {} : _ref$lockOptions;

	  // hide the page in case there is an SSO session (to avoid flickering)
	  hideBody();

	  var lock = new Auth0Lock(auth0ClientId, auth0Domain);

	  // sso requires redirect mode, hence we need to parse
	  // the response from Auth0 that comes on location hash
	  var hash = lock.parseHash(window.location.hash);
	  if (hash && hash.id_token) {
	    // the user came back from the login (either SSO or regular login),
	    // save the token
	    localStorage.setItem(tokenStorageKey, '"' + hash.id_token + '"');
	    window.location.href = hash.state || defaultHref;
	    showBody();
	    return Promise.resolve();
	  }

	  var idToken = localStorage.getItem(tokenStorageKey);

	  var tokenIsValid = undefined;

	  try {
	    tokenIsValid = !isTokenExpired(idToken);
	  } catch (e) {
	    tokenIsValid = false;
	  }

	  if (idToken && tokenIsValid) {
	    showBody();
	    return Promise.resolve();
	  }

	  // user is not logged, check whether there is an SSO session or not
	  return new Promise(function (resolve) {
	    lock.$auth0.getSSOData(function (err, data) {
	      if (!err && data.sso) {
	        // There is an SSO session.
	        // No need to prompt for log in, just redirect for sign in.
	        lock.$auth0.signin({
	          state: window.location.href, // come back to the current location.
	          callbackURL: callbackURL,
	          callbackOnLocationHash: true,
	          scope: scope
	        });
	      } else {
	        var _ret = function () {
	          if (window.location.pathname !== '/') {
	            window.location.href = '/?targetUrl=' + window.location.href;
	            return {
	              v: resolve()
	            };
	          }

	          showBody();

	          var defaultLockOptions = {
	            sso: true,
	            closable: false,
	            disableSignupAction: true,
	            authParams: {
	              state: getQueryParameter('targetUrl'),
	              scope: scope
	            },
	            callbackURL: callbackURL,
	            responseType: 'token'
	          };

	          setTimeout(function () {
	            // Fix lock sometimes not showing.
	            lock.show(_extends({}, defaultLockOptions, lockOptions)); // eslint-disable-line computed-property-spacing, max-len
	          }, 10);
	        }();

	        if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
	      }
	    });
	  });
	}

	function turnOnSSOSessionCheck(_ref2) {
	  var auth0ClientId = _ref2.auth0ClientId;
	  var auth0Domain = _ref2.auth0Domain;
	  var _ref2$checkInterval = _ref2.checkInterval;
	  var checkInterval = _ref2$checkInterval === undefined ? 5000 : _ref2$checkInterval;

	  setInterval(function () {
	    if (!localStorage.getItem(tokenStorageKey)) return;

	    var lock = new Auth0Lock(auth0ClientId, auth0Domain);

	    lock.$auth0.getSSOData(function (err, data) {
	      // if there is still a session, do nothing
	      if (err || data && data.sso) return;

	      // if we get here, it means there is no session on Auth0,
	      // then remove the token and redirect to #login
	      localStorage.removeItem(tokenStorageKey);
	      window.location.href = '/?targetUrl=' + window.location.href;
	    });
	  }, checkInterval);
	}

/***/ }
/******/ ])
});
;