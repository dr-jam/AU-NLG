import cif = require('cif');
import practiceManager = require('practiceManager');


module AUNLG {
    /*  GLOBAL VARIABLES */
    var dataDelimiter = ",";  // comma set as default delimiter for parsing locution data.
    var practiceRecord:any = {}; //This will be used for repeatVariation
    //NOTE: These three labels are to get around some weird require meeting typescipt
    //      where I can't get access to practiceManager
    var currentPracticeLabel = "";
    var currentStageLabel = "";
    var currentActionLabel = "";

    /**
     * Implementations of interface Locution require rawText and a
     *      renderText function.
     */
    export interface Locution {
        rawText:string;  // The rawText of a Locution object
        renderText(speaker:string, bindings:any):string;
    }

    /**
     * constructor
     *      Takes the string that represents this literal locution.  This class is
     *      for maintaing the exact text from a raw dialogue string.
     *
     * renderText
     *      Returns the string passed in during instantiation.
     */
    class LiteralLocution implements Locution {
        rawText:string;
        constructor(pRawDialogue:string) {
            this.rawText = pRawDialogue;
        }
        // Parameters are not required for function LiteralLocution.renderText.
        renderText(pCharacterRole:string = undefined, pBindings:any = undefined) {
            return this.rawText;
        }
    }


    /**
     * constructor
     *      Does not require any parameters for a default x, y or z instance.  However,
     *      a type can be passed in as a string, which affects the name returned.
     *      Current implementaiton allows for the following types:
     *          - possessive
     *
     * renderText
     *      Takes a character role which allows for getting the character's whose name should
     *      be rendered.  Checks for a type passed in during instantiating to manipulate the
     *      name.  For example, if 'possessive' was passed in and the name is Alex, renderText
     *      will return Alex's; alternatively, if the name ends in an 's', it will return the
     *      name proceeded by an apostrophe, as in Gus'.
     *
     * Reference - Notes to Authors #3
     *
     * Example raw dialogue strings that will create instances of CharacterLocution:
     *      "%x% wants to visit the zoo."
     *      "%z(possessive)% eyes are so dreamy."
     */
    class CharacterLocution implements Locution {
        rawText:string;
        // A CharacterLocution may not have any options.
        constructor(pRawOption:string = undefined) {
            this.rawText = typeof (pRawOption) !== "undefined"
                            // If there is an option, it will only be a single option.
                            ? parseLocutionData(pRawOption, dataDelimiter)[0]
                            : undefined;
        }
        renderText(pCharacterRole:string, pBindings:any) {
            var characterData = getCharacterData(pCharacterRole, pBindings);
            var name = characterData.name;
            if ("possessive" === this.rawText) {
                name += name.charAt(name.length - 1).toLowerCase() === "s" ? "'" : "'s";
            }
            return name;
        }
    }

    /**
     * Constructor
     *      Takes a key string for which to find within a given character's
     *      object from cast.json.
     *
     * renderText
     *      Returns the value of the key for the character specified in pBindings.
     *      ** If the specified key does not exist within the character's object,
     *      an empty string is returned. **
     *
     * Shorthand
     *      charVal
     *
     * Example raw dialogue strings that will create instances of CharacterValueLocution:
     *      "I cannot stand to be around %characterValue(name)%!"
     *      "%charVal(name)% is a %charVal(profession)%."
     *      "%charVal(name)%'s dog is soo cute!"
     */
    class CharacterValueLocution implements Locution {
        rawText:string;  // The key whose value wil be extracted by renderText.
        charDataLabel:string;
        role:string;
        constructor(pCharacterKey:string) {
            // By convention, only a single element in locution data.
            this.rawText = pCharacterKey;
            this.role = parseLocutionData(pCharacterKey, dataDelimiter)[0];
            this.charDataLabel = parseLocutionData(pCharacterKey, dataDelimiter)[1];
        }
        renderText(pCharacterRole:string, pBindings:any) {
            var characterData = getCharacterData(this.role, pBindings);
            var value = characterData[this.charDataLabel];
            return typeof(value) !== "undefined" ? value : "";
        }
    }


    /**
     * constructor
     *      Takes two or three elements, separated by a forward slash, which directly map
     *      to strings that are delivered via renderText dependent on age.  Order of the
     *      strings is male/female[/non-binary].
     *
     * renderText
     *      Takes a characterRole string, which is used as the key to obtain the character
     *      name from the bindings.  The appropriate string is returned based on the character's
     *      gender identity.
     *      ** If the character has a non-binary gender identity and a non-binary string
     *      is not passed in during instantiation, an empty string is returned. **
     *
     * Example raw dialogue strings that will create instances of GenderedLocution:
     *      "Clayton is having trouble keeping %gendered(his/her/their)% partner happy."
     *      "%gendered(He/She/They)% were turned into a %gendered(blue/yellow/red)% parrot."
     *      "%gendered(Mr./Mrs./Mx.)% %charVal(name)% sent an RSVP already."
     */
    class GenderedLocution implements Locution {
        rawText:string;
        maleChoice:string;
        femaleChoice:string;
        nonBinaryChoice:string;

        constructor(pRawDialogue:string) {
            this.rawText = pRawDialogue;
            // By convention, there is only one element in a gendered locution data array.
            var rawChoices:string = parseLocutionData(pRawDialogue, dataDelimiter)[0];
            var splitChoices:Array<string> = rawChoices.split("/");
            // The order should always be male, female, non-binary
            this.maleChoice = splitChoices[0];
            this.femaleChoice = splitChoices[1];
            this.nonBinaryChoice = splitChoices.length === 3 ? splitChoices[2] : "";
        }
        renderText(pCharacterRole:string, pBindings:any) {
            //NOTE: This is a work around to make it so that it will always return the gendered work for the responding character ('y')
            var characterData = getCharacterData("y", pBindings);
            // Return the choice based on the genderIdentity of speakerRole.
            return characterData.genderIdentity === "male"
                ? this.maleChoice
                : characterData.genderIdentity === "female"
                    ? this.femaleChoice
                    : this.nonBinaryChoice;
        }
    }


    /**
     * constructor
     *      Takes a raw string (surrounded by parentheses) that is parsed
     *      into an array containing each choice.
     *
     * renderText
     *      returns a random choice from the choices array.
     *
     * Example dialogue strings that will create instances of RandomLocution:
     *      "This is %random(wicked, wretched, awesome)%!"
     *      "That's so %random(frustrating, aggravating, bonkers)%!"
     */
    class RandomLocution implements Locution {
        choices:Array<string> = [];       // Parsed choices as string values.
        rawText:string;           // This instance's string value.

        constructor(pRawDialogue:string) {
            this.rawText = pRawDialogue;
            this.choices = parseLocutionData(pRawDialogue, dataDelimiter);
        }
        // Parameters are not required for function RandomLuction.renderText
        renderText(pCharacterRole:string = undefined, pBindings:any = undefined) {
            var randomNumber:number = Math.floor(Math.random() * this.choices.length);
            return this.choices[randomNumber];
        }
    }

    /**
     * constructor
     *      Takes a raw string (surrounded by parentheses) that is parsed
     *      into an array containing the ordered list of the text that should
     *      be shown.
     *
     * renderText
     *      returns the nth line from the choices array, where n is the number
     *      of times x has communicated with y. If the number of interactions
     *      is greater than the number of choices, it loops.
     *
     * Example dialogue strings that will create instances of
     * RepeatVariationLocution:
     *      "This is %repeatVariation(wicked, wretched, awesome)%!"
     *      "That's so %repeatVariation(frustrating, aggravating, bonkers)%!"
     *
     * Note: This introduces a dependency in practiceManager, because it is
     *      going to rely on practiceManager keeping track of how many times
     *      an interaction has happened between two characters.
     */
    class RepeatVariationLocution implements Locution {
        choices:Array<string> = [];       // Parsed choices as string values.
        rawText:string;           // This instance's string value.

        constructor(pRawDialogue:string) {
            this.rawText = pRawDialogue;
            this.choices = parseLocutionData(pRawDialogue, dataDelimiter);
        }
        // Parameters are not required for function RandomLuction.renderText
        renderText(pCharacterRole:string = undefined, pBindings:any = undefined) {
            var recordIndex = pBindings.x + "-" + pBindings.y + "-" + currentPracticeLabel + "-" + currentStageLabel + "-" + currentActionLabel;
            var index:number = 0;
            if (practiceRecord[recordIndex] !== undefined) {
               index = practiceRecord[recordIndex] % this.choices.length;
            }
            return this.choices[index];
        }
    }
    export function updatePracticeRecord(recordIndex:string):void {
      if (practiceRecord[recordIndex] === undefined) {
          practiceRecord[recordIndex] = 0;
      } else {
          practiceRecord[recordIndex] += 1;
      }
    }
    //This function is used for the repeat variation tag and
    export function decrementPracticeRecord(recordIndex:string):void {
      if (practiceRecord[recordIndex] !== undefined) {
         if (practiceRecord[recordIndex] <= 0) {
             practiceRecord[recordIndex] = undefined;
         } else {
             practiceRecord[recordIndex] -= 1;
         }
      }
    }
    export function setCurrentPracticeStateInfo(plabel:string, slabel:string, alabel:string):void {
      currentPracticeLabel = plabel;
      currentStageLabel = slabel;
      currentActionLabel = alabel;
    }

    /**
     * Constructor
     *      Takes a string (surrounded by parentheses) that's equal to a key within
     *      a cast members specialWords object.  For example: (nice), (sexy).
     *
     * renderText
     *      Extracts the character's data who is specified by character role as the key
     *      within the bindings object.  Returns the value for the key from the
     *      specialWords object inside the appropriate character's data.
     *      ** If the key is not found within the array it will return an empty string. **
     *
     * Example dialogue strings that will create instances of SpecializedLocution.
     *      "That's so %specialized(nice)%!"
     */
    class SpecializedLocution implements Locution {
        rawText:string;             // The string value for this locution.
        bindings:Object;            // Hold the bindings for this locution.
        specializedWord:string;

        constructor(pToken:string) {
            // By convention, this locution only has one argument.
            this.specializedWord = parseLocutionData(pToken, dataDelimiter)[0];
        }
        renderText(pCharacterRole:string, pBindings:any) {
            var characterData = getCharacterData(pCharacterRole, pBindings);
            var specialWord = characterData.specialWords[this.specializedWord];
            return typeof(specialWord) !== "undefined" ? specialWord : "";
        }
    }

/* UTILITY FUNCTIONS */

    /**
     *  Uses bindings and a role to get the json data from cast.json that
     *  corresponds to the appropriate cast member who is speaking the locution.
     *
     * @param  {string} pCharacterRole
     *      A string that represents which role the character represents for this dialogue.
     *      For example, "x" means the character is the speaker while "z" means the character
     *      is being referenced within the dialogue.
     * @param  {Object} pBindings
     *      An object whose keys are all speakerRoles pertinent to the locution and whose values
     *      are the character names associated with each given speakerRole.
     * @return {Object}
     *      The cast.json object associated with the character referenced by speakerRole.
     */
    function getCharacterData(pCharacterRole, pBindings) {
        var cast:any = cif.getCharactersWithMetadata();
        var characterName:string = pBindings[pCharacterRole];
        for (var character of cast) {
           if (character.name === characterName) {
             return character;
          }
        }
        return undefined;
    }


    /**
     * parseLocutionData
     *      Extracts data values from a raw locution data string.
     *      For example, the authored dialogue "We all call him %specialized(nickname
     *      , z)%." will return the Array ["nickname", "z"] when given the comma
     *      as a delimiter string.
     *
     * Reference:
     *      Notes to Authors #2
     *
     * @param  {string} pRawData
     *      The data extracted after the locution type has been determined.
     *      For example, specialized(nickname, z) is an unprocessed SpecializedLocution
     *      whose data string is "(nickname, z)".
     * @param  {string} pDelim
     *      The char or string value that is to be used to indicate a new piece of
     *      information is about ot be encountered.  This is typically a comma, as
     *      in (nickname, z).
     * @return {Array}
     *      An array containing each piece of data.
     */
    function parseLocutionData(pRawData:string, pDelim:string) {
        var dataValue:string = "";          // Holds the current data value being parsed.
        var escapeChar:string = "\\";       // The escape character.
        var singleQuote:string = "'";       // Variable for enhanced readability.
        var allValues:Array<string> = [];   // Holds the parsed data.
        var isSpaceValid:boolean = false;   // Whether or not to add spaces to the data value.

        // Quick error check, make sure rawData is surrounded by parentheses.
        if ("(" != pRawData.charAt(0) || ")" != pRawData.charAt(pRawData.length - 1)) {
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
            if (theChar === pDelim) {
                if (dataValue) {
                    allValues.push(dataValue);
                }
                // Reset.
                dataValue = "";
                isSpaceValid = false;
            }
            else if (theChar === escapeChar) {
                dataValue += pRawData.charAt(i + 1);
                // Skip the character that was just added.
                i += 1;
            }
            else if (theChar === " ") {
                if (isSpaceValid) {
                    dataValue += theChar;
                }
            }
            // Or is the character a single quote, changing the validity of a space.
            else if (theChar === singleQuote) {
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
     * preprocessDialogue
     *      Parses the entire dialogue passed in and creates
     *      the appropriate locution type for each locution within the string, adding
     *      each locution to an Array.  If an unknown locution type is encountered,
     *      the value "undefined" is added to the array.
     *
     * Reference
     *      Notes to Authors #1
     *
     * @param  {type} pRawDialogue
     *      The raw dialogue that is to be parsed.
     * @return {Array} locutionList
     *      The dialogue as an array of locutions.
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
            // indexOf items must be entirely lowercase.
            // pToken = pToken.toLowerCase();
            if (pToken.indexOf("random") === 0) {
                return new RandomLocution(trimType(pToken, "random"));
             } else if (pToken.indexOf("repeatVariation") === 0) {
                return new RepeatVariationLocution(trimType(pToken, "repeatVariation"));
            } else if (pToken.indexOf("specialized") === 0) {
                return new SpecializedLocution(trimType(pToken, "specialized"));
            } else if (pToken.indexOf("gendered") === 0) {
                return new GenderedLocution(trimType(pToken, "gendered"));
            } else if (pToken.indexOf("characterValue") === 0) {
                return new CharacterValueLocution(trimType(pToken, "characterValue"));
            // Shorthand for CharacterValueLocution.
         } else if (pToken.indexOf("charVal") === 0) {
                return new CharacterValueLocution(trimType(pToken, "charVal"));
            // For CharacterLocutions, check if x, y, or z is the first character of the token.
            } else if (["x", "y", "z"].indexOf(pToken.charAt(0)) >= 0) {
                // Only pass in a string when there is an option.
                var trimmed:string = (pToken.length > 1) ? trimType(pToken, "x") : undefined;
                return new CharacterLocution(trimmed);
            } else {
                console.log("Unknown locution type: %s", pToken);
                return undefined;
            }
        }

        // Parse the raw dialogue.
        var i: number;
        for (i = 0; i < pRawDialogue.length; i++) {
            if (pRawDialogue.charAt(i) === SYM) {
                // If our current locution type is a literal, indicating an
                //   unpaired SYM and the start of a new nonliteral locution.
                if (currentType === LocType.LITERAL) {
                    if (token.length !== 0) {
                        locutionList.push(new LiteralLocution(token));
                    }
                    currentType = LocType.NONLITERAL;
                // Else, if the current locution type is nonliteral, indicating
                //   a second SYM to pair with the first and the
                //   end of a nonliteral locution have been found.
                } else if (currentType === LocType.NONLITERAL) {
                    if (token.length != 0) {
                        var loc:Locution = createLocution(token);
                        // Make sure token was valid before adding it.
                        if (loc) {
                            locutionList.push(loc);
                        }
                    }
                    currentType = LocType.LITERAL;
                }
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
