module AUNLG {

  export interface ILocution {
    t: string;  // The text of a Locution object
    render_text(): string;
  }

  export class LiteralLocution implements ILocution {
    t: string = "";
    constructor(str:string) {
      this.t = str;
    }
    render_text() { return this.t; }
  }

  export class RandomLocution implements ILocution {
    choices:Array<string> = [];
    t:string = "";
    constructor(substring:string) {
      this.t = substring;
      this.extract_choices(substring);
    }

    extract_choices(str:string):void {
      var leftP:number = this.t.indexOf("(");
      var rightP:number = this.t.lastIndexOf(")");
      var v = this.t.substring(leftP + 1, rightP);
      var sv = v.split(",");
      var i:number = 0;
      for (i = 0; i < sv.length; i++) {
        this.choices.push(sv[i]);
      }
    }

    make_choice():string {
      var r:number = Math.floor(Math.random() * this.choices.length);
      var v:string = this.choices[r];
      return v;
    }

    render_text() {
      return this.make_choice();
    }
  }

  //Utility Functions
  /* PROCESSING FUNCTION */
  export function preprocess_string(str: string): Array<ILocution> {
    var SYM:string = "%";
    var locs:Array<AUNLG.ILocution> = [];

    function create_locution(token:string): AUNLG.ILocution {
        if (token.search("RANDOM") === 0) {
          return new RandomLocution(token);
        }
        else {
          return new LiteralLocution(token);
        }
    }

    var tokens:Array<string> = str.split(SYM);
    var i:number;
    for (i = 0; i < tokens.length; i++) {
      locs[i] = create_locution(tokens[i]);
    }
    return locs;
  }
}
export = AUNLG;
