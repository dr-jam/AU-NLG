import AUNLG = require('./AUNLG');
import cif = require('cif');

export function test(): void {
   var testStrings:Array<string> = [
       // Test SpecializedLocution.
       "That's so %specialized(nice)%!",
       // Test RandomLocution.
       "This is %random(wicked, wretched, awesome)%!",
       // Test GenderedLocution.
       "Clayton is having trouble keeping %gendered(his/her/their)% partner happy.",
       // Test CharacterValueLocution.
       "%charVal(name)% is a %charVal(profession)%.",
       "I cannot stand to be around %characterValue(name)%!",
       "%charVal(name)%'s dog is soo cute!",
       // Test the escape character for locution data.
       "%charVal(name)% said that %gendered(he\\'s / she\\'s / they\\'re)% wanting to go."
   ];
   var claytonBindings:any = {
       // preferredGender = male.
       "x": "Clayton"
   };
   var cogsworthBindings:any = {
       // preferredGender = non-binary.
       "x": "Cogsworth"
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
       testDialogueString(testStrings[i], "x", claytonBindings);
   }
   // Test the locution data parsing escape character using a non-binary gendered locution.
   var testEscape:string = "%charVal(name)% said that %gendered(he\\'s / she\\'s / they\\'re)% wanting to go.";
   testDialogueString(testEscape, "x", cogsworthBindings);
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
    console.log("\n");
    console.log(pDialogue);
    var locutions:Array<AUNLG.Locution> = AUNLG.preprocessDialogue(pDialogue);
    var locutionStrings = getRenderedTexts(locutions, pSpeaker, pBindings);
    console.log(locutionStrings.join(""));
}
