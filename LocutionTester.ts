import AUNLG = require('./AUNLG');
import cif = require('cif');

export function test(): void {
   var testSpecialized:string = "That's so %specialized(nice)%!";
   var testRandom:string = "This is %random(wicked, wretched, awesome)%!";
   // Is the x needed in the raw dialogue string? It seems that it is only needed for renderText.
   var testGendered:string = "Clayton is having trouble keeping %gendered(his/her/their)% partner happy.";

   // Init CiF.
   var loadResult:any = cif.init();

   //Load in our schema, cast, triggerRules and volitionRules, and actions.
   var rawSchema:any = cif.loadFile("etsData/schema.json");
   var schema:any = cif.loadSocialStructure(rawSchema);

   var rawCast:any = cif.loadFile("etsData/cast.json");
   var cast:Array<string> = cif.addCharacters(rawCast);

   /* DEBUG/TEST */
   var locutions: Array<AUNLG.Locution> = AUNLG.preprocessDialogue(testSpecialized);

   var testBindings:any = {
     "x":"Clayton"
   }

   var i: number;
   // console.log("THIS IS THE OUTPUT FOR THE SPECIALIZED LOCUTION");
   // console.log("The raw dialogue string was: " + testSpecialized);
   // for (i = 0; i < locutions.length; i++) {
   //    console.log(locutions[i].renderText("x", testBindings));
   // }
   // var locutions: Array<AUNLG.Locution> = AUNLG.preprocessDialogue(testRandom);
   // console.log("THIS IS THE OUTPUT FOR THE RANDOM LOCUTION");
   // console.log("The raw dialogue string was: " + testRandom);
   // for (i = 0; i < locutions.length; i++) {
   //     console.log(locutions[i].renderText(undefined, undefined));
   // }
   var locutions:Array<AUNLG.Locution> = AUNLG.preprocessDialogue(testGendered);
   console.log("The raw dialogue string was: " + testGendered);
   for (i = 0; i < locutions.length; i++) {
       console.log(locutions[i].renderText("x", testBindings));
   }
}
