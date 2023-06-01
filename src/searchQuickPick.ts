import {
  QuickPickItem,
  window,
  Disposable,
  QuickInputButton,
  QuickInput,
  QuickInputButtons,
  QuickPickItemKind,
} from "vscode";
import { SUPPORTED_LANGS } from "./constants";
import { SearchParams } from "./lspExtensions";
import { Environment } from "./env";

import * as vscode from "vscode";

export async function searchQuickPick(env: Environment): Promise<void> {
  let langQuickPicks: QuickPickItem[] = SUPPORTED_LANGS.map((lang) => ({
    label: lang,
  }));
  const searchTypeQuickPicks: QuickPickItem[] = [
    { label: "$(search-view-icon) Search" },
    { label: "$(search-replace) Search and Replace" },
  ];
  const skipQuickPick: QuickPickItem = {
    label: "All",
    description: "Search across all supported languages",
  };
  const separator: QuickPickItem = {
    label: "Supported languages",
    kind: QuickPickItemKind.Separator,
  };
  langQuickPicks = [...[skipQuickPick, separator], ...langQuickPicks];
  async function collectInputs() {
    const state = {} as Partial<State>;
    await MultiStepInput.run((input) => inputPattern(input, state));
    return state as State;
  }

  const title = "Search by Pattern";

  async function inputPattern(input: MultiStepInput, state: Partial<State>) {
    state.pattern = await input.showInputBox({
      title,
      step: 1,
      totalSteps: 3,
      value: env.searchView.lastSearch?.pattern
        ? env.searchView.lastSearch?.pattern
        : "",
      prompt: "Enter a pattern to search for",
      validate: async (val) =>
        val == "" ? "Please enter a pattern" : undefined,
      placeholder: "$X == $Y",
      shouldResume: shouldResume,
    });
    return (input: MultiStepInput) => pickLanguage(input, state);
  }

  async function pickLanguage(input: MultiStepInput, state: Partial<State>) {
    const pick = await input.showQuickPick({
      title,
      step: 2,
      totalSteps: 3,
      placeholder: "Pick a language",
      items: langQuickPicks,
      activeItem: langQuickPicks[0],
      shouldResume: shouldResume,
    });
    if (pick.label == "All") {
      state.language = null;
    } else {
      state.language = pick.label;
    }
    return (input: MultiStepInput) => pickSearchType(input, state as State);
  }

  async function pickSearchType(input: MultiStepInput, state: State) {
    const pick = await input.showQuickPick({
      title,
      step: 3,
      totalSteps: 3,
      items: searchTypeQuickPicks,
      activeItem: searchTypeQuickPicks[0],
      placeholder: "Search Type",
      shouldResume: shouldResume,
    });
    if (pick == searchTypeQuickPicks[1]) {
      return (input: MultiStepInput) => inputReplaceText(input, state);
    }
  }

  async function inputReplaceText(
    input: MultiStepInput,
    state: Partial<State>
  ) {
    state.replace = await input.showInputBox({
      title,
      step: 4,
      totalSteps: 4,
      value: env.searchView.replace ? env.searchView.replace : "",
      prompt: "Enter replacement text",
      validate: async () => "",
      shouldResume: shouldResume,
    });
  }

  function shouldResume() {
    return new Promise<boolean>(() => {
      // noop
    });
  }

  const state = await collectInputs();
  const searchParams: SearchParams = {
    pattern: state.pattern,
    language: state.language,
  };
  vscode.commands.executeCommand("semgrep.search", searchParams, state.replace);
}

// -------------------------------------------------------
// Helper code that wraps the API for the multi-step case.
// -------------------------------------------------------

class InputFlowAction {
  static back = new InputFlowAction();
  static cancel = new InputFlowAction();
  static resume = new InputFlowAction();
}

interface State {
  pattern: string;
  language: string | null;
  replace: string;
}

type InputStep = (input: MultiStepInput) => Thenable<InputStep | void>;

interface QuickPickParameters<T extends QuickPickItem> {
  title: string;
  step: number;
  totalSteps: number;
  items: T[];
  activeItem?: T;
  ignoreFocusOut?: boolean;
  placeholder: string;
  buttons?: QuickInputButton[];
  shouldResume: () => Thenable<boolean>;
}

interface InputBoxParameters {
  title: string;
  step: number;
  totalSteps: number;
  value: string;
  prompt: string;
  validate: (value: string) => Promise<string | undefined>;
  buttons?: QuickInputButton[];
  ignoreFocusOut?: boolean;
  placeholder?: string;
  shouldResume: () => Thenable<boolean>;
}

class MultiStepInput {
  static async run<T>(start: InputStep) {
    const input = new MultiStepInput();
    return input.stepThrough(start);
  }

  private current?: QuickInput;
  private steps: InputStep[] = [];

  private async stepThrough<T>(start: InputStep) {
    let step: InputStep | void = start;
    while (step) {
      this.steps.push(step);
      if (this.current) {
        this.current.enabled = false;
        this.current.busy = true;
      }
      try {
        step = await step(this);
      } catch (err) {
        if (err === InputFlowAction.back) {
          this.steps.pop();
          step = this.steps.pop();
        } else if (err === InputFlowAction.resume) {
          step = this.steps.pop();
        } else if (err === InputFlowAction.cancel) {
          step = undefined;
        } else {
          throw err;
        }
      }
    }
    if (this.current) {
      this.current.dispose();
    }
  }

  async showQuickPick<
    T extends QuickPickItem,
    P extends QuickPickParameters<T>
  >({
    title,
    step,
    totalSteps,
    items,
    activeItem,
    ignoreFocusOut,
    placeholder,
    buttons,
    shouldResume,
  }: P) {
    const disposables: Disposable[] = [];
    try {
      return await new Promise<
        T | (P extends { buttons: (infer I)[] } ? I : never)
      >((resolve, reject) => {
        const input = window.createQuickPick<T>();
        input.title = title;
        input.step = step;
        input.totalSteps = totalSteps;
        input.ignoreFocusOut = ignoreFocusOut ?? false;
        input.placeholder = placeholder;
        input.items = items;
        if (activeItem) {
          input.activeItems = [activeItem];
        }
        input.buttons = [
          ...(this.steps.length > 1 ? [QuickInputButtons.Back] : []),
          ...(buttons || []),
        ];
        disposables.push(
          input.onDidTriggerButton((item) => {
            if (item === QuickInputButtons.Back) {
              reject(InputFlowAction.back);
            } else {
              resolve(<any>item);
            }
          }),
          input.onDidChangeSelection((items) => resolve(items[0])),
          input.onDidHide(() => {
            (async () => {
              reject(
                shouldResume && (await shouldResume())
                  ? InputFlowAction.resume
                  : InputFlowAction.cancel
              );
            })().catch(reject);
          })
        );
        if (this.current) {
          this.current.dispose();
        }
        this.current = input;
        this.current.show();
      });
    } finally {
      disposables.forEach((d) => d.dispose());
    }
  }

  async showInputBox<P extends InputBoxParameters>({
    title,
    step,
    totalSteps,
    value,
    prompt,
    validate,
    buttons,
    ignoreFocusOut,
    placeholder,
    shouldResume,
  }: P) {
    const disposables: Disposable[] = [];
    try {
      return await new Promise<
        string | (P extends { buttons: (infer I)[] } ? I : never)
      >((resolve, reject) => {
        const input = window.createInputBox();
        input.title = title;
        input.step = step;
        input.totalSteps = totalSteps;
        input.value = value || "";
        input.prompt = prompt;
        input.ignoreFocusOut = ignoreFocusOut ?? false;
        input.placeholder = placeholder;
        input.buttons = [
          ...(this.steps.length > 1 ? [QuickInputButtons.Back] : []),
          ...(buttons || []),
        ];
        let validating = validate("");
        disposables.push(
          input.onDidTriggerButton((item) => {
            if (item === QuickInputButtons.Back) {
              reject(InputFlowAction.back);
            } else {
              resolve(<any>item);
            }
          }),
          input.onDidAccept(async () => {
            const value = input.value;
            input.enabled = false;
            input.busy = true;
            if (!(await validate(value))) {
              resolve(value);
            }
            input.enabled = true;
            input.busy = false;
          }),
          input.onDidChangeValue(async (text) => {
            const current = validate(text);
            validating = current;
            const validationMessage = await current;
            if (current === validating) {
              input.validationMessage = validationMessage;
            }
          }),
          input.onDidHide(() => {
            (async () => {
              reject(
                shouldResume && (await shouldResume())
                  ? InputFlowAction.resume
                  : InputFlowAction.cancel
              );
            })().catch(reject);
          })
        );
        if (this.current) {
          this.current.dispose();
        }
        this.current = input;
        this.current.show();
      });
    } finally {
      disposables.forEach((d) => d.dispose());
    }
  }
}
