define(["require", "exports", './AUNLG', 'cif'], function (require, exports, AUNLG, cif) {
    "use strict";
    function test() {
        var testStrings = [
            "That's so %specialized(nice)%!",
            "This is %random(wicked, wretched, awesome)%!",
            "Clayton is having trouble keeping %gendered(his/her/their)% partner happy.",
            "%charVal(name)% is a %charVal(profession)%.",
            "I cannot stand to be around %characterValue(name)%!",
            "%charVal(name)%'s dog is soo cute!"
        ];
        var testBindings = {
            "x": "Clayton"
        };
        var loadResult = cif.init();
        var rawSchema = cif.loadFile("etsData/schema.json");
        var schema = cif.loadSocialStructure(rawSchema);
        var rawCast = cif.loadFile("etsData/cast.json");
        var cast = cif.addCharacters(rawCast);
        var i;
        for (i = 0; i < testStrings.length; i++) {
            console.log("\n");
            testDialogueString(testStrings[i], "x", testBindings);
        }
    }
    exports.test = test;
    function getRenderedTexts(pLocutions, pSpeaker, pBindings) {
        var renderedTexts = [];
        var i;
        for (i = 0; i < pLocutions.length; i++) {
            renderedTexts.push(pLocutions[i].renderText(pSpeaker, pBindings));
        }
        return renderedTexts;
    }
    function testDialogueString(pDialogue, pSpeaker, pBindings) {
        console.log(pDialogue);
        var locutions = AUNLG.preprocessDialogue(pDialogue);
        var locutionStrings = getRenderedTexts(locutions, pSpeaker, pBindings);
        console.log(locutionStrings.join(""));
    }
});
