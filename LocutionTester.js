define(["require", "exports", './AUNLG', 'cif'], function (require, exports, AUNLG, cif) {
    "use strict";
    function test() {
        var testSting = "That's so %specialized(nice)%!";
        var loadResult = cif.init();
        var rawSchema = cif.loadFile("etsData/schema.json");
        var schema = cif.loadSocialStructure(rawSchema);
        var rawCast = cif.loadFile("etsData/cast.json");
        var cast = cif.addCharacters(rawCast);
        var locutions = AUNLG.preprocessDialogue(testSting);
        var testBindings = {
            "x": "Clayton"
        };
        var i;
        for (i = 0; i < locutions.length; i++) {
            console.log(locutions[i].renderText("x", testBindings));
        }
    }
    exports.test = test;
});
