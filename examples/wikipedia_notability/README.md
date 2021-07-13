
Note: gyp does not play well with Anaconda. It is better to deactivate
any active Anaconda environments and then to install gyp using, e.g.,
`apt-get install node-gyp` (on a Ubuntu system). Do this before
running `npm install`, which installs `wtf_wikipedia`.

`wtf_wikipedia` generates some warnings when installing using npm.
I would welcome any suggestions for how they can be addressed but
for now will ignore them as this is not a public-facing system.
