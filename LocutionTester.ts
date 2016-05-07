import AUNLG = require('./AUNLG');
import cif = require('cif');

export function test(): void {
   var testStrings:Array<string> = [
       "That's so %specialized(nice)%!",
       "This is %random(wicked, wretched, awesome)%!",
       "Clayton is having trouble keeping %gendered(his/her/their)% partner happy."
   ];
   var testBindings:any = {
     "x":"Clayton"
   };

   // Init CiF.
   var loadResult:any = cif.init();
   //Load in our schema, cast, triggerRules and volitionRules, and actions.
   var rawSchema:any = cif.loadFile("etsData/schema.json");
   var schema:any = cif.loadSocialStructure(rawSchema);
   var rawCast:any = cif.loadFile("etsData/cast.json");
   var cast:Array<string> = cif.addCharacters(rawCast);

   // Output the tests.
   var i: number;
   for (i = 0; i < testStrings.length; i++) {
       console.log("\n");
       testDialogueString(testStrings[i], "x", testBindings);
   }
}


function getRenderedTexts(pLocutions:Array<AUNLG.Locution>, pSpeaker:string, pBindings:any):Array<string> {
    var renderedTexts:Array<string> = [];
    var i:number;
    for (i = 0; i < pLocutions.length; i++) {
        renderedTexts.push(pLocutions[i].renderText(pSpeaker, pBindings));
    }
    return renderedTexts;
}


function testDialogueString(pDialogue:string, pSpeaker:string, pBindings:any) {
    console.log(pDialogue);
    var locutions:Array<AUNLG.Locution> = AUNLG.preprocessDialogue(pDialogue);
    var locutionStrings = getRenderedTexts(locutions, pSpeaker, pBindings);
    console.log(locutionStrings.join(""));
}
