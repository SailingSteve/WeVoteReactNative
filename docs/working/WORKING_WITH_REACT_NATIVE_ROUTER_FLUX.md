# Working with react-native-router-flux (RNRF)

[React-native-router-flux](https://github.com/aksonov/react-native-router-flux) (RNRF) is what we use for native routing,
the ability to change the "scene" (the outermost component on the screen).

RNRF is a wrapper that extends [react-navigation](https://github.com/react-community/react-navigation) which will become
the core router package for react-native in the near future.

RNRF allows you to create React objects that do not get unloaded from memory, the key example are the objects that you tab
to within a menu.  There are some advantages and disadvantages of objects that don't unmount, the big disadvantage is that
that for these objects that don't dismount, the normal [React Component Lifcycle](https://reactjs.org/docs/react-component.html)
does not occur, for example an object that doesn't dismount, the `componentWillMount()` is only called once per application
life.  `componentWillUnmount()` might not ever be called.  

It appears that `componentDidMount()` doesn't work in react-native, but this may be a short lived bug, but in any case 
`componentWillMount()` is a good substitute that does work.

So to make up for the loss of some of the lifecycle methods, RNRF adds two new static component visibility lifecycle 
methods `onEnter` and `onExit`.  These are a bit strange, in that they are static methods -- the value of `onEnter` is
that it is guaranteed to be called when the component becomes visible, and it is possible to set props, or to call the
RNRF `Actions.refresh()` which mutates state, and will force the (non-static) `componentWillReceiveProps()` to be executed
from which any condional logic can be executed.  In the following example, the entryTime is stored in the object state, and
it is kind of irrelvant if that variable is ever used, since its only purpsose may be to trigger a `componentWillReceiveProps()`.

```
         Actions.refresh({
           entryTime: new Date()
         });
       };
```
If you don't mutate state in `onEnter()` the object goes directly to the `render()`

## Navigating

An early version of this app had a structure like this (extracted from App.js):

<img src="https://github.com/wevote/WeVoteReactNative/blob/develop/docs/images/WeVote%20Scenes.png" alt="alt text" width="600" >

A root scene with no visible component

A tabbar scene to hold the 3 tabs

3 tabs (we_vote_1, ballot_1, and sign_in_1), these tab objects are containers with labels or icons, and
a child component that is displayed in the rest of the screen beneath the tabbar when
the tab is selected.

Then 3 stacks of React components, with "signin_1" as the intial tab (RouteConst.KEY_SIGNIN_1 = "signin_1").  Since SignIn 
is the inital component in the stack on the initial tab, the SignIn.js component came up first when the app 
started.  From an early version of App.js:

```
  return (
    <Router>
      <Scene key={RouteConst.KEY_ROOT}>
        {/* Tab Container */}
        <Scene
          key={RouteConst.KEY_TABBAR}
          tabs={true}
          tabBarPosition="top"
          showIcon={true}
          showLabel={false}
          tabBarStyle={tabStyles.tab_bar}>
          {/* WV Tab */}
          <Stack key={RouteConst.KEY_WE_VOTE_1}
                 hideNavBar
                 tabBarLabel={RouteConst.TAB_LABEL_WV}
                 icon={TabIcon}
          >
            <Scene key={RouteConst.KEY_WELCOME}
                   component={Welcome}
                   type="replace"
                   initial />
          </Stack>
          {/* Ballot Tab */}
          <Stack key={RouteConst.KEY_BALLOT_1}
                 hideNavBar
                 tabBarLabel={RouteConst.TAB_LABEL_BALLOT}
                 icon={TabIcon}
          >
            <Scene key={RouteConst.KEY_BALLOT}
                   component={Ballot}
                   type="replace"
                   initial />
            <Scene key={RouteConst.KEY_LOCATION}
                   component={Location}
                   type="replace" />
            <Scene key="candidate"
                   component={Candidate}
                   backTitle="Back"
                   back />
          </Stack>
          {/* Sign In Tab */}
          <Stack key={RouteConst.KEY_SIGNIN_1}
                 tabBarLabel={RouteConst.TAB_LABEL_SIGN_IN}
                 hideNavBar
                 initial
                 icon={TabIcon}
          >
            <Scene key={RouteConst.KEY_SIGNIN}
                   component={SignIn}
                   type="replace"
                   initial />
            <Scene key={RouteConst.KEY_SOCIAL_SIGNIN}
                   component={SocialSignIn}
                   type="replace" />
            <Scene key={RouteConst.KEY_TWITTER_SIGN_IN_PROCESS}
                   component={TwitterSignInProcess}
                   type="replace" />
            <Scene key={RouteConst.KEY_TERMS_OF_SERVICE}
                   component={TermsOfService}
                   type="replace" />
          </Stack>
        </Scene>
      </Scene>
    </Router>
  );

```


Clicking on the tabs brings up the initial scene (WeVote React component) as you would expect.

Navigating between the scenes within a tab is as simple as (from SignIn.js) calling `Actions.socialSignIn()` at which point 
SocialSignIn.js becomes displayed.  

`type="replace"` causes the component to unmount and get garbage collected once you navigate away, otherwise
the component stays active, which can be very confusing.

The early version of TermsOfService.js was just a static page of contract terms with no controls to
navigate you away, so the only way to navigate was to select another tab, but for some reason RNRF can't directly navigate 
to scenes between tabs.  See [From Nested Scene To Other Nested Scene Navigate #1801](https://github.com/aksonov/react-native-router-flux/issues/1801)

The solution to this challenge is (from TermsOfService.js):

```
  static onExit = () => {
    logging.rnrfLog("onExit from TermsOfService: currentScene = " + Actions.currentScene);
    let destinationScene = Actions.currentScene;
    Actions.signIn();
    Actions.push(destinationScene);
  };

```

`onExit()` is called when the scene is about to stop being displayed.  In this case we save the `Actions.currentScene` which
at this point in the RNRF navigation lifecycle is actually the destination scene (let's say "Ballot"), so we store the 
current scene (string) `'ballot'` in destinationScene, navigate to the initial scene in the stack, then navigate to `ballot` by 
pushing it on the stack.  (If we knew in advance that we always wanted to go to ballot, in this situation, we could just call 
`Actions.ballot()` which would do the same thing.)  This allows you to navigate between stacks.

## Example code

```
import React, { Component } from "react";
import { Text, View } from 'react-native';
import PropTypes from 'prop-types';                                             // Note 1
import { Actions } from 'react-native-router-flux';

import AddressBox from "../../components/AddressBox";                           // Note 2
import RouteConst from "../routeConst"
const logging = require("../../utils/logging");

export default class Location extends Component {
  static propTypes = {
      location: PropTypes.object
  };

  constructor (props){
    super(props);
    this.state = {};
  }

  static onEnter = () => {                                                            // Note 3
    logging.rnrfLog("onEnter to location: currentScene = " + Actions.currentScene);   // Note 4
  };

  static onExit = () => {
    logging.rnrfLog("onExit from location: currentScene = " + Actions.currentScene);  // Note 5
    Actions.refresh({came_from: RouteConst.KEY_LOCATION, forward_to_ballot: false})   // Note 6
  };


  render () {
    logging.renderLog("Location, scene = " + Actions.currentScene);                 // Note 7

    return <View>
        <AddressBox {...this.props} saveUrl="/ballot" />
    </View>;
  }
}
```

**Note 1:**

In the latest versions of React,  PropTypes should be imported from "prop-types", NOT from "react"


**Note 2:**

There is a convention in react-native code where library imports like "import { Actions } from `react-native-router-flux'`
come before app code imports like `import AddressBox from "../../components/AddressBox"` with a separating line inbetween,
and there is a WeVote convention where app code imports are alphabetized.  Please follow these conventions as a courtesy
for other developers.

**Note 3:**

Every react class that is the destination of a RNRF routing, should have a `onEnter()` and an `onExit()` function at the 
top of the file after the `propTypes()` and `constructor()`

**Note 4:**

Every onEnter should contain a line almost exactly like the following:

`logging.rnrfLog("onEnter to location: currentScene = " + Actions.currentScene);`

This logging is controlled by the `LOG_RNRF_ROUTING: true,` constant in config.js, so the logging
can be turned off in production, and on your local if you prefer.  This logging is necessary at this
point in react-native, since the debugger stack trace often does not tell how you got to the component.  

**Note 5:**

Every onExit should contain a line almost exactly like the following:

logging.rnrfLog("onExit from location: currentScene = " + Actions.currentScene);
 
**Note 6:**

Every RNRF scene has a key like `'ballot'` for routing to `src/js/scenes/Ballot/Ballot.js`,
but don't use that string in the code, setup a constant in `src/js/scenes/RouteConst.js`
and use it in `src/js/scenes/App.js` and everywhere else in the app where you navigate to 
the scene defined by that key.

**Note 7:**

Every `render()` should have a line at the top almost exactly like the following"

`logging.renderLog("Location", "scene = " + Actions.currentScene);`

This logging is controlled by `LOG_RENDER_EVENTS: true,` in config.js.  It is astounding how many renders occur for some 
objects, and this allows us to see this behaviour without using breakpoints.  (Breakpoints can be problematic in
react-native, because unline react for webapps that is single threaded, react-native is multithreaded so sometimes
breakpoints don't work.)
 

---

Next: [Debugging Tools and Tips iOS](DEBUGGING_TOOLS_IOS.md)

Next: [Debugging Tools and Tips Android](DEBUGGING_TOOLS_ANDROID.md)

[Go back to Readme Home](../../README.md)
