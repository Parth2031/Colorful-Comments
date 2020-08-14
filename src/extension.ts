import * as vscode from 'vscode';
import { Parser } from './parser';

export function activate(context: vscode.ExtensionContext)
{
	let activeEditor: vscode.TextEditor | undefined;
	let parser: Parser = new Parser();

	let updateDecorations = function (useHash = false)
	{
		if (!activeEditor) return;

		if (!parser.supportedLanguage) return;

		parser.FindSingleLineComments(activeEditor);
		parser.FindBlockComments(activeEditor);
		parser.FindJSDocComments(activeEditor);
		parser.ApplyDecorations(activeEditor);
	};

	if (vscode.window.activeTextEditor)
	{
		activeEditor = vscode.window.activeTextEditor;

		parser.SetRegex(activeEditor.document.languageId);

		triggerUpdateDecorations();
	}

	vscode.window.onDidChangeActiveTextEditor( (editor) =>
	{
		activeEditor = editor;
		
		if (editor)
		{
			parser.SetRegex(editor.document.languageId);

			triggerUpdateDecorations();
		}
	}, null, context.subscriptions);

	vscode.workspace.onDidChangeTextDocument( event =>
	{
		if (activeEditor && event.document === activeEditor.document) {
			triggerUpdateDecorations();
		}
	}, null, context.subscriptions);

	var timeout: NodeJS.Timer;

	function triggerUpdateDecorations()
	{
		if (timeout) {
			clearTimeout(timeout);
		}

		timeout = setTimeout(updateDecorations, 200);
	}
}

export function deactivate() { }