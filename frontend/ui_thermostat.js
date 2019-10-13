'use strict';

const path = require('path');
const fs = require('fs');

module.exports.init = function (config) {
  var conf = config;
    
  function getCSS() {
    const css = path.join(__dirname, 'ui_thermostat.css');
    const cssString = fs.readFileSync(css, 'utf-8');
    return '<style>' + cssString + '</style>';
  }

  function getHTML() {
    const html = path.join(__dirname, 'ui_thermostat.html');
    const htmlString = fs.readFileSync(html, 'utf-8');
    console.log(config);
    const ret = htmlString
	  .replace('__templ_id__', config.node_id)
	  .replace('__templ_config__', JSON.stringify(config));
    return ret;
  }

  function getController($scope, events) {
    const that = {
      defaultTargetTemperature: null,
      ackedTargetTemperature: null,
      currentTargetTemperature: null,
      newTargetTemperature: null,
      newTargetTemperatureIsValid: null,
      measuredTemperature: null,
      isLocked: null,
      init(config) {
        console.log('init called', config);
	this.send = $scope.send;
	this.config = config;
	this.rootElement = document.getElementById(this.config.node_id);
	this.okButton = this.rootElement.getElementsByClassName('ui_thermostat__button')[0];
	this.upButton = this.rootElement.getElementsByClassName('ui_thermostat__arrow-up')[0];
	this.downButton = this.rootElement.getElementsByClassName('ui_thermostat__arrow-down')[0];
	this.inputElement = this.rootElement.getElementsByClassName('ui_thermostat__input')[0];
	this.lockIcon = this.rootElement.getElementsByClassName('ui_thermostat__lock-icon')[0];
	this.measuredElement = this.rootElement.getElementsByClassName('ui_thermostat__measured')[0];

	this.okButton.addEventListener('click', () => {
	  this.onSubmit();
	});
	this.upButton.addEventListener('click', () => {
	  this.onIncrement();
	});
	this.downButton.addEventListener('click', () => {
	  this.onDecrement();
	});
	this.lockIcon.addEventListener('click', () => {
	  this.setIsLocked(!this.isLocked);
	});
	this.inputElement.addEventListener('input', (e) => {
	  console.log('input', e);
	  this.onChange(e.target.value);
	}, true);

	this.defaultTargetTemperature = config.default_target_temperature;
	this.setNewTargetTemperature(config.target_temperature, true);
	this.setAckedTargetTemperature(config.acked_target_temperature);
	this.setIsLocked(config.is_locked);
      },
      onMessage(msg) {
	if(msg.outgoing) {
	  // ignore outgoing messages
	  return;
	}
	console.log('received message', msg);
	this.setAckedTargetTemperature(msg.payload.acked_target_temperature);
	this.setCurrentTargetTemperature(msg.payload.current_target_temperature, true);
	this.setMeasuredTemperature(msg.payload.measured_temperature);
      },
      onSubmit() {
	console.log(this);
	this.currentTargetTemperature = this.newTargetTemperature;
	this.send({
	  outgoing: true,
	  payload: {
	    target_temperature: this.newTargetTemperature,
	    is_locked: this.isLocked
	  }
	});
	this.updateInputStyles();
      },
      onIncrement() {
	this.setNewTargetTemperature(this.newTargetTemperature + .5, true);
      },
      onDecrement() {
	this.setNewTargetTemperature(this.newTargetTemperature - .5, true);
      },
      onChange(newVal) {
	if(!/[0-9][0-9]?.[05]/.test(newVal)) {
	  console.log('onChange test failed for', newVal);
	  this.setNewTargetTemperatureIsValid(false);
	  return;
	}
	let parsedTemp = parseFloat(newVal);
	this.setNewTargetTemperature(parsedTemp, false);
      },
      setAckedTargetTemperature(ackedTemp) {
	this.ackedTargetTemperature = ackedTemp;
	this.updateInputStyles();
      },
      setCurrentTargetTemperature(newTemp) {
	this.currentTargetTemperature = newTemp;
	this.setNewTargetTemperature(newTemp, true);
      },
      setNewTargetTemperature(newTemp, changeInput) {
	if(newTemp === undefined || newTemp  === null) {
	  this.newTargetTemperature = this.defaultTargetTemperature;
	} else {
	  this.newTargetTemperature = newTemp;
	}
	if(changeInput) {
	  this.inputElement.value = this.newTargetTemperature.toFixed(1);
	}
	this.setNewTargetTemperatureIsValid(true);
      },
      setNewTargetTemperatureIsValid(isValid) {
	this.newTargetTemperatureIsValid = isValid;
	this.updateInputStyles();
      },
      setMeasuredTemperature(newTemp) {
	if(newTemp === undefined || newTemp === null) {
	  
	} else {
	  this.measuredTemperature = newTemp;
	  this.measuredElement.innerHTML = this.measuredTemperature.toFixed(1) + ' °C';
	}
      },
      setIsLocked(isLocked) {
	this.isLocked = isLocked;
	if(isLocked) {
	  this.lockIcon.innerHTML = 'lock';
	} else {
	  this.lockIcon.innerHTML = 'lock_open';
	}
      },
      updateInputStyles() {
	if(!this.newTargetTemperatureIsValid) {
	  this.setInputStyle('invalid');
	} else if(this.newTargetTemperature !== this.currentTargetTemperature) {
	  this.setInputStyle('changed');
	} else if(this.newTargetTemperature !== this.ackedTargetTemperature) {
	  this.setInputStyle('not-acked');
	} else {
	  this.setInputStyle('ok');
	}
      },
      setInputStyle(state) {
	const inputBaseName = 'ui_thermostat__input';
	this.inputElement.setAttribute('class', inputBaseName + ' ' + inputBaseName + '--' + state);
	if(state === 'changed') {
	  this.okButton.removeAttribute('disabled');
	} else {
	  this.okButton.setAttribute('disabled', true);
	}
      }
    }
    
    $scope.init = function(config) {
      that.init(config);
    };
    $scope.$watch('msg', function(newVal, oldVal) {
      if($scope.msg) {
	that.onMessage($scope.msg);
      }
    });
  }

  return {
    getHTML: function () {
      return getCSS() + getHTML();
    },
    getController
  };
};
