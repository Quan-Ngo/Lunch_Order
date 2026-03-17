sap.ui.define([
    "sap/ui/core/UIComponent"
], function (UIComponent) {
    "use strict";

    return UIComponent.extend("cnma.lunchorder.Component", {
        metadata: {
            manifest: "json"
        },

        init: function () {
            UIComponent.prototype.init.apply(this, arguments);
        },

        createContent: function () {
            return new sap.ui.core.HTML({
                content: "<iframe src='./index.html' style='width:100%; height:100%; min-height:90vh; border:none;'></iframe>"
            });
        }
    });
});
