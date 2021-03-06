import React, { Component } from "react";
import PropTypes from 'prop-types';
//import { Button } from "react-bootstrap";
import VoterGuideStore from "../../stores/VoterGuideStore";
import VoterGuideActions from "../../actions/VoterGuideActions";
import VoterStore from "../../stores/VoterStore";

export default class FollowToggle extends Component {
  static propTypes = {
    we_vote_id: PropTypes.string.isRequired,
  };

  constructor (props) {
    super(props);
    this.state = {
      voter: {
        we_vote_id: ""
      }
    };
  }

  componentDidMount (){
    this.voterGuideStoreListener = VoterGuideStore.addListener(this._onVoterGuideStoreChange.bind(this));
    this._onVoterGuideStoreChange();
    this.voterStoreListener = VoterStore.addListener(this._onVoterStoreChange.bind(this));
    this._onVoterStoreChange();
  }

  componentWillUnmount (){
    this.voterGuideStoreListener.remove();
    this.voterStoreListener.remove();
  }

  _onVoterGuideStoreChange (){
    this.setState({ is_following: VoterGuideStore.isFollowing(this.props.we_vote_id)});
  }

  _onVoterStoreChange (){
    this.setState({ voter: VoterStore.getVoter()});
  }

  toggleFollow () {
    this.state.is_following = !this.state.is_following;
  }

  render () {
    if (!this.state) { return <div />; }
    let we_vote_id = this.props.we_vote_id;
    let is_following = this.state.is_following;
    let is_looking_at_self = this.state.voter.linked_organization_we_vote_id === we_vote_id;
    // You should not be able to follow yourself
    if (is_looking_at_self) { return <div />; }


    const followFunc = VoterGuideActions.organizationFollow.bind(this, we_vote_id);
    const stopFollowingFunc = VoterGuideActions.organizationStopFollowing.bind(this, we_vote_id);

    var stopFollowingInstantly = function () {
      is_following = false;
      stopFollowingFunc();
    };

    var followInstantly = function () {
      is_following = true;
      followFunc();
    };

    return is_following ?
        <Button bsStyle="warning"
                bsSize="small"
                className="pull-right"
                onClick={stopFollowingInstantly}>
                <span>Unfollow</span>
        </Button> :
        <Button bsStyle="info" bsSize="small" className="pull-right" onClick={followInstantly}><span>Follow</span></Button>;
  }
}
