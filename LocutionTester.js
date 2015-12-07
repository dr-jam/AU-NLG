define(["require", "exports", './AUNLG', 'cif'], function (require, exports, AUNLG, cif) {
    function test() {
        var TEST_STR = "This is an example of %RANDOM(Cats,Dogs)%";
        var LOCUTION_STRINGS = ["RANDOM"];
        var locutions = AUNLG.preprocess_string(TEST_STR);
        var i;
        for (i = 0; i < locutions.length; i++) {
            console.log(locutions[i].render_text());
        }
        var loadResult = cif.init();
        var rawSchema = cif.loadFile("etsData/schema.json");
        var schema = cif.loadSocialStructure(rawSchema);
        var rawCast = cif.loadFile("etsData/cast.json");
        var cast = cif.addCharacters(rawCast);
        console.log(cif.getCharacters());
    }
    exports.test = test;
});
