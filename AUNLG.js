define(["require", "exports", 'cif'], function (require, exports, cif) {
    "use strict";
    var AUNLG;
    (function (AUNLG) {
        var dataDelimiter = ",";
        var LiteralLocution = (function () {
            function LiteralLocution(pRawString) {
                this.text = "";
                this.text = pRawString;
            }
            LiteralLocution.prototype.renderText = function (speaker, bindings) {
                return this.text;
            };
            return LiteralLocution;
        })();
        var RandomLocution = (function () {
            function RandomLocution(pRawString) {
                this.choices = [];
                this.text = "";
                this.text = pRawString;
                this.extractChoices(pRawString);
            }
            RandomLocution.prototype.extractChoices = function (pRawChoices) {
                console.log(pRawChoices);
                this.choices = parseLocutionData(pRawChoices, dataDelimiter);
            };
            RandomLocution.prototype.makeChoice = function () {
                var randomNumber = Math.floor(Math.random() * this.choices.length);
                return this.choices[randomNumber];
            };
            RandomLocution.prototype.renderText = function (speaker, bindings) {
                return this.makeChoice();
            };
            return RandomLocution;
        })();
        var SpecializedLocution = (function () {
            function SpecializedLocution(pToken) {
                this.text = "";
                this.specializedWord = parseLocutionData(pToken, dataDelimiter)[0];
            }
            SpecializedLocution.prototype.renderText = function (speakerRole, bindings) {
                var cast = cif.getCharacters();
                var speakerName = bindings[speakerRole];
                var speaker = cast[speakerName];
                var speakersSpecializedWord = speaker.specialWords[this.specializedWord];
                return speakersSpecializedWord;
            };
            return SpecializedLocution;
        })();
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
                if (pToken.toLowerCase().indexOf("random") == 0) {
                    return new RandomLocution(trimType(pToken, "random"));
                }
                else if (pToken.toLowerCase().indexOf("specialized") == 0) {
                    return new SpecializedLocution(trimType(pToken, "specialized"));
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
