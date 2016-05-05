define(["require", "exports", './AUNLG', 'cif'], function (require, exports, AUNLG, cif) {
    "use strict";
    function test() {
        var testSpecialized = "That's so %specialized(nice)%!";
        var testRandom = "This is %random(wicked, wretched, awesome)%!";
        var testGendered = "Clayton is having trouble keeping %gendered(his/her/their)% partner happy.";
        var loadResult = cif.init();
        var rawSchema = cif.loadFile("etsData/schema.json");
        var schema = cif.loadSocialStructure(rawSchema);
        var rawCast = cif.loadFile("etsData/cast.json");
        var cast = cif.addCharacters(rawCast);
        var locutions = AUNLG.preprocessDialogue(testSpecialized);
        var testBindings = {
            "x": "Clayton"
        };
        var i;
        var locutions = AUNLG.preprocessDialogue(testGendered);
        console.log("The raw dialogue string was: " + testGendered);
        for (i = 0; i < locutions.length; i++) {
            console.log(locutions[i].renderText("x", testBindings));
        }
    }
    exports.test = test;
});
