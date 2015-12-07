define(["require", "exports"], function (require, exports) {
    var AUNLG;
    (function (AUNLG) {
        var LiteralLocution = (function () {
            function LiteralLocution(str) {
                this.t = "";
                this.t = str;
            }
            LiteralLocution.prototype.render_text = function () { return this.t; };
            return LiteralLocution;
        })();
        AUNLG.LiteralLocution = LiteralLocution;
        var RandomLocution = (function () {
            function RandomLocution(substring) {
                this.choices = [];
                this.t = "";
                this.t = substring;
                this.extract_choices(substring);
            }
            RandomLocution.prototype.extract_choices = function (str) {
                var leftP = this.t.indexOf("(");
                var rightP = this.t.lastIndexOf(")");
                var v = this.t.substring(leftP + 1, rightP);
                var sv = v.split(",");
                var i = 0;
                for (i = 0; i < sv.length; i++) {
                    this.choices.push(sv[i]);
                }
            };
            RandomLocution.prototype.make_choice = function () {
                var r = Math.floor(Math.random() * this.choices.length);
                var v = this.choices[r];
                return v;
            };
            RandomLocution.prototype.render_text = function () {
                return this.make_choice();
            };
            return RandomLocution;
        })();
        AUNLG.RandomLocution = RandomLocution;
        function preprocess_string(str) {
            var SYM = "%";
            var locs = [];
            function create_locution(token) {
                if (token.search("RANDOM") === 0) {
                    return new RandomLocution(token);
                }
                else {
                    return new LiteralLocution(token);
                }
            }
            var tokens = str.split(SYM);
            var i;
            for (i = 0; i < tokens.length; i++) {
                locs[i] = create_locution(tokens[i]);
            }
            return locs;
        }
        AUNLG.preprocess_string = preprocess_string;
    })(AUNLG || (AUNLG = {}));
    return AUNLG;
});
