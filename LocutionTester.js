define(["require", "exports", './AUNLG', 'cif'], function (require, exports, AUNLG, cif) {
    "use strict";
    function test() {
        var testStrings = [
            "That's so %specialized(nice)%!",
            "This is %random(wicked, wretched, awesome)%!",
            "%charVal(name)% is having trouble keeping %gendered(his/her/their)% partner happy.",
            "%gendered('He was'/'She was'/'They were')% turned into a %gendered(blue/yellow/red)% parrot.",
            "%gendered(Mr./Mrs./Mx.)% %charVal(name)% sent an RSVP already.",
            "%charVal(name)% is a %charVal(profession)%.",
            "I cannot stand to be around %characterValue(name)%!",
            "%charVal(name)%'s dog is soo cute!",
            "%charVal(name)% said that %gendered(he\\'s / she\\'s / they\\'re)% wanting to go."
        ];
        var bindings = [
            {
                "x": "Clayton"
            }, {
                "x": "Cogsworth"
            }, {
                "x": "Brim"
            }
        ];
        var loadResult = cif.init();
        var rawSchema = cif.loadFile("etsData/schema.json");
        var schema = cif.loadSocialStructure(rawSchema);
        var rawCast = cif.loadFile("etsData/cast.json");
        var cast = cif.addCharacters(rawCast);
        var i;
        for (i = 0; i < testStrings.length; i++) {
            testDialogueString(testStrings[i], "x", getRandomFromArray(bindings));
        }
    }
    exports.test = test;
    function getRandomFromArray(pArray) {
        var randomIndex = Math.floor(Math.random() * pArray.length);
        return pArray[randomIndex];
    }
    function getRenderedTexts(pLocutions, pSpeaker, pBindings) {
        var renderedTexts = [];
        var i;
        for (i = 0; i < pLocutions.length; i++) {
            renderedTexts.push(pLocutions[i].renderText(pSpeaker, pBindings));
        }
        return renderedTexts;
    }
    function testDialogueString(pDialogue, pSpeaker, pBindings) {
        console.log("\n");
        console.log(pDialogue);
        var locutions = AUNLG.preprocessDialogue(pDialogue);
        var locutionStrings = getRenderedTexts(locutions, pSpeaker, pBindings);
        console.log(locutionStrings.join(""));
    }
});
