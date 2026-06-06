// Tipos mínimos del API global del editor de OnlyOffice (lo inyecta su `api.js`).
export {};

declare global {
  interface DocEditorInstance {
    destroyEditor(): void;
  }

  interface DocsAPINamespace {
    DocEditor: new (
      placeholderId: string,
      config: Record<string, unknown>,
    ) => DocEditorInstance;
  }

  interface Window {
    DocsAPI?: DocsAPINamespace;
  }
}
