export async function getCurrentTab(): Promise<chrome.tabs.Tab> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

/**
 * Execute a function in the context of the current active tab.
 *
 * Note: The function will be serialised + injected into the tab's page and
 * then run as a content script so it must be self contained (a pure function;
 * no access or mutation outside its own closure scope).
 *
 * @param func - Function to run in page. Must be self-contained.
 * @param args - Arguments to pass to function. Must be JSON-serializable.
 *
 * @see https://developer.chrome.com/docs/extensions/reference/scripting/#method-executeScript
 * @see https://developer.chrome.com/docs/extensions/reference/scripting/#type-ScriptInjection
 * @see https://developer.chrome.com/en/blog/crx-scripting-api/#injecting-a-function-with-arguments
 */
export async function exec<T, A extends unknown[] = []>(
  func: (..._args: A) => T,
  args?: A,
): Promise<T> {
  const tab = await getCurrentTab();

  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId: tab.id! },
    func,
    args,
  });

  return result as T;
}
