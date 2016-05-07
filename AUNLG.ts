/*
    REFERENCE:
    https://docs.google.com/document/d/1KENUACiVzmgbTrSJJeyzYoyn7CeUvEMKNP4KCseI9j8/edit?usp=sharing
*/
import cif = require('cif');
module AUNLG {
    var dataDelimiter = ",";  // comma set as default delimiter for parsing locution data.

    export interface Locution {
        rawDialogueText:string;  // The rawDialogueText of a Locution object
        renderText(speaker:string, bindings:any):string;
    }

    class LiteralLocution implements Locution {
        rawDialogueText: string = "";
        constructor(pRawDialogue:string) {
            this.rawDialogueText = pRawDialogue;
        }
        renderText(speaker:string, bindings:any) {
            return this.rawDialogueText;
        }
    }


    class CharacterReferenceLocution implements Locution {
        rawDialogueText:string = "";
        constructor(pRawDialogue:string) {

        }
        renderText(speaker:string, bindings:any) {
            return "";
        }
    }


    class GenderedLocution implements Locution {
        rawDialogueText:string = "";
        maleChoice:string = "";
        femaleChoice:string = "";
        nonBinaryChoice:string = "";

        constructor(pRawDialogue:string) {
            this.rawDialogueText = pRawDialogue;
            // By convention, there is only one element in a gendered locution data array.
            var rawChoices:string = parseLocutionData(pRawDialogue, dataDelimiter)[0];
            var splitChoices:Array<string> = rawChoices.split("/");
            // The order should always be male, female, non-binary
            this.maleChoice = splitChoices[0];
            this.femaleChoice = splitChoices[1];
            this.nonBinaryChoice = splitChoices.length === 3 ? splitChoices[2] : "";
        }

        renderText(speakerRole:string, bindings:any) {
            var cast:any = cif.getCharactersWithMetadata();
            var speakerName:string = bindings[speakerRole];
            var speaker:any = cast[speakerName];
            // Return the choice based on the preferredGender of speakerRole.
            return speaker.preferredGender === "male" ?
                this.maleChoice : speaker.preferredGender === "female" ?
                this.femaleChoice : this.nonBinaryChoice;
        }
    }


    class RandomLocution implements Locution {
        choices:Array<string> = [];       // Parsed choices as string values.
        rawDialogueText:string = "";                 // This instance's string value.

        constructor(pRawDialogue:string) {
            this.rawDialogueText = pRawDialogue;
            this.choices = parseLocutionData(pRawDialogue, dataDelimiter);
        }

        makeChoice():string {
            // Return a random item from the choices array.
            var randomNumber:number = Math.floor(Math.random() * this.choices.length);
            return this.choices[randomNumber];
        }

        renderText(speaker:string, bindings:any) {
            return this.makeChoice();
        }
    }


    class SpecializedLocution implements Locution {
        rawDialogueText:string = "";   // The string value for this locution.
        bindings:Object;    // Hold the bindings for this locution.
        specializedWord:string;
        
        constructor(pToken:string) {
            // By convention, this locution only has one argument, and that is
            // the type of specialized word to look up in the cast.
            // %specialized(greeting)%
            this.specializedWord = parseLocutionData(pToken, dataDelimiter)[0];
        }

        renderText(pSpeakerRole:string, pBindings:any) {
            var speaker = getSpeakerData(pSpeakerRole, pBindings);
            var speakersSpecializedWord = speaker.specialWords[this.specializedWord];
            return speakersSpecializedWord;
        }
    }

/* UTILITY FUNCTIONS */

    /**
     * getSpeakerData - Uses bindings and a role to get the json data from cast.json that
     *      corresponds to the appropriate cast member who is speaking the locution.
     *
     * @param  {string} pSpeakerRole
     *      A string that represents which role the character represents for this dialogue.
     *      For example, "x" means the character is the speaker while "z" means the character
     *      is being referenced within the dialogue.
     * @param  {Object} pBindings
     *      An object whose keys are all speakerRoles pertinent to the locution and whose values
     *      are the character names associated with each given speakerRole.
     * @return {Object}
     *      Returns the cast.json object associated with the character referenced by speakerRole.
     */
    function getSpeakerData(pSpeakerRole, pBindings) {
        var cast:any = cif.getCharactersWithMetadata();
        var speakerName:string = pBindings[pSpeakerRole];
        var speaker:any = cast[speakerName];
        return speaker;
    }

    /**
     * parseLocutionData - Extracts data values from a raw locution data string.
     * For example, the authored dialogue "We all call him %specialized(nickname
     * , z)%." will return the Array ["nickname", "z"] when given the comma
     * as a delimiter string.
     *
     * Reference: - Notes to Authors #2
     *
     * @param  {string} pRawData - The data extracted after the locution
     * type has been determined.  For example, specialized(nickname, z) is a
     * an unprocessed SpecializedLocution whose data string is "(nickname, z)".
     * @param  {string} pDelim - The char or string value that is to be
     * used to indicate a new piece of information is about ot be encountered.
     * This is typically a comma, as in (nickname, z).
     * @return {Array} - An array containing each piece of data.
     */
    function parseLocutionData(pRawData:string, pDelim:string) {
        var dataValue:string = "";          // Holds the current data value being parsed.
        var singleQuote:string = "'";       // Variable for enhanced readability.
        var allValues:Array<string> = [];   // Holds the parsed data.
        var isSpaceValid:boolean = false;   // Whether or not to add spaces to the data value.

        // Quick error check, make sure rawData is surrounded by parentheses.
        if ("(" != pRawData.charAt(0) || ")" != pRawData.charAt(pRawData.length - 1)) {
            // If not, throw a new error.
            try {
                throw new Error("Locution data is invalid, missing surrounding " +
                    "parentheses in: " + pRawData);
            } catch (e) {
                console.log(e.name + ": " + e.message);
                return undefined;
            }
        }

        // Remove the parentheses.
        pRawData = pRawData.slice(1, pRawData.length - 1);

        // Iterate over the rawData string.
        var i:number;
        for (i = 0; i < pRawData.length; i++) {
            var theChar:string = pRawData.charAt(i);
            // Is the character the delimter?
            if (theChar == pDelim) {
                // If dataValue is not empty, add it to the data array.
                if (dataValue) {
                    allValues.push(dataValue);
                }
                // Reset.
                dataValue = "";
                isSpaceValid = false;
            }
            // Or is the character a space?
            else if (theChar == " ") {
                if (isSpaceValid) {
                    dataValue += theChar;
                }
            }
            // Or is the character a single quote, changing the validity of a space.
            else if (theChar == singleQuote) {
                // Only allow spaces between single quotes.
                isSpaceValid = !isSpaceValid;   // Initial value is false.
            }
            // Otherwise, the character is valid.
            else {
                dataValue += theChar;
            }
        }
        // Check for trailing data before returning.
        if (dataValue) {
            allValues.push(dataValue);
        }

        return allValues;
    }   /* end parseLocutionData */


    /**
     * preprocessDialogue - Parses the entire dialogue passed in and creates
     * the appropriate locution type for each locution within the string, adding
     * each locution to an Array.  If an unknown locution type is encountered,
     * the value "undefined" is added to the array.
     *
     * Reference - Notes to Authors #1
     *
     * @param  {type} pRawDialogue - The raw dialogue that is to be parsed.
     * @param  {type} pBindings - Bindings that are associated with the dialogue.
     * @return {Array} locutionList - The dialogue as an array of locutions.
     */
    export function preprocessDialogue(pRawDialogue:string):Array<Locution> {
        var SYM:string = "%";                // The delimeter for locutions.
        var token:string = "";               // Holds a locution's contents.
        enum LocType { LITERAL, NONLITERAL } // Locution type currently being processed.
        var currentType = LocType.LITERAL;   // LITERAL until SYM is encountered.
        var locutionList:Array<AUNLG.Locution> = [];

        // Helper function to create a nonliteral locution.
        function createLocution(pToken:string): AUNLG.Locution {
            // Helper function that returns a string with Locution type string trimmed.
            function trimType(pSource:string, pTypeString:string):string {
                return pSource.slice(pTypeString.length, pSource.length);
            }

            // Find out which Locution type we are making.
            if (pToken.toLowerCase().indexOf("random") === 0) {
                return new RandomLocution(trimType(pToken, "random"));
            } else if (pToken.toLowerCase().indexOf("specialized") === 0) {
                return new SpecializedLocution(trimType(pToken, "specialized"));
            } else if (pToken.toLowerCase().indexOf("gendered") === 0) {
                return new GenderedLocution(trimType(pToken, "gendered"));
            } else {
                console.log("Unknown locution type: %s", pToken);
                return undefined;
            }
        }

        // Parse the raw dialogue.
        var i: number;
        for (i = 0; i < pRawDialogue.length; i++) {
            if (pRawDialogue.charAt(i) == SYM) {
                // If our current locution type is a literal, indicating an
                //   unpaired SYM and the start of a new nonliteral locution.
                if (currentType == LocType.LITERAL) {
                    // ... if our token has any content...
                    if (token.length != 0) {
                        // ... instantiate and push a LiteralLocution.
                        locutionList.push(new LiteralLocution(token));
                    }
                    // Change the locution type to nonliteral.
                    currentType = LocType.NONLITERAL;
                // Else, if the current locution type is nonliteral, indicating
                //   a second SYM to pair with the first and the
                //   end of a nonliteral locution have been found.
                } else if (currentType == LocType.NONLITERAL) {
                    // ... if our token has any content...
                    if (token.length != 0) {
                        // ... createLocution will determine the locution type.
                        var loc:Locution = createLocution(token);
                        // Did we get a locution back? (no means token was bad).
                        if (loc) {
                            // ... if so, push it.
                            locutionList.push(loc);
                        }
                    }
                    // Change the current locution type to literal.
                    currentType = LocType.LITERAL;
                }
                // Clear the token.
                token = "";
            // Else, if charAt(i) is not our SYM.
            } else {
                // Continue collecting this token's contents.
                token += pRawDialogue.charAt(i);
            }
        }
        // Check for a trailing literal locution
        if (token) {
            locutionList.push(new LiteralLocution(token));
        }
        return locutionList;
    } /* end preprocessString */

}
export = AUNLG;
