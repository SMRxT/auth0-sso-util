# Change log

All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

## 0.1.0 - Initial Release for testing

Caveats:

* Hard dependence on Auth0Lock already loaded.
* Dependence on `window`, `window.location`, and `document` globals for managing redirections and  DOM manipulation.

* Initial implementation of `verifyAuth` and `turnOnSSOSessionCheck`.
* `verifyAuth`
  * Verify `userToken` is in local storage and token is valid and not expired.
  * If `userToken` is not present, present Auth0 Lock to log in.
  * Handle callback urls and redirecting to original targetUrl upon successful login.
  * Check for user SSO session with Auth0 and authenticate user if it does.
  * In all cases, on successful login, store JWT in `userToken`.
* `turnOnSSOSessionCheck`
  * On some interval (default 5 seconds), check for an Auth0 SSO session and if it does not exist, log out the user and have them sign back in.

