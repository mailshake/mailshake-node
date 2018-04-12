[![Travis](https://travis-ci.org/mailshake/mailshake-node.svg?branch=master)](https://travis-ci.org/mailshake/mailshake-node)
[![npm](https://img.shields.io/npm/v/mailshake-node.svg?maxAge=86400)](https://www.npmjs.com/package/mailshake-node)
[![npm](https://img.shields.io/npm/dm/mailshake-node.svg?maxAge=86400)](https://www.npmjs.com/package/mailshake-node)
[![npm](https://img.shields.io/npm/l/mailshake-node.svg?maxAge=2592000)](https://www.npmjs.com/package/mailshake-node)

# mailshake-node
This is a Node.js wrapper for the [Mailshake](https://mailshake.com) API. [View the docs here](http://api-docs.mailshake.com).

## Installation
```shell
npm install mailshake-node
```

## Configuration and use
Requiring the `mailshake-node` module takes your API key as an argument. Every operation returns a Promise. Errors from the calling API will populate the `code` property of the error contained by the operation's Promise.

```javascript
let mailshake = require('mailshake-node')('my-api-key');
return mailshake.campaigns.list({
  search: 'Venkman'
})
  .then(result => {
    console.log(JSON.stringify(result, null, 2));
  })
  .catch(err => {
    console.error(`${err.code}: ${err.message}`);
  });
```

> Don't forget to change `my-api-key` to your own key.

### Operations
_See our [docs](http://api-docs.mailshake.com/) for details._

- me
- campaigns.list
- campaigns.get
- campaigns.pause
- campaigns.unpause
- campaigns.export
- campaigns.exportStatus
- leads.list
- leads.get
- leads.close
- leads.create
- leads.ignore
- leads.reopen
- recipients.add
- recipients.addStatus
- recipients.list
- recipients.get
- recipients.pause
- recipients.unpause
- recipients.unsubscribe
- team.list-members
- push.create
- push.delete
- activity.clicks
- activity.createdLeads
- activity.leadStatusChanges
- activity.opens
- activity.replies
- activity.sent

### Paging
When a request accepts paging parameters, a call to get the next page is conveniently attached to your result.

```javacsript
mailshake.campaigns.list()
  .then(result => {
    console.log(`Page 1: ${JSON.stringify(result, null, 2)}`);
    // Just call `next` to get the next page of data
    return result.next();
  })
  .then(result => {
    console.log(`Page 2: ${JSON.stringify(result, null, 2)}`);
  });
```

## Push handling
The Mailshake API lets you subscribe to real-time pushes so you can react in your app. To do this you tell Mailshake where to make HTTPS requests, your web server handles them, and sends back a `200` status. See [our docs on this](http://api-docs.mailshake.com/#Pushes) for more details.

### The easiest way to get started requires a few things:

- use [`express`](https://expressjs.com/) as your web server
- specify your external base url
- specify a path to handle Mailshake pushes
- specify a secret to secure your web hook

```javascript
let express = require('express');
let bodyParser = require('body-parser');
let mailshake = require('mailshake-node')('my-api-key');
let PushHandler = require('mailshake-node').PushHandler;

// Initialize your express app, making sure to include bodyParser
let app = express();
app.use(bodyParser.json({}));

// Set up how your site is being hosted
let handler = new PushHandler(mailshake, {
  baseUrl: 'https://mailshake-test.ngrok.io',
  rootPath: 'pushes',
  secret: 'my-secret'
});

// Listen when pushes are received and take action
handler.on('push', push => {
  console.log(JSON.stringify(push, null, 2));
});

// Listen when there was some kind of error handling a push
handler.on('pushError', err => {
  console.error(`${err.code}: ${err.stack}`);
});

// Hook it up
handler.hookExpress(app);

// Start your server
let port = 80;
app.listen(port);
console.log(`Listening on http://127.0.0.1:${port}`);
```

> Don't forget to change `my-api-key` to your own key.

#### Subscribing to pushes
Tell Mailshake what you want to listen for. This option will automatically format your subscription so that `PushHandler` can handle it.

```javascript
handler.subscribe('Clicked', { /* filter options */ })
  .then(targetUrl => {
    // Store targetUrl somewhere so you can unsubscribe later
  })
  .catch(err => {
    console.error(`${err.code}: ${err.stack}`);
  });
```

#### Unsubscribing pushes
When you're done, unsubscribe to stop receiving pushes.

```javascript
handler.unsubscribe(targetUrl)
  .catch(err => {
    console.error(`${err.code}: ${err.stack}`);
  });
```

### Other details
Mailshake will send your server a request like this:

```json
{
  "resource_url": "https://api.mailshake.com/2017-04-01/..."
}
```

Use the `resolvePush` operation to fetch the full data behind the push.

```javascript
let resolvePush = require('mailshake-node').resolvePush;
resolvePush(mailshake, { /* the object Mailshake sent your server */ })
.then(result => {
  console.log(JSON.stringify(result, null, 2));
})
.catch(err => {
  console.error(`${err.code}: ${err.message}`);
});
```

### A more hands-on approach when using `express`
In case you can't or don't want to use our more complete `PushHandler` solution,  a `pushHandlerExpress` function is exposed on this module that encapsulates fetching the push's details and communicating back to Mailshake about the receipt being successful or not.

```javascript
let pushHandlerExpress = require('mailshake-node').pushHandlerExpress;
/*
 * NOTE:
 * Put this code inside the handler for your endpoint: */
pushHandlerExpress(mailshake, receivedPush, response)
  .then(result => {
    console.log(JSON.stringify(result, null, 2));
  })
  .catch(err => {
    console.error(`${err.code}: ${err.message}`);
  });
```

### Subscribing to pushes
If you're not using [our main handler](#user-content-subscribing-to-pushes), you can subscribe to pushes like this:

```javascript
return mailshake.push.create({
  targetUrl: '[a unique url for this push to store for later so you can unsubscribe]',
  event: 'Clicked',
  filter: {  /* filter options */ }
})
  .then(result => {
    // Nothing really to do here
  })
  .catch(err => {
    console.error(`${err.code}: ${err.message}`);
  });
```

Unsubscribe your subscriptions like this:

```javascript
return mailshake.push.delete({
  targetUrl: '[your unique url for the push to unsubscribe]'
})
  .then(result => {
    // Nothing really to do here
  })
  .catch(err => {
    console.error(`${err.code}: ${err.message}`);
  });
```

## Contributions
If you have improvements, please create a pull request for our consideration.

## Testing
Our test suites for this module aren't yet part of the source. At the moment only one test is wired up here as a sanity check and to test connectivity. To use it create a local `CONFIG.json` file in the root directory of this repo like this:

```json
{
  "apiKey": "my-api-key"
}
```

Update it with your API key and then run `npm test`.
