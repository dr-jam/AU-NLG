define(["require", "exports", './AUNLG'], function (require, exports, AUNLG) {
    "use strict";
    function test() {
        var testSting = "That's so %specialized(x, badass)%!";
        var testSting = "This is %random(wicked, wretched, awesome)%!";
        var LOCUTION_STRINGS = ["RANDOM"];
        var testBinding = {
            "x": "Clayton"
        };
        var locutions = AUNLG.preprocessDialogue(testSting, testBinding);
        var i;
        for (i = 0; i < locutions.length; i++) {
            console.log(locutions[i].renderText());
        }
        var testCastMember = {
            "Clayton": {
                "name": "Clayton",
                "profession": "Farmer",
                "graphics": {
                    "icon": "farmer",
                    "body": "f",
                    "head": "o",
                    "hair": "b",
                    "nose": "c",
                    "eyes": "a",
                    "mouth": "d"
                },
                "specialWords": {
                    "nice": "awesome",
                    "badass": "sparkplug"
                },
                "pronoun": "he"
            }
        };
    }
    exports.test = test;
});
