const express = require('express');
const cookieParser = require('cookie-parser');
const { newEnforcer } = require('casbin');
const axios = require('axios');
const FormData = require('form-data');// more info at:
// https://github.com/auth0/node-jsonwebtoken
// https://jwt.io/#libraries
const jwt = require('jsonwebtoken');
const { access } = require('fs');

const port = 8080;
//const CLIENT_ID = process.env.CLIENT_ID
//const CLIENT_SECRET = process.env.CLIENT_SECRET
//const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID
//const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET
const CLIENT_ID = '94846533224-ofstjahd6e24c5faur7343ver4kgbned.apps.googleusercontent.com'
const CLIENT_SECRET ='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'
const GITHUB_CLIENT_ID = 'ca81af0366c0fc989806'
const GITHUB_CLIENT_SECRET='67677e44036c86c3a2efe2631737e04742e1532f'
const CALLBACK = 'callback'


const app = express();
app.use(cookieParser());
/*
const accessControlMiddleware = async (req, res, next) => {
  const sub = req.user.id; 
  const obj = req.path; 
  const act = req.method; 
  const enforcer = await newEnforcer('basic_model.conf', 'basic_policy.csv');
  const allowed = await enforcer.enforce(sub, obj, act);

  if (!allowed) {
    return res.status(403).send('Access forbidden');
  }

  next();
};
*/
// Rota principal
app.get('/', (req, res) => {
  res.send('<a href=/login>Use Google Account</a>')
});

app.get('/login', (req, resp) => {
  resp.redirect(302,
      // authorization endpoint
      'https://accounts.google.com/o/oauth2/v2/auth?'
      
      // client id
      + 'client_id='+ CLIENT_ID +'&'
      
      // OpenID scope "openid email"
      + 'scope=openid%20email&'
      
      // parameter state is used to check if the user-agent requesting login is the same making the request to the callback URL
      // more info at https://www.rfc-editor.org/rfc/rfc6749#section-10.12
      + 'state=value-based-on-user-session&'
      
      // responde_type for "authorization code grant"
      + 'response_type=code&'
      
      // redirect uri used to register RP
      + `redirect_uri=http://localhost:${port}/`+CALLBACK)
})

app.get('/'+CALLBACK, (req, resp) => {
  //
  // TODO: check if 'state' is correct for this session
  //

  console.log('making request to token endpoint')
  // content-type: application/x-www-form-urlencoded (URL-Encoded Forms)
  const form = new FormData();
  form.append('code', req.query.code);
  form.append('client_id', CLIENT_ID);
  form.append('client_secret', CLIENT_SECRET);
  form.append('redirect_uri', `http://localhost:${port}/`+CALLBACK);
  form.append('grant_type', 'authorization_code');
  //console.log(form);

  axios.post(
      // token endpoint
      'https://www.googleapis.com/oauth2/v3/token', 
      // body parameters in form url encoded
      form,
      { headers: form.getHeaders() }
    )
    .then(function (response) {
      // AXIOS assumes by default that response type is JSON: https://github.com/axios/axios#request-config
      // Property response.data should have the JSON response according to schema described here: https://openid.net/specs/openid-connect-core-1_0.html#TokenResponse

      
      // decode id_token from base64 encoding
      // note: method decode does not verify signature
      var jwt_payload = jwt.decode(response.data.id_token)
      

      // a simple cookie example
     
      resp.cookie("GoogleID_Token", jwt_payload)
      // HTML response with the code and access token received from the authorization server
      resp.send(
          '<div> callback with code = <code>' + req.query.code + '</code></div><br>' +
          '<div> client app received access code = <code>' + response.data.access_token + '</code></div><br>' +
          '<div> id_token = <code>' + response.data.id_token + '</code></div><br>' +
          '<div> Hi <b>' + jwt_payload.email + '</b> </div><br>' +
          '<div>Go back to <a href="/">Home screen</a>'+
          '<div><a href="/github">github</a>'
      );
    })
    .catch(function (error) {
      console.log(error)
      resp.send()
    });
})

app.get('/github', (req, resp) => {
  resp.redirect(302,
      // authorization endpoint
      'https://github.com/login/oauth/authorize?'
      
      // client id
      + 'client_id='+ GITHUB_CLIENT_ID +'&'
      
      // OpenID scope "openid email"
      + 'scope=20'
      
      // parameter state is used to check if the user-agent requesting login is the same making the request to the callback URL
      // more info at https://www.rfc-editor.org/rfc/rfc6749#section-10.12
      + 'state=value-based-on-user-session&'
      
      // redirect uri used to register RP
      + `redirect_uri=http://localhost:${port}/github/`+CALLBACK)
})

app.get('/github/'+ CALLBACK, (req, resp) => {
  //
  // TODO: check if 'state' is correct for this session
  //

  console.log('making request to token endpoint')
  // content-type: application/x-www-form-urlencoded (URL-Encoded Forms)
  const form = new FormData();
  form.append('code', req.query.code);
  form.append('client_id', GITHUB_CLIENT_ID);
  form.append('client_secret', GITHUB_CLIENT_SECRET);
  form.append('redirect_uri', `http://localhost:${port}/github/`+CALLBACK);
  form.append('grant_type', 'authorization_code');
  form.append('Accept','application/xml')
  //console.log(form);

  axios.post(
      // token endpoint
      'https://github.com/login/oauth/access_token', 
      // body parameters in form url encoded
      form,
      { headers: form.getHeaders() }
    )
    .then(function (response) {
      // AXIOS assumes by default that response type is JSON: https://github.com/axios/axios#request-config
      // Property response.data should have the JSON response according to schema described here: https://openid.net/specs/openid-connect-core-1_0.html#TokenResponse
      
     
      
      // decode id_token from base64 encoding
      // note: method decode does not verify signature
      accessToken=JSON.stringify(response.data).split('&')[0].split('=')[1]
      
      // a simple cookie example
      resp.cookie("GitHub_Access_Token",accessToken)
      // HTML response with the code and access token received from the authorization server
      resp.send(
          '<div> callback with code = <code>' + req.query.code + '</code></div><br>' +
          '<div> client app received access code = <code>' + response.access_token + '</code></div><br>' +
          //'<div> id_token = <code>' + response.data.id_token + '</code></div><br>' +
    //      '<div> Hi <b>' + jwt_payload.email + '</b> </div><br>' +
          '<div>Go back to <a href="/">Home screen</a>'+
          '<div><a href="/github/milestones">Milestones</a>'
      );
    })
    .catch(function (error) {
      console.log(error)
      resp.send()
    });
})

// Middleware de controle de acesso
const OWNER = 'andrefilthy'
const REPO = 'SegInf'

app.get('/github/milestones', async (req, res) => {
  try {
    console.log(req.headers.cookie.split(';')[2].split('=')[1])
    const githubToken = req.headers.cookie.split(';')[2].split('=')[1];
    
    const response = await axios.get(`https://api.github.com/repos/${OWNER}/${REPO}/milestones`, {
      headers: {
        Authorization: `Bearer ${githubToken}`,
      },
    });
    console.log(response)

    const milestones = response.data;
    res.json({ milestones });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch milestones from GitHub' });
  }
});

app.post('/github/milestones/:milestoneId/tasks', async (req, res) => {
  try {
    const { milestoneId } = req.params;
    const githubToken = req.user.githubAccessToken;
    const googleAccessToken = req.user.googleAccessToken; 
    const response = await axios.get(`https://api.github.com/repos/owner/repository/milestones/${milestoneId}`, {
      headers: {
        Authorization: `Bearer ${githubToken}`,
      },
    });

    const milestone = response.data;

    // Map GitHub milestone data to Google Tasks format
    const taskData = {
      title: milestone.title,
      notes: milestone.description,
      due: milestone.due_on,
    };

    // Create a task in Google Tasks
    const createdTask = await createTaskInGoogleTasks(taskData, googleAccessToken);

    res.json({ message: 'Task created in Google Tasks from GitHub milestone', task: createdTask });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create task from GitHub milestone' });
  }
});

async function createTaskInGoogleTasks(taskData, accessToken) {
  const taskEndpoint = 'https://www.googleapis.com/tasks/v1/lists/@default/tasks';

  try {
    const response = await axios.post(taskEndpoint, taskData, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return response.data;
  } catch (error) {
    throw new Error('Failed to create task in Google Tasks');
  }
}

// Iniciar servidor
app.listen(port, (err) => {
  if (err) {
      return console.log('something bad happened', err)
  }
  console.log(`server is listening on ${port}`)
})
