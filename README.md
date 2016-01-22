Auth SSO Util
=========================

The library presently depends on `Auth0Lock` to be available globally.

Include [Auth0's Lock](https://github.com/auth0/lock) as follows:

```html
<!-- Latest major release -->
<script src="http://cdn.auth0.com/js/lock-8.min.js"></script>

<!-- Latest minor release -->
<script src="http://cdn.auth0.com/js/lock-8.x.min.js"></script>

<!-- Latest patch release (recommended for production) -->
<script src="http://cdn.auth0.com/js/lock-8.x.y.min.js"></script>
```

Import the library into a file that will be run immediately on load.

```js
import {verifyAuth, turnOnSSOSessionCheck} from './lib/smrxt-auth-plugin.js'
```

Start the verification of authentication before loading your app code.

```js
verifyAuth({
   auth0ClientId: APP_ENV.AUTH0_CLIENT_ID,
   auth0Domain: APP_ENV.AUTH0_DOMAIN,
   defaultHref: '/app',
   callbackURL: APP_ENV.APP_URL,
}).then(() => {
   // Your app init code.
});
```

To enable Single Sign Out, we can turn on SSO session check on some interval. Therefore, if
a user signs out of one of our other applications, their session will be invalidated here.

```js
turnOnSSOSessionCheck({
   auth0ClientId: APP_ENV.SMRXT_AUTH0_CLIENT_ID,
   auth0Domain: APP_ENV.SMRXT_AUTH0_DOMAIN,
   interval: 10000, // default 5000 (ms)
});
```

TODO:

1. Export a method to sign users out of Auth0.
2. Inject window, document, Auth0Lock to remove globals dependence.
3. Tests.