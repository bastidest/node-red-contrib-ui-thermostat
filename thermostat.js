module.exports = function (RED) {
    'use strict';
    var ui = undefined;
    function getNode(config) {
        try {
            var node = this;
            if (ui === undefined) {
                ui = RED.require("node-red-dashboard")(RED);
            }
            RED.nodes.createNode(this, config);
            //initialize backEnd module
            var done = null;
            try {
                var ThermostatNode = require('./thermostat_node.js');
                var backModule = new ThermostatNode(node, config);
                done = ui.addWidget(Object.assign({
                    node: node,
                    width: parseInt(config.width),
                    height: parseInt(config.height),
                    group: config.group,
                    order: config.order || 0
                }, backModule.getWidget()));
            } catch (error) { 
                throw error;
            }
        } catch (e) {
            console.log(e);
        }
        node.on("close", function () {
            if (done) {
                done();
            }
        });
    }
    RED.nodes.registerType('ui_thermostat', getNode);
};
