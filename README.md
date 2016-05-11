# AU-NLG
A template-based NLG system for the JavaScript implementation of Ensemble/CiF.

Notes to Authors:
#1) The locution delimiter by default is %.
    Locution types are determined by the value given after the special symbol, initially set and defined in preprocessString as “%”.  For example, to create a new random locution the raw string would contain %random(Choice1, Choice2)%.

#2) Spaces are ignored, unless explicitly allowed.  Using a single quote literal in a nonliteral locution.
    For locutions that have data values with spaces, the data value should be surrounded with single quotes, as in somelocution(‘Data value’).  This means that if, for any reason, you need leading or trailing spaces, you will need to use single quotes, as the parser will ignore them otherwise.  If you need to use a single quote literal, you will need to escape it.  This requires two backslash characters, as in the following:  gendered(he\\'s / she\\'s / they\\'re).

#3) Only CharacterLocution raw dialogue strings should begin with any of: "x", "y" or "z".
    Instances of CharacterLocution (ie %x%, %y%, and %z%) are currently found based on x, y, or z being the first character of the locution’s raw string.  This means that any additional class implementations of Locution should not have their identifying raw string begin with any of these three characters.


Suggested implementation improvements:
#1) Escape character and spaces.
    Remove the need to escape single quotes by requiring escape of spaces instead.  Not sure if this will be exceptionally helpful, but its one less thing for the authoring team to need to remember.

#2) Add checks for discovering raw CharacterLocution strings.
    Implement more checks, possibly on the length of the type of the locution in the raw dialogue, that will allow other locutions to begin with x, y, or z.
