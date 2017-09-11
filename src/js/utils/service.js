/**
 * The idea of this APIS.js file is to abstract away the details
 * of many repetitive service calls that we will be using.
 * @author Nick Fiorini <nf071590@gmail.com>
 */
"use strict";

import {Linking, WebView} from 'react-native';
import * as request from "superagent";
import CookieStore from '../stores/CookieStore';
const Dispatcher = require("flux/lib/Dispatcher");
const url = require("url");
const assign = require("object-assign");
const webAppConfig = require("../config");

const DEBUG = false;


let steveTest = CookieStore.getItem("voter_device_id");
console.log("steveTest = " + steveTest);

const defaults = {
  dataType: "json",
  baseUrl: webAppConfig.WE_VOTE_SERVER_API_ROOT_URL,
  url: webAppConfig.WE_VOTE_SERVER_API_ROOT_URL,
  query: {},
  type: "GET",
  data: function () {
    const id = CookieStore.getItem("voter_device_id");
    return id.length > 0 ? {
      voter_device_id: id
    } : {};
  },
  success: (res) => console.warn("Success function not defined:", res),
  error: (err) => console.error(err.message)
};

export function $ajax (options) {
  if (!options.endpoint) throw new Error("$ajax missing endpoint option");

  options.data = assign({}, defaults.data(), options.data || {});
  options.crossDomain = true;
  options.success = options.success || defaults.success;
  options.error = options.error || defaults.error;
  options.url = url.resolve(defaults.baseUrl, options.endpoint) + "/";

  if(options.data) {
    options.url += (options.url.indexOf('?') === -1 ? '?' : '&') + queryParams(options.data);
  }
  return fetch(options.url)
    .then((response) => response.json())
    .then((responseJson) => {
      console.log("steveTest", CookieStore.getItem("voter_device_id"));
      console.log(options.data);
        console.log("responseJson", options.endpoint, responseJson);
        const res = responseJson;
        this.dispatch({ type: options.endpoint, res });
    })
    .catch((error) => {
      console.error(error, options.endpoint);
      this.dispatch({type: "error-" + options.endpoint, error});
    });
  //return window.$.ajax(options);
}

export function $ajax_twitter_sign_in (options) {
  if (!options.endpoint) throw new Error("$ajax missing endpoint option");
  options.data = assign({}, defaults.data(), options.data || {});
  options.crossDomain = true;
  options.success = options.success || defaults.success;
  options.error = options.error || defaults.error;
  options.url = url.resolve(defaults.baseUrl, options.endpoint) + "/";

  if(options.data) {
    options.url += (options.url.indexOf('?') === -1 ? '?' : '&') + queryParams(options.data);
  }
  return fetch(options.url)
    .then((response) => response.json())
    .then((responseJson) => {
        const res = responseJson;
        if (res.twitter_redirect_url) {
          Linking.openURL(res.twitter_redirect_url).catch(err => console.error('An error occurred', err));
        } else {
          console.log("twitterSignInStart ERROR res: ", res);
          Linking.openURL("").catch(err => console.error('An error occurred', err));
        }
    })
    .catch((error) => {
      console.error(error, options.endpoint);
      Linking.openURL("").catch(err => console.error('An error occurred', err));
    });
}

function queryParams(params) {
  return Object.keys(params)
  .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]))
  .join('&');
}

export function get (options) {
  let opts = assign(defaults, options);

  opts.url = url.resolve(opts.baseUrl, opts.endpoint);
  // We add voter_device_id to all endpoint calls
  opts.query.voter_device_id = CookieStore.getItem("voter_device_id");

  return new Promise( (resolve, reject) => new request.Request("GET", opts.url)
    .accept(opts.dataType)
    .query(opts.query)
    .withCredentials()
    .end((err, res) => {
      if (err) {
        if (opts.error instanceof Function === true)
          opts.error(err || res.body);

        reject(err);
      } else {
        if (opts.success instanceof Function === true)
          opts.success(res.body);
        else if (DEBUG)
          console.warn(res.body);

        resolve(res.body);
      }
    })
  );
}
