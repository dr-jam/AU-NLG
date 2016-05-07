define(["require", "exports", 'cif'], function (require, exports, cif) {
    "use strict";
    var AUNLG;
    (function (AUNLG) {
        var dataDelimiter = ",";
        var LiteralLocution = (function () {
            function LiteralLocution(pRawDialogue) {
                this.rawDialogueText = pRawDialogue;
            }
            LiteralLocution.prototype.renderText = function (pCharacterRole, pBindings) {
                return this.rawDialogueText;
            };
            return LiteralLocution;
        }());
        var CharacterReferenceLocution = (function () {
            function CharacterReferenceLocution(pCharacterKey) {
                this.rawDialogueText = pCharacterKey;
            }
            CharacterReferenceLocution.prototype.renderText = function (pCharacterRole, pBindings) {
                var characterData = getCharacterData(pCharacterRole, pBindings);
                return characterData.name;
            };
            return CharacterReferenceLocution;
        }());
        var GenderedLocution = (function () {
            function GenderedLocution(pRawDialogue) {
                this.rawDialogueText = pRawDialogue;
                var rawChoices = parseLocutionData(pRawDialogue, dataDelimiter)[0];
                var splitChoices = rawChoices.split("/");
                this.maleChoice = splitChoices[0];
                this.femaleChoice = splitChoices[1];
                this.nonBinaryChoice = splitChoices.length === 3 ? splitChoices[2] : "";
            }
            GenderedLocution.prototype.renderText = function (pCharacterRole, pBindings) {
                var characterData = getCharacterData(pCharacterRole, pBindings);
                return characterData.preferredGender === "male" ?
                    this.maleChoice : characterData.preferredGender === "female" ?
                    this.femaleChoice : this.nonBinaryChoice;
            };
            return GenderedLocution;
        }());
        var RandomLocution = (function () {
            function RandomLocution(pRawDialogue) {
                this.choices = [];
                this.rawDialogueText = pRawDialogue;
                this.choices = parseLocutionData(pRawDialogue, dataDelimiter);
            }
            RandomLocution.prototype.makeChoice = function () {
                var randomNumber = Math.floor(Math.random() * this.choices.length);
                return this.choices[randomNumber];
            };
            RandomLocution.prototype.renderText = function (pCharacterRole, pBindings) {
                return this.makeChoice();
            };
            return RandomLocution;
        }());
        var SpecializedLocution = (function () {
            function SpecializedLocution(pToken) {
                this.specializedWord = parseLocutionData(pToken, dataDelimiter)[0];
            }
            SpecializedLocution.prototype.renderText = function (pCharacterRole, pBindings) {
                var characterData = getCharacterData(pCharacterRole, pBindings);
                return characterData.specialWords[this.specializedWord];
            };
            return SpecializedLocution;
        }());
        function getCharacterData(pCharacterRole, pBindings) {
            var cast = cif.getCharactersWithMetadata();
            var characterName = pBindings[pCharacterRole];
            return cast[characterName];
        }
        function parseLocutionData(pRawData, pDelim) {
            var dataValue = "";
            var singleQuote = "'";
            var allValues = [];
            var isSpaceValid = false;
            if ("(" != pRawData.charAt(0) || ")" != pRawData.charAt(pRawData.length - 1)) {
                try {
                    throw new Error("Locution data is invalid, missing surrounding " +
                        "parentheses in: " + pRawData);
                }
                catch (e) {
                    console.log(e.name + ": " + e.message);
                    return undefined;
                }
            }
            pRawData = pRawData.slice(1, pRawData.length - 1);
            var i;
            for (i = 0; i < pRawData.length; i++) {
                var theChar = pRawData.charAt(i);
                if (theChar == pDelim) {
                    if (dataValue) {
                        allValues.push(dataValue);
                    }
                    dataValue = "";
                    isSpaceValid = false;
                }
                else if (theChar == " ") {
                    if (isSpaceValid) {
                        dataValue += theChar;
                    }
                }
                else if (theChar == singleQuote) {
                    isSpaceValid = !isSpaceValid;
                }
                else {
                    dataValue += theChar;
                }
            }
            if (dataValue) {
                allValues.push(dataValue);
            }
            return allValues;
        }
        function preprocessDialogue(pRawDialogue) {
            var SYM = "%";
            var token = "";
            var LocType;
            (function (LocType) {
                LocType[LocType["LITERAL"] = 0] = "LITERAL";
                LocType[LocType["NONLITERAL"] = 1] = "NONLITERAL";
            })(LocType || (LocType = {}));
            var currentType = LocType.LITERAL;
            var locutionList = [];
            function createLocution(pToken) {
                function trimType(pSource, pTypeString) {
                    return pSource.slice(pTypeString.length, pSource.length);
                }
                if (pToken.toLowerCase().indexOf("random") === 0) {
                    return new RandomLocution(trimType(pToken, "random"));
                }
                else if (pToken.toLowerCase().indexOf("specialized") === 0) {
                    return new SpecializedLocution(trimType(pToken, "specialized"));
                }
                else if (pToken.toLowerCase().indexOf("gendered") === 0) {
                    return new GenderedLocution(trimType(pToken, "gendered"));
                }
                else {
                    console.log("Unknown locution type: %s", pToken);
                    return undefined;
                }
            }
            var i;
            for (i = 0; i < pRawDialogue.length; i++) {
                if (pRawDialogue.charAt(i) == SYM) {
                    if (currentType == LocType.LITERAL) {
                        if (token.length != 0) {
                            locutionList.push(new LiteralLocution(token));
                        }
                        currentType = LocType.NONLITERAL;
                    }
                    else if (currentType == LocType.NONLITERAL) {
                        if (token.length != 0) {
                            var loc = createLocution(token);
                            if (loc) {
                                locutionList.push(loc);
                            }
                        }
                        currentType = LocType.LITERAL;
                    }
                    token = "";
                }
                else {
                    token += pRawDialogue.charAt(i);
                }
            }
            if (token) {
                locutionList.push(new LiteralLocution(token));
            }
            return locutionList;
        }
        AUNLG.preprocessDialogue = preprocessDialogue;
    })(AUNLG || (AUNLG = {}));
    return AUNLG;
});
