/* @flow */
import pathToRegexp from "path-to-regexp";

const decode = function(val: string) : string {
  return val ? decodeURIComponent(val) : "";
};

export default class HttpMethodRoute {
    method: string;
    url: string;
    re: RegExp;
    handler: HandlerType;
    keys: Array<PathToRegExpKeyType>;
    options: HttpMethodRouteOptionsType;

    constructor(url: string, method: string, handler: HandlerType, options?: HttpMethodRouteOptionsType) {
        this.keys = [];
        this.url = url;
        this.method = method;
        this.handler = handler;
        this.options = options || { argumentsAsObject: false };
        this.re = pathToRegexp(url, this.keys);
    }


    async handle(context: ContextType) : Promise<RouteHandlerResultType> {
        if (!this.method || (this.method === context.method)) {
            const m = this.re.exec(context.path || "");
            if (m) {
                const args = m.slice(1).map(decode);

                if (this.options.argumentsAsObject === true) {
                    const objArgs = {};
                    this.keys.forEach((key, i) => {
                        objArgs[key.name] = args[i];
                    });
                    const result = await this.handler.apply(context, [context, objArgs]);
                    return { keepChecking: false, args, keys: this.keys, result };
                } else {
                    const result = await this.handler.apply(context, [context].concat(args));
                    return { keepChecking: false, args, keys: this.keys, result };
                }
            }
        }
        return { keepChecking: true };
    }
}
