import AUNLG = require('./AUNLG');
import cif = require('cif');

export function test(): void {
   var testSting:string = "That's so %specialized(nice)%!";
   // var testSting:string = "This is %random(wicked, wretched, awesome)%!"

   //Init CiF
   var loadResult:any = cif.init();

   //Load in our schema, cast, triggerRules and volitionRules, and actions.
   var rawSchema:any = cif.loadFile("etsData/schema.json");
   var schema:any = cif.loadSocialStructure(rawSchema);

   var rawCast:any = cif.loadFile("etsData/cast.json");
   var cast:Array<string> = cif.addCharacters(rawCast);


   /* DEBUG/TEST */
   var locutions: Array<AUNLG.Locution> = AUNLG.preprocessDialogue(testSting);

   var testBindings:any = {
     "x":"Clayton"
   }

   var i: number;
   for (i = 0; i < locutions.length; i++) {
      console.log(locutions[i].renderText("x", testBindings));
   }
}
