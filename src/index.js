/* global Auth0Lock */

const tokenStorageKey = 'userToken';

function getQueryParameter(name) {
  const sanitizedName = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
  const regex = new RegExp('[\\?&]' + sanitizedName + '=([^&]*)');
  const results = regex.exec(location.search);
  return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

function urlBase64Decode(str) {
  let output = str.replace(/-/g, '+').replace(/_/g, '/');
  switch (output.length % 4) {
    case 0: { break; }
    case 2: { output += '=='; break; }
    case 3: { output += '='; break; }
    default:
      throw new Error('Illegal base64url string!');
  }
  return window.decodeURIComponent(escape(window.atob(output))); // polyfill https://github.com/davidchambers/Base64.js
}

export function decodeToken(token) {
  const parts = token.split('.');

  if (parts.length !== 3) {
    throw new Error('JWT must have 3 parts');
  }

  const decoded = urlBase64Decode(parts[1]);
  if (!decoded) {
    throw new Error('Cannot decode the token');
  }

  return JSON.parse(decoded);
}

function getTokenExpirationDate(token) {
  const decoded = decodeToken(token);

  if (typeof decoded.exp === 'undefined') {
    return null;
  }

  const d = new Date(0); // The 0 here is the key, which sets the date to the epoch
  d.setUTCSeconds(decoded.exp);

  return d;
}

export function isTokenExpired(token, offsetSeconds = 0) {
  const d = getTokenExpirationDate(token);

  if (d === null) {
    return false;
  }

  // Token expired?
  return !(d.valueOf() > (new Date().valueOf() + (offsetSeconds * 1000)));
}

function hideBody() {
  document.body.style.display = 'none';
}

function showBody() {
  document.body.style.display = 'inline';
}

export function verifyAuth({
  auth0ClientId,
  auth0Domain,
  defaultHref = '/',
  callbackURL = window.location.pathname,
  scope = 'openid name email app_metadata user_metadata roles',
  lockOptions = {},
}) {
  // hide the page in case there is an SSO session (to avoid flickering)
  hideBody();

  const lock = new Auth0Lock(auth0ClientId, auth0Domain);

  // sso requires redirect mode, hence we need to parse
  // the response from Auth0 that comes on location hash
  const hash = lock.parseHash(window.location.hash);
  if (hash && hash.id_token) {
    // the user came back from the login (either SSO or regular login),
    // save the token
    localStorage.setItem(tokenStorageKey, `"${hash.id_token}"`);
    window.location.href = hash.state || defaultHref;
    showBody();
    return Promise.resolve();
  }

  const idToken = localStorage.getItem(tokenStorageKey);

  let tokenIsValid;

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
  return new Promise((resolve) => {
    lock.$auth0.getSSOData((err, data) => {
      if (!err && data.sso) {
        // There is an SSO session.
        // No need to prompt for log in, just redirect for sign in.
        lock.$auth0.signin({
          state: window.location.href, // come back to the current location.
          callbackURL,
          callbackOnLocationHash: true,
          scope,
        });
      } else {
        if (window.location.pathname !== '/') {
          window.location.href = '/?targetUrl=' + window.location.href;
          return resolve();
        }

        showBody();

        const defaultLockOptions = {
          sso: true,
          closable: false,
          disableSignupAction: true,
          // primaryColor: '#0099FF',
          authParams: {
            state: getQueryParameter('targetUrl'),
            scope,
          },
          callbackURL,
          responseType: 'token',
        };

        setTimeout(() => { // Fix lock sometimes not showing.
          lock.show({ ...defaultLockOptions, ...lockOptions }); // eslint-disable-line computed-property-spacing, max-len
        }, 10);
      }
    });
  });
}

export function turnOnSSOSessionCheck({
  auth0ClientId,
  auth0Domain,
  checkInterval = 5000,
}) {
  setInterval(() => {
    if (!localStorage.getItem(tokenStorageKey)) return;

    const lock = new Auth0Lock(auth0ClientId, auth0Domain);

    lock.$auth0.getSSOData((err, data) => {
      // if there is still a session, do nothing
      if (err || (data && data.sso)) return;

      // if we get here, it means there is no session on Auth0,
      // then remove the token and redirect to #login
      localStorage.removeItem(tokenStorageKey);
      window.location.href = '/?targetUrl=' + window.location.href;
    });
  }, checkInterval);
}
