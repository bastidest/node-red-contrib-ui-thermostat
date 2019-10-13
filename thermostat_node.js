'use strict';
function backEndNode(node, config) {
  if (!config || !config.hasOwnProperty("group")) {
    throw 'thermostat_controller.error.no-group';
  }
  this.node = node;
  this.topics = ['set_acked_target_temperature', 'set_measured_temperature'];
  this.config = config;
}

function getDefaultState() {
  return {
    default_target_temperature: 16.5,
    acked_target_temperature: null,
    is_locked: false
  };
}

backEndNode.prototype.getWidget = function () {
  const context = this.node.context();
  console.log(context);
  const state = Object.assign(getDefaultState(), {
    acked_target_temperature: context.get('acked_target_temperature')
  });
  state.node_id = this.config.id;

  console.log('state', state);
  var frontEnd = require('./frontend/ui_thermostat').init(state);
  var html = frontEnd.getHTML();
  var me = this;
  return {
    format: html,
    templateScope: "local",
    emitOnlyNewValues: false,
    forwardInputMessages: false,
    storeFrontEndInputAsState: true,
    initController: frontEnd.getController,
    beforeEmit: function () { return me.beforeEmit.apply(me, arguments); },
    beforeSend: function () { return me.beforeSend.apply(me, arguments); }
  };
}

backEndNode.prototype.beforeEmit = function (msg, payload) {
  // called before the node receives a message
  console.log('beforeEmit', msg, payload);

  if(!payload || this.topics.indexOf(msg.topic) < 0) {
    this.node.error('illegal topic ' + msg.topic);
    // just send an empty message
    return {
      msg: {}
    };
  }

  const context = this.node.context();

  if(msg.topic === 'set_acked_target_temperature') {
    if(typeof payload !== 'number') {
      this.node.error('expected payload type to be number, got ' + (typeof payload));
      return {
	msg: {}
      };
    }
    context.set('acked_target_temperature', payload);
    context.set('current_target_temperature', payload);
  } else if (msg.topic === 'set_measured_temperature') {
    if(typeof payload !== 'number') {
      this.node.error('expected payload type to be number, got ' + (typeof payload));
      return {
	msg: {}
      };
    }
    context.set('measured_temperature', payload);
  }

  msg.payload = {
    acked_target_temperature: context.get('acked_target_temperature'),
    current_target_temperature: context.get('current_target_temperature'),
    measured_temperature: context.get('measured_temperature')
  };

  console.log('emitting', msg);
  return {
    msg
  };
};

backEndNode.prototype.beforeSend = function (_, msg) {
  // called before the node sends a message
  console.log('beforeSend', msg.msg);

  const context = this.node.context();
  context.set('current_target_temperature', msg.msg.payload.current_target_temperature);
  
  return msg.msg;
}

module.exports = backEndNode;
