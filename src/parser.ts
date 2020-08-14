import * as vscode from 'vscode';

interface CommentTag
{
  tag: string;
  escapedTag: string;
  decoration: vscode.TextEditorDecorationType;
  ranges: Array<vscode.DecorationOptions>;
}

interface Contributions
{
  multilineComments: boolean;
  useJSDocStyle: boolean;
  highlightPlainText: boolean;
  tags: [{
    tag: string;
    color: string;
    strikethrough: boolean;
    backgroundColor: string;
  }];
}

export class Parser
{
  private tags: CommentTag[] = [];
  private expression: string = "";

  private delimiter: string = "";
  private blockCommentStart: string = "";
  private blockCommentEnd: string = "";

  private highlightSingleLineComments = true;
  private highlightMultilineComments = false;
  private highlightJSDoc = false;

  private isPlainText = false;
  private ignoreFirstLine = false;
  public supportedLanguage = true;

  private contributions: Contributions = vscode.workspace.getConfiguration('colorful-comments') as any;

  public constructor() {
    this.setTags();
  }

	/**
	* Sets the regex to be used by the matcher based on the config specified in the package.json
	* @param languageCode The short code of the current language
	* https://code.visualstudio.com/docs/languages/identifiers
	*/

  public SetRegex(languageCode: string)
  {
    this.setDelimiter(languageCode);

    if (!this.supportedLanguage) {
      return;
    }

    let characters: Array<string> = [];
    for (let commentTag of this.tags) {
      characters.push(commentTag.escapedTag);
    }

    if (this.isPlainText && this.contributions.highlightPlainText) {
      this.expression = "(^)+([ \\t]*[ \\t]*)";
    }
    else {
      this.expression = "(" + this.delimiter.replace(/\//ig, "\\/") + ")+( |\t)*";
    }

    this.expression += "(";
    this.expression += characters.join("|");
    this.expression += ")+(.*)";
  }

	/**
	* Finds all single line comments delimted by a given delimter and matching tags specified in package.json
	* @param activeEditor The active text editor containing the code document
  */
  
  public FindSingleLineComments(activeEditor: vscode.TextEditor): void
  {
    if (!this.highlightSingleLineComments)
      return;

    let text = activeEditor.document.getText();

    let regexFlags = (this.isPlainText) ? "igm" : "ig";
    let regEx = new RegExp(this.expression, regexFlags);

    let match: any;
    while (match = regEx.exec(text))
    {
      let startPos = activeEditor.document.positionAt(match.index);
      let endPos = activeEditor.document.positionAt(match.index + match[0].length);
      let range = { range: new vscode.Range(startPos, endPos) };

      if (this.ignoreFirstLine && startPos.line === 0 && startPos.character === 0) {
        continue;
      }

      let matchTag = this.tags.find(item => item.tag.toLowerCase() === match[3].toLowerCase());
      if (matchTag) {
        matchTag.ranges.push(range);
      }
    }
  }

	/**
	* Finds block comments as indicated by start and end delimiter
	* @param activeEditor The active text editor containing the code document
  */
  
  public FindBlockComments(activeEditor: vscode.TextEditor): void
  {

    if (!this.highlightMultilineComments)
      return;

    let text = activeEditor.document.getText();

    let characters: Array<string> = [];    
    for (let commentTag of this.tags) {
      characters.push(commentTag.escapedTag);
    }

    let commentMatchString = "(^)+([ \\t]*[ \\t]*)(";
    commentMatchString += characters.join("|");
    commentMatchString += ")([ ]*|[:])+([^*/][^\\r\\n]*)";

    let regexString = "(^|[ \\t])(";
    regexString += this.blockCommentStart;
    regexString += "[\\s])+([\\s\\S]*?)(";
    regexString += this.blockCommentEnd;
    regexString += ")";

    let regEx = new RegExp(regexString, "gm");
    let commentRegEx = new RegExp(commentMatchString, "igm");

    let match: any;

    while (match = regEx.exec(text))
    {
      let commentBlock = match[0];

      let line;
      while (line = commentRegEx.exec(commentBlock))
      {
        let startPos = activeEditor.document.positionAt(match.index + line.index + line[2].length);
        let endPos = activeEditor.document.positionAt(match.index + line.index + line[0].length);
        let range: vscode.DecorationOptions = { range: new vscode.Range(startPos, endPos) };

        let matchString = line[3] as string;
        let matchTag = this.tags.find(item => item.tag.toLowerCase() === matchString.toLowerCase());

        if (matchTag) {
          matchTag.ranges.push(range);
        }
      }
    }
  }

	/**
	* Finds all multiline comments starting with "*"
	* @param activeEditor The active text editor containing the code document
	*/

  public FindJSDocComments(activeEditor: vscode.TextEditor): void
  {
    if (!this.highlightMultilineComments && !this.highlightJSDoc)
      return;

    let text = activeEditor.document.getText();

    let characters: Array<string> = [];
    for (let commentTag of this.tags) {
      characters.push(commentTag.escapedTag);
    }

    let commentMatchString = "(^)+([ \\t]*\\*[ \\t]*)("; 
    let regEx = /(^|[ \t])(\/\*\*)+([\s\S]*?)(\*\/)/gm; 

    commentMatchString += characters.join("|");
    commentMatchString += ")([ ]*|[:])+([^*/][^\\r\\n]*)";

    let commentRegEx = new RegExp(commentMatchString, "igm");

    let match: any;
    while (match = regEx.exec(text))
    {
      let commentBlock = match[0];

      let line;
      while (line = commentRegEx.exec(commentBlock))
      {
        let startPos = activeEditor.document.positionAt(match.index + line.index + line[2].length);
        let endPos = activeEditor.document.positionAt(match.index + line.index + line[0].length);
        let range: vscode.DecorationOptions = { range: new vscode.Range(startPos, endPos) };

        let matchString = line[3] as string;
        let matchTag = this.tags.find(item => item.tag.toLowerCase() === matchString.toLowerCase());

        if (matchTag) {
          matchTag.ranges.push(range);
        }
      }
    }
  }

	/**
	* Apply decorations after finding all relevant comments
	* @param activeEditor The active text editor containing the code document
  */
  
  public ApplyDecorations(activeEditor: vscode.TextEditor): void
  {
    for (let tag of this.tags)
    {
      activeEditor.setDecorations(tag.decoration, tag.ranges);

      tag.ranges.length = 0;
    }
  }

	/**
	* Sets the comment delimiter [//, #, --, '] of a given language
	* @param languageCode The short code of the current language
	* https://code.visualstudio.com/docs/languages/identifiers
  */
  
  private setDelimiter(languageCode: string): void
  {
    this.supportedLanguage = true;
    this.ignoreFirstLine = false;
    this.isPlainText = false;

    switch (languageCode)
    {

      case "asciidoc": this.setCommentFormat("//", "////", "////");
                       break;

      case "apex":
      case "javascript":
      case "javascriptreact":
      case "typescript":
      case "typescriptreact":
                              this.setCommentFormat("//", "/*", "*/");
                              this.highlightJSDoc = true;
                              break;

      case "al":
      case "c":
      case "cpp":
      case "csharp":
      case "dart":
      case "flax":
      case "fsharp":
      case "go":
      case "groovy":
      case "haxe":
      case "java":
      case "jsonc":
      case "kotlin":
      case "less":
      case "pascal":
      case "objectpascal":
      case "php":
      case "rust":
      case "scala":
      case "scss":
      case "stylus":
      case "swift":
      case "verilog":
      case "vue":
                  this.setCommentFormat("//", "/*", "*/");
                  break;

      case "css": this.setCommentFormat("/*", "/*", "*/");
                  break;

      case "coffeescript":
      case "dockerfile":
      case "gdscript":
      case "graphql":
      case "julia":
      case "makefile":
      case "perl":
      case "perl6":
      case "puppet":
      case "r":
      case "ruby":
      case "shellscript":
      case "tcl":
      case "yaml":
                    this.delimiter = "#";
                    break;

      case "tcl": this.delimiter = "#";
                  this.ignoreFirstLine = true;
                  break;

      case "elixir":
      case "python":
                     this.setCommentFormat("#", '"""', '"""');
                     this.ignoreFirstLine = true;
                     break;

      case "nim": this.setCommentFormat("#", "#[", "]#");
                  break;

      case "powershell": this.setCommentFormat("#", "<#", "#>");
                         break;

      case "ada":
      case "hive-sql":
      case "pig":
      case "plsql":
      case "sql":
                  this.delimiter = "--";
                  break;

      case "lua": this.setCommentFormat("--", "--[[", "]]");
                  break;

      case "elm":
      case "haskell":
                      this.setCommentFormat("--", "{-", "-}");
                      break;

      case "vb":
      case "diagram":                                                        // ? PlantUML is recognized as Diagram (diagram)
                      this.delimiter = "'";
                      break;

      case "bibtex":
      case "erlang":
      case "latex":
      case "matlab":
                     this.delimiter = "%";
                     break;

      case "clojure":
      case "racket":
      case "lisp":
                    this.delimiter = ";";
                    break;

      case "terraform": this.setCommentFormat("#", "/*", "*/");
                        break;

      case "COBOL": this.delimiter = this.escapeRegExp("*>");
                    break;

      case "fortran-modern": this.delimiter = "c";
                             break;

      case "SAS":
      case "stata":
                    this.setCommentFormat("*", "/*", "*/");
                    break;

      case "html":
      case "markdown":
                       this.setCommentFormat("<!--", "<!--", "-->");
                       break;

      case "twig": this.setCommentFormat("{#", "{#", "#}");
                   break;

      case "genstat": this.setCommentFormat("\\", '"', '"');
                      break;

      case "cfml": this.setCommentFormat("<!---", "<!---", "--->");
                   break;

      case "plaintext": this.isPlainText = true;
                        this.supportedLanguage = this.contributions.highlightPlainText;
                        break;

      default: this.supportedLanguage = false;
               break;
    }
  }

	/**
	 * Sets the highlighting tags up for use by the parser
	 */

  private setTags(): void
  {
    let items = this.contributions.tags;
    for (let item of items)
    {
      let options: vscode.DecorationRenderOptions = { color: item.color, backgroundColor: item.backgroundColor };
      if (item.strikethrough) {
        options.textDecoration = "line-through";
      }

      let escapedSequence = item.tag.replace(/([()[{*+.$^\\|?])/g, '\\$1');
      this.tags.push(
      {
        tag: item.tag,
        escapedTag: escapedSequence.replace(/\//gi, "\\/"), 
        ranges: [],
        decoration: vscode.window.createTextEditorDecorationType(options)
      });
    }
  }

	/**
	* Escapes a given string for use in a regular expression
	* @param input The input string to be escaped
	* @returns {string} The escaped string
  */
  
  private escapeRegExp(input: string): string {
    return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
  }

	/**
	* Set up the comment format for single and multiline highlighting
	* @param singleLine The single line comment delimiter. If NULL, single line is not supported
	* @param start The start delimiter for block comments
	* @param end The end delimiter for block comments
  */
  
  private setCommentFormat(singleLine: string | null, start: string, end: string): void
  {
    if (singleLine) {
      this.delimiter = this.escapeRegExp(singleLine);
    }
    else {
      this.highlightSingleLineComments = false;
    }

    this.blockCommentStart = this.escapeRegExp(start);
    this.blockCommentEnd = this.escapeRegExp(end);
    this.highlightMultilineComments = this.contributions.multilineComments;
  }
}
