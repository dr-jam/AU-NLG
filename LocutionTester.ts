import AUNLG = require('./AUNLG');
import cif = require('cif');

export function test(): void {
  var TEST_STR: string = "This is an example of %RANDOM(Cats,Dogs)%";
  var LOCUTION_STRINGS: Array<string> = ["RANDOM"];

  /* DEBUG/TEST */
  var locutions: Array<AUNLG.ILocution> = AUNLG.preprocess_string(TEST_STR);

  var i: number;
  for (i = 0; i < locutions.length; i++) {
      console.log(locutions[i].render_text());
  }
  //Init CiF
  var loadResult = cif.init();

  //Load in our schema, cast, triggerRules and volitionRules, and actions.
  var rawSchema = cif.loadFile("etsData/schema.json");
  var schema = cif.loadSocialStructure(rawSchema);

  var rawCast = cif.loadFile("etsData/cast.json");
  var cast = cif.addCharacters(rawCast);
  //practiceManager.setCast(cast);

  console.log(cif.getCharacters());
}
