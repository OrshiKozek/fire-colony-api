# Animal Colony Management System Front End

## [Frontend code](https://github.com/OrshiKozek/colony-frontend)

## Development Setup
You'll first need [Node.js](https://nodejs.org/) installed, however I recommend
installing it through [nodenv](https://github.com/nodenv/nodenv) as it provides
a great way to switch between projects' node versions automatically and may
come in handy with your own sponsors' projects.

### Installing Nodenv
The easiest way to install nodenv is through [HomeBrew](https://brew.sh/).
```bash
brew install nodenv
```

and then place the following into your `~/.bash_profile`, `~/.bashrc` or
whatever file your shell sources:
```bash
eval "$(nodenv init -)"
```

If you have any questions, see the [nodenv installation guide](https://github.com/nodenv/nodenv).

You'll then want to install the node version listed in `.node-version` at the
root of this project:
```bash
cd animal-colony-frontend
nodenv install
```

### Installing the Required Dependencies
Node.js comes pre-installed with [NPM](https://www.npmjs.com), and we
use it to sync packages for the project.

To install the dependencies do
```bash
cd fire-colony-api
npm install
```

### Starting the Server
You will need to get the [Firebase CLI](https://firebase.google.com/docs/cli) and login using
```bash
firebase login
```

You can start up the server with
```bash
firebase serve
```

and you'll notice the app begins to listen on [localhost:5000](http://localhost:5000)
and has hot-reloading built in!  You won't need to manually start up the app
every time you make a change, what a world we live in...


### Deploying server
Note that a firebase database instance must be created and the api key must be in the functions directory 
to deploy the REST endpoints. 

```bash
firebase deploy
```

### Previous Version, Spring 2021
[Old Frontend Code](https://github.com/dielhennr/colony-frontend)

[Old Backend Code](https://github.com/dielhennr/fire-colony-api)
