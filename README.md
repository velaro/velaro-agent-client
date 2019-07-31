### Development
Install the following:
- node
- yarn
- python 2.7

Then run `yarn start`

if you see errors related to native dependencies, run `yarn rebuild`. This will rebuild native
dependencies for the version of node.js currently being used by electron.

### Environments

To test in different environments, set environment variable VELARO_ENV to any of the following:

- development
- test
- staging
- production

### Release

To create a release, update the version number in package.json. Then visit the repository and
draft a new release. The tag version should be the version number prefixed with `v`. For example,
`v1.0.1` when the version number is `1.0.0`. Set the Release title to whatever you want. Now
push to the remote.

All commits on the master branch will execute an Azure Pipelines build and artifacts
will be uploaded to GitHub. When the release is final, publish the release on GitHub. All
NSIS and DMG clients will auto-update from this release. Future commits on this version will
not upload new artifacts.

### Logs

 * **Mac:** `~/Library/Logs/Velaro/log.log`
 * **Windows:** `%USERPROFILE%\AppData\Roaming\Velaro\log.log`

### Notes:

NSIS installer `"oneClick": false` will cause issues with the auto update process in many cases.
One observed scenario was the app uninstalling on close, but failing to install due to insufficient
privileges. Some details:

https://github.com/electron-userland/electron-builder/issues/2317
https://github.com/electron-userland/electron-builder/issues/4070

This is closed, but appears to be the issue I experienced:
https://github.com/electron-userland/electron-builder/issues/2363
