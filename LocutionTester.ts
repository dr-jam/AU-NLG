import AUNLG = require('./AUNLG');
// import cif = require('cif');

export function test(): void {
    var testSting:string = "That's so %specialized(x, badass)%!";
    var testSting:string = "This is %random(wicked, wretched, awesome)%!"
    var LOCUTION_STRINGS:Array<string> = ["RANDOM"];

    var testBinding = {
        "x" : "Clayton"
    };

  /* DEBUG/TEST */
  var locutions: Array<AUNLG.Locution> = AUNLG.preprocessDialogue(testSting, testBinding);

  var i: number;
  for (i = 0; i < locutions.length; i++) {
      console.log(locutions[i].renderText());
  }

  var testCastMember = 	{
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

  //Init CiF
  // var loadResult = cif.init();
  //
  // //Load in our schema, cast, triggerRules and volitionRules, and actions.
  // var rawSchema = cif.loadFile("etsData/schema.json");
  // var schema = cif.loadSocialStructure(rawSchema);
  //
  // var rawCast = cif.loadFile("etsData/cast.json");
  // var cast:Array<string> = cif.addCharacters(rawCast);
  //practiceManager.setCast(cast);

  // for (i = 0; i < rawCast.length; i++) {
  //     console.log(rawCast[i]);
  // }

  // console.log(cif.getCharacters());
}
