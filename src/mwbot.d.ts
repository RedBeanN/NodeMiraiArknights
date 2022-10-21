/**
 * @author RedBeanN
 * @description
 * Typedef for `mwbot` for internal usage.
 */

declare module 'mwbot' {
  type MWBotOptions = {
    apiUrl: string,
    verbose?: boolean,
    silent?: boolean,
    defaultSummary?: string,
    concurrency?: number,
    sparqlEndpoint?: string,
  }
  type RequestBody = {
    action: string,
    formatversion: number,
    prop: string,
    meta: string,
    siprop: string,
    iwurl: number,
    titles: string,
    redirects: number,
    converttitles: number,
    exchars: string,
    exlimit: string,
    explaintext: number,
    inprop: string,
  }
  type Page = {
    pageid?: number,
    ns: number,
    title: string,
    editurl: string,
    fullurl: string,
    canonicalurl: string,
    displaytitle: string,
    missing?: boolean,
    contentmodel: string,
    extract?: string,
    pagelanguage: string,
    pagelanguagehtmlcode: string,
    pagelanguagedir: string,
    touched?: string,
    invalid?: boolean,
    special?: boolean,
    invalidreason?: string,
    lastrevid?: number,
    length?: number,
  }
  type Namespace = {
    id: number,
    case: string,
    name: string,
    subpages: boolean,
    cononical: string,
    content: boolean,
    nonincludable: boolean,
    defaultcontentmodel?: string,
    namespaceprotection?: string,
  }
  type RequestResponse = {
    redirects: Array<{ from: string, to: string, tofragment?: string }>,
    pages: Array<Page>,
    interwiki: Array<{ url: string }>,
    specialpagealiases: Array<{ realname: string, aliases: string[] }>,
    namespaces: { [key: string]: Namespace },
  }
  class MWBot {
    constructor (options: MWBotOptions)
    options: MWBotOptions
    public globalRequestOptions: {
      headers: normalObj,
      timeout: number,
    }
    request(body: RequestBody): Promise<{ query: RequestResponse, error: Error | null }>
  }
  export = MWBot
}
