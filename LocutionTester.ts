import AUNLG = require('./AUNLG');
import cif = require('cif');

export function test(): void {
   var testSting:string = "That's so %specialized(nice)%!";
   // var testSting:string = "This is %random(wicked, wretched, awesome)%!"
   var LOCUTION_STRINGS:Array<string> = ["RANDOM"];

  /* DEBUG/TEST */
  var locutions: Array<AUNLG.Locution> = AUNLG.preprocessDialogue(testSting);

  var testBindings:any = {
     "x":"Belle"
  }

  var i: number;
  for (i = 0; i < locutions.length; i++) {
      console.log(locutions[i].renderText("x", testBindings));
  }

  // var testCastMember = 	{
  //     "Clayton": {
  //           "name": "Clayton",
  //           "profession": "Farmer",
  //           "graphics": {
  //               "icon": "farmer",
  //               "body": "f",
  //               "head": "o",
  //               "hair": "b",
  //               "nose": "c",
  //               "eyes": "a",
  //               "mouth": "d"
  //           },
  //           "specialWords": {
  //               "nice": "awesome",
  //               "badass": "sparkplug"
  //           },
  //         "pronoun": "he"
  //       }
  // };

  //Init CiF
  var loadResult:any = cif.init();

  //Load in our schema, cast, triggerRules and volitionRules, and actions.
  var rawSchema:any = cif.loadFile("etsData/schema.json");
  var schema:any = cif.loadSocialStructure(rawSchema);

  var rawCast:any = cif.loadFile("etsData/cast.json");
  var cast:Array<string> = cif.addCharacters(rawCast);

  console.log(cif.getCharacters());
}
