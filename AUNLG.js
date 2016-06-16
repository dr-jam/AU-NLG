define(["require", "exports", 'cif'], function (require, exports, cif) {
    "use strict";
    var AUNLG;
    (function (AUNLG) {
        var dataDelimiter = ",";
        var practiceRecord = {};
        var currentPracticeLabel = "";
        var currentStageLabel = "";
        var currentActionLabel = "";
        var LiteralLocution = (function () {
            function LiteralLocution(pRawDialogue) {
                this.rawText = pRawDialogue;
            }
            LiteralLocution.prototype.renderText = function (pCharacterRole, pBindings) {
                if (pCharacterRole === void 0) { pCharacterRole = undefined; }
                if (pBindings === void 0) { pBindings = undefined; }
                return this.rawText;
            };
            return LiteralLocution;
        })();
        var CharacterLocution = (function () {
            function CharacterLocution(pRawOption) {
                if (pRawOption === void 0) { pRawOption = undefined; }
                this.rawText = typeof (pRawOption) !== "undefined"
                    ? parseLocutionData(pRawOption, dataDelimiter)[0]
                    : undefined;
            }
            CharacterLocution.prototype.renderText = function (pCharacterRole, pBindings) {
                var characterData = getCharacterData(pCharacterRole, pBindings);
                var name = characterData.name;
                if ("possessive" === this.rawText) {
                    name += name.charAt(name.length - 1).toLowerCase() === "s" ? "'" : "'s";
                }
                return name;
            };
            return CharacterLocution;
        })();
        var CharacterValueLocution = (function () {
            function CharacterValueLocution(pCharacterKey) {
                this.rawText = pCharacterKey;
                this.role = parseLocutionData(pCharacterKey, dataDelimiter)[0];
                this.charDataLabel = parseLocutionData(pCharacterKey, dataDelimiter)[1];
            }
            CharacterValueLocution.prototype.renderText = function (pCharacterRole, pBindings) {
                var characterData = getCharacterData(this.role, pBindings);
                var value = characterData[this.charDataLabel];
                return typeof (value) !== "undefined" ? value : "";
            };
            return CharacterValueLocution;
        })();
        var GenderedLocution = (function () {
            function GenderedLocution(pRawDialogue) {
                this.rawText = pRawDialogue;
                var rawChoices = parseLocutionData(pRawDialogue, dataDelimiter)[0];
                var splitChoices = rawChoices.split("/");
                this.maleChoice = splitChoices[0];
                this.femaleChoice = splitChoices[1];
                this.nonBinaryChoice = splitChoices.length === 3 ? splitChoices[2] : "";
            }
            GenderedLocution.prototype.renderText = function (pCharacterRole, pBindings) {
                var characterData = getCharacterData(pCharacterRole, pBindings);
                return characterData.genderIdentity === "male"
                    ? this.maleChoice
                    : characterData.genderIdentity === "female"
                        ? this.femaleChoice
                        : this.nonBinaryChoice;
            };
            return GenderedLocution;
        })();
        var RandomLocution = (function () {
            function RandomLocution(pRawDialogue) {
                this.choices = [];
                this.rawText = pRawDialogue;
                this.choices = parseLocutionData(pRawDialogue, dataDelimiter);
            }
            RandomLocution.prototype.renderText = function (pCharacterRole, pBindings) {
                if (pCharacterRole === void 0) { pCharacterRole = undefined; }
                if (pBindings === void 0) { pBindings = undefined; }
                var randomNumber = Math.floor(Math.random() * this.choices.length);
                return this.choices[randomNumber];
            };
            return RandomLocution;
        })();
        var RepeatVariationLocution = (function () {
            function RepeatVariationLocution(pRawDialogue) {
                this.choices = [];
                this.rawText = pRawDialogue;
                this.choices = parseLocutionData(pRawDialogue, dataDelimiter);
            }
            RepeatVariationLocution.prototype.renderText = function (pCharacterRole, pBindings) {
                if (pCharacterRole === void 0) { pCharacterRole = undefined; }
                if (pBindings === void 0) { pBindings = undefined; }
                var recordIndex = pBindings.x + "-" + pBindings.y + "-" + currentPracticeLabel + "-" + currentStageLabel + "-" + currentActionLabel;
                var index = 0;
                if (practiceRecord[recordIndex] !== undefined) {
                    index = practiceRecord[recordIndex] % this.choices.length;
                }
                return this.choices[index];
            };
            return RepeatVariationLocution;
        })();
        function updatePracticeRecord(recordIndex) {
            if (practiceRecord[recordIndex] === undefined) {
                practiceRecord[recordIndex] = 0;
            }
            else {
                practiceRecord[recordIndex] += 1;
            }
        }
        AUNLG.updatePracticeRecord = updatePracticeRecord;
        function decrementPracticeRecord(recordIndex) {
            if (practiceRecord[recordIndex] !== undefined) {
                if (practiceRecord[recordIndex] <= 0) {
                    practiceRecord[recordIndex] = undefined;
                }
                else {
                    practiceRecord[recordIndex] -= 1;
                }
            }
        }
        AUNLG.decrementPracticeRecord = decrementPracticeRecord;
        function setCurrentPracticeStateInfo(plabel, slabel, alabel) {
            currentPracticeLabel = plabel;
            currentStageLabel = slabel;
            currentActionLabel = alabel;
        }
        AUNLG.setCurrentPracticeStateInfo = setCurrentPracticeStateInfo;
        var SpecializedLocution = (function () {
            function SpecializedLocution(pToken) {
                this.specializedWord = parseLocutionData(pToken, dataDelimiter)[0];
            }
            SpecializedLocution.prototype.renderText = function (pCharacterRole, pBindings) {
                var characterData = getCharacterData(pCharacterRole, pBindings);
                var specialWord = characterData.specialWords[this.specializedWord];
                return typeof (specialWord) !== "undefined" ? specialWord : "";
            };
            return SpecializedLocution;
        })();
        function getCharacterData(pCharacterRole, pBindings) {
            var cast = cif.getCharactersWithMetadata();
            var characterName = pBindings[pCharacterRole];
            for (var _i = 0, cast_1 = cast; _i < cast_1.length; _i++) {
                var character = cast_1[_i];
                if (character.name === characterName) {
                    return character;
                }
            }
            return undefined;
        }
        function parseLocutionData(pRawData, pDelim) {
            var dataValue = "";
            var escapeChar = "\\";
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
                if (theChar === pDelim) {
                    if (dataValue) {
                        allValues.push(dataValue);
                    }
                    dataValue = "";
                    isSpaceValid = false;
                }
                else if (theChar === escapeChar) {
                    dataValue += pRawData.charAt(i + 1);
                    i += 1;
                }
                else if (theChar === " ") {
                    if (isSpaceValid) {
                        dataValue += theChar;
                    }
                }
                else if (theChar === singleQuote) {
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
                if (pToken.indexOf("random") === 0) {
                    return new RandomLocution(trimType(pToken, "random"));
                }
                else if (pToken.indexOf("repeatVariation") === 0) {
                    return new RepeatVariationLocution(trimType(pToken, "repeatVariation"));
                }
                else if (pToken.indexOf("specialized") === 0) {
                    return new SpecializedLocution(trimType(pToken, "specialized"));
                }
                else if (pToken.indexOf("gendered") === 0) {
                    return new GenderedLocution(trimType(pToken, "gendered"));
                }
                else if (pToken.indexOf("characterValue") === 0) {
                    return new CharacterValueLocution(trimType(pToken, "characterValue"));
                }
                else if (pToken.indexOf("charVal") === 0) {
                    return new CharacterValueLocution(trimType(pToken, "charVal"));
                }
                else if (["x", "y", "z"].indexOf(pToken.charAt(0)) >= 0) {
                    var trimmed = (pToken.length > 1) ? trimType(pToken, "x") : undefined;
                    return new CharacterLocution(trimmed);
                }
                else {
                    console.log("Unknown locution type: %s", pToken);
                    return undefined;
                }
            }
            var i;
            for (i = 0; i < pRawDialogue.length; i++) {
                if (pRawDialogue.charAt(i) === SYM) {
                    if (currentType === LocType.LITERAL) {
                        if (token.length !== 0) {
                            locutionList.push(new LiteralLocution(token));
                        }
                        currentType = LocType.NONLITERAL;
                    }
                    else if (currentType === LocType.NONLITERAL) {
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
